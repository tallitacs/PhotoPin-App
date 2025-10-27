// src/middleware/controllers/PhotoController.ts
import { db, storage } from '../../config/firebaseAdmin';
import { Photo } from '../../@types/Photo'; 
import { extractMetadata } from '../../utils/photoMetadata';
import { Request, Response } from 'express'; 

// A custom interface to add the 'user' property from your AuthMiddleware
interface AuthenticatedRequest extends Request {
  user?: { uid: string; email: string };
}

export class PhotoController {

  static async uploadPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      // Extract data from the request object
      const file = req.file;
      const user = req.user;
      const metadata = req.body;

      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
      }
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      // Extract metadata from the image
      const extractedMetadata = await extractMetadata(file);
      
      const bucket = storage.bucket();
      const fileName = `photos/${user.uid}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      await fileUpload.makePublic();
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      const photoData: Omit<Photo, 'id'> = {
        userId: user.uid,
        fileName: file.originalname,
        filePath: fileName,
        downloadURL,
        metadata: {
          ...extractedMetadata,
          timestamp: extractedMetadata.timestamp || new Date(),
        },
        title: metadata.title || file.originalname,
        description: metadata.description || '',
        tags: metadata.tags || [],
        albumIds: metadata.albumIds || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('photos').add(photoData);

      const photo: Photo = {
        id: docRef.id,
        ...photoData
      };

      // Send response
      return res.status(201).json({ 
        success: true, 
        photoId: docRef.id,
        photo 
      });
    } catch (error: any) {
      console.error('Upload photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getUserPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      // Extract options from query parameters
      const options = req.query; 

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      let query: FirebaseFirestore.Query = db.collection('photos').where('userId', '==', user.uid);

      if (options.year) {
        const year = parseInt(options.year as string);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        query = query.where('metadata.timestamp', '>=', startDate)
                     .where('metadata.timestamp', '<=', endDate);
      }

      const limit = parseInt(options.limit as string) || 50;
      const page = parseInt(options.page as string) || 1;

      const countSnapshot = await query.get();
      const total = countSnapshot.size;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      const snapshot = await query.orderBy('metadata.timestamp', 'desc')
                                 .limit(limit)
                                 .offset(offset)
                                 .get();

      const photos: Photo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));

      // Send response
      return res.json({ 
        success: true, 
        photos,
        total,
        page,
        totalPages
      });
    } catch (error: any) {
      console.error('Get user photos error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      // Extract photoId from URL parameters
      const { photoId } = req.params; 

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Photo not found' });
      }

      const photoData = doc.data() as Photo;
      if (!photoData) {
        return res.status(404).json({ success: false, error: 'Photo data is invalid' });
      }
      
      if (photoData.userId !== user.uid) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      // Send response
      return res.json({ success: true, photo: { id: doc.id, ...photoData } });
    } catch (error: any) {
      console.error('Get photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deletePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { photoId } = req.params;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Photo not found' });
      }

      const photo = doc.data() as Photo;
      if (!photo) {
        return res.status(404).json({ success: false, error: 'Photo data is invalid' });
      }
      
      if (photo.userId !== user.uid) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      const bucket = storage.bucket();
      const file = bucket.file(photo.filePath);
      await file.delete().catch(error => {
        console.warn('Could not delete file from storage:', error.message);
      });

      await db.collection('photos').doc(photoId).delete();

      // Send response
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Delete photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updatePhotoMetadata(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { photoId } = req.params;
      // Extract updates from request body
      const updates = req.body; 

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Photo not found' });
      }

      const photo = doc.data() as Photo;
      if (!photo) {
        return res.status(404).json({ success: false, error: 'Photo data is invalid' });
      }
      
      if (photo.userId !== user.uid) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await db.collection('photos').doc(photoId).update(updateData);

      const updatedDoc = await db.collection('photos').doc(photoId).get();
      const updatedPhoto = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Photo;

      // Send response
      return res.json({ success: true, photo: updatedPhoto });
    } catch (error: any) {
      console.error('Update photo metadata error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhotosByLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { location } = req.query;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      if (!location) {
        return res.status(400).json({ success: false, error: 'Location query parameter is required.' });
      }

      // This is a simple text search, not a geo-query.
      // For real geo-queries, you'd need a different database structure or a third-party service.
      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
        return res.status(500).json(allPhotosResult);
      }

      // Filter photos by location name (case-insensitive)
      const filteredPhotos = allPhotosResult.photos.filter(photo => 
        photo.metadata.locationName?.toLowerCase().includes((location as string).toLowerCase())
      );

      return res.json({
        success: true,
        photos: filteredPhotos,
        total: filteredPhotos.length
      });
    } catch (error: any) {
      console.error('Get photos by location error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async searchPhotos(req: AuthenticatedRequest, res: Response) {
     try {
      const user = req.user;
      const filters = req.query;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
        return res.status(500).json(allPhotosResult);
      }

      let filteredPhotos = allPhotosResult.photos;

      // Apply search query filter
      if (filters.query) {
        const query = (filters.query as string).toLowerCase();
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.fileName.toLowerCase().includes(query) ||
          photo.title?.toLowerCase().includes(query) ||
          photo.description?.toLowerCase().includes(query) ||
          photo.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply year filter
      if (filters.year) {
        const year = parseInt(filters.year as string);
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoYear = new Date(photo.metadata.timestamp).getFullYear();
          return photoYear === year;
        });
      }

      // Apply location filter
      if (filters.location) {
        const location = (filters.location as string).toLowerCase();
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.metadata.locationName?.toLowerCase().includes(location)
        );
      }

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate as string) : new Date(0);
        const endDate = filters.endDate ? new Date(filters.endDate as string) : new Date();
        
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoDate = new Date(photo.metadata.timestamp);
          return photoDate >= startDate && photoDate <= endDate;
        });
      }

      return res.json({
        success: true,
        photos: filteredPhotos,
        total: filteredPhotos.length
      });

    } catch (error: any) {
      console.error('Search photos error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTimeline(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { groupBy } = req.query;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      
      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
        return res.status(500).json(allPhotosResult);
      }

      const timeline: { [key: string]: Photo[] } = {};
      
      allPhotosResult.photos.forEach(photo => {
        const date = new Date(photo.metadata.timestamp);
        let groupKey: string;

        switch (groupBy) {
          case 'year':
            groupKey = date.getFullYear().toString();
            break;
          case 'day':
            groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'month':
          default:
            groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
        }
        
        if (!timeline[groupKey]) {
          timeline[groupKey] = [];
        }
        
        timeline[groupKey].push(photo);
      });

      return res.json({ success: true, timeline });
    } catch (error: any) {
      console.error('Get timeline error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTimelineByMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { year, month } = req.query;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      if (!year || !month) {
        return res.status(400).json({ success: false, error: 'Year and month query parameters are required.' });
      }

      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);

      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
        return res.status(500).json(allPhotosResult);
      }

      const monthPhotos = allPhotosResult.photos.filter(photo => {
        const date = new Date(photo.metadata.timestamp);
        return date.getFullYear() === yearNum && date.getMonth() + 1 === monthNum;
      });

      return res.json({ 
        success: true, 
        photos: monthPhotos,
        total: monthPhotos.length
      });
    } catch (error: any) {
      console.error('Get timeline by month error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhotoStats(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }

      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
        return res.status(500).json(allPhotosResult);
      }

      const stats = {
        totalPhotos: allPhotosResult.photos.length,
        byYear: {} as { [key: number]: number },
        byLocation: {} as { [key: string]: number },
        byCamera: {} as { [key: string]: number },
        byMonth: {} as { [key: string]: number }
      };

      allPhotosResult.photos.forEach(photo => {
        const date = new Date(photo.metadata.timestamp);
        const year = date.getFullYear();
        const month = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const location = photo.metadata.locationName || 'Unknown';
        const camera = photo.metadata.cameraModel || 'Unknown';

        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
        stats.byCamera[camera] = (stats.byCamera[camera] || 0) + 1;
      });

      return res.json({ success: true, stats });
    } catch (error: any) {
      console.error('Get photo stats error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhotosByYear(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const { year } = req.query;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      if (!year) {
        return res.status(400).json({ success: false, error: 'Year query parameter is required.' });
      }

      const yearNum = parseInt(year as string);

      // We need the internal logic for getUserPhotos here, not the route handler itself
      // Reusing the private helper
      const allPhotosResult = await this.getAllUserPhotos(user.uid);
      if (!allPhotosResult.success || !allPhotosResult.photos) {
          return res.status(500).json(allPhotosResult);
      }

      const yearPhotos = allPhotosResult.photos.filter(photo => {
          const date = new Date(photo.metadata.timestamp);
          return date.getFullYear() === yearNum;
      });
      
      // Basic pagination (can be improved)
      const limit = parseInt(req.query.limit as string) || 50;
      const page = parseInt(req.query.page as string) || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPhotos = yearPhotos.slice(startIndex, endIndex);

      return res.json({ 
          success: true, 
          photos: paginatedPhotos,
          total: yearPhotos.length 
      });

    } catch (error: any) {
      console.error('Get photos by year error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // --- ADDED: Stubbed methods to fix compile errors ---

  static async uploadMultiplePhotos(req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ success: false, error: 'Not implemented: uploadMultiplePhotos' });
  }

  static async autoGroupPhotos(req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ success: false, error: 'Not implemented: autoGroupPhotos' });
  }

  static async getUserTrips(req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ success: false, error: 'Not implemented: getUserTrips' });
  }

  static async createTrip(req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ success: false, error: 'Not implemented: createTrip' });
  }

  static async getMapPins(req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ success: false, error: 'Not implemented: getMapPins' });
  }

  // --- ADDED: Private helper to get all photos for internal filtering ---
  private static async getAllUserPhotos(userId: string): Promise<{ success: boolean; photos?: Photo[]; error?: string }> {
    try {
      const photosRef = db.collection('photos').where('userId', '==', userId);
      const snapshot = await photosRef.orderBy('metadata.timestamp', 'desc').get();

      const photos: Photo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));

      return { success: true, photos };
    } catch (error: any) {
      console.error('Get all user photos helper error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

