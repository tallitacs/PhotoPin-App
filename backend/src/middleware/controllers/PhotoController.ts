import { db, storage } from '../config/firebaseAdmin';
import { Photo } from '../types/Photo';
import { extractMetadata } from '../utils/photoMetadata';

export class PhotoService {
  static async uploadPhoto(file: Express.Multer.File, userId: string, metadata: any): Promise<{ success: boolean; photoId?: string; photo?: Photo; error?: string }> {
    try {
      // Extract metadata from the image
      const extractedMetadata = await extractMetadata(file);
      
      // Upload file to Firebase Storage
      const bucket = storage.bucket();
      const fileName = `photos/${userId}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Make the file public
      await fileUpload.makePublic();
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      const photoData: Omit<Photo, 'id'> = {
        userId,
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

      // Save to Firestore
      const docRef = await db.collection('photos').add(photoData);

      const photo: Photo = {
        id: docRef.id,
        ...photoData
      };

      return { 
        success: true, 
        photoId: docRef.id,
        photo 
      };
    } catch (error: any) {
      console.error('Upload photo error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserPhotos(userId: string, options: { 
    limit?: number; 
    page?: number; 
    year?: number;
    location?: string;
    tripId?: string;
  } = {}): Promise<{ success: boolean; photos?: Photo[]; total?: number; page?: number; totalPages?: number; error?: string }> {
    try {
      let query: FirebaseFirestore.Query = db.collection('photos').where('userId', '==', userId);

      // Apply year filter
      if (options.year) {
        const startDate = new Date(options.year, 0, 1);
        const endDate = new Date(options.year, 11, 31, 23, 59, 59);
        query = query.where('metadata.timestamp', '>=', startDate)
                     .where('metadata.timestamp', '<=', endDate);
      }

      // Apply pagination
      const limit = options.limit || 50;
      const page = options.page || 1;

      // Get total count first
      const countSnapshot = await query.get();
      const total = countSnapshot.size;
      const totalPages = Math.ceil(total / limit);

      // Apply pagination to main query
      const offset = (page - 1) * limit;
      const snapshot = await query.orderBy('metadata.timestamp', 'desc')
                                 .limit(limit)
                                 .offset(offset)
                                 .get();

      const photos: Photo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));

      return { 
        success: true, 
        photos,
        total,
        page,
        totalPages
      };
    } catch (error: any) {
      console.error('Get user photos error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPhoto(userId: string, photoId: string): Promise<{ success: boolean; photo?: Photo; error?: string }> {
    try {
      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Photo not found' };
      }

      const photoData = doc.data();
      if (!photoData) {
        return { success: false, error: 'Photo data is invalid' };
      }

      const photo = photoData as Photo;
      
      if (photo.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      return { success: true, photo: { id: doc.id, ...photo } };
    } catch (error: any) {
      console.error('Get photo error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deletePhoto(userId: string, photoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Photo not found' };
      }

      const photoData = doc.data();
      if (!photoData) {
        return { success: false, error: 'Photo data is invalid' };
      }

      const photo = photoData as Photo;
      
      if (photo.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Delete from Storage
      const bucket = storage.bucket();
      const file = bucket.file(photo.filePath);
      await file.delete().catch(error => {
        console.warn('Could not delete file from storage:', error.message);
      });

      // Delete from Firestore
      await db.collection('photos').doc(photoId).delete();

      return { success: true };
    } catch (error: any) {
      console.error('Delete photo error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updatePhotoMetadata(userId: string, photoId: string, updates: any): Promise<{ success: boolean; photo?: Photo; error?: string }> {
    try {
      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Photo not found' };
      }

      const photoData = doc.data();
      if (!photoData) {
        return { success: false, error: 'Photo data is invalid' };
      }

      const photo = photoData as Photo;
      
      if (photo.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Update the photo in Firestore
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await db.collection('photos').doc(photoId).update(updateData);

      // Get the updated photo
      const updatedDoc = await db.collection('photos').doc(photoId).get();
      const updatedPhoto = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Photo;

      return { success: true, photo: updatedPhoto };
    } catch (error: any) {
      console.error('Update photo metadata error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPhotosByLocation(userId: string, location: string, options: { limit?: number; page?: number } = {}): Promise<{ success: boolean; photos?: Photo[]; total?: number; error?: string }> {
    try {
      // For now, we'll filter client-side since Firestore doesn't have built-in text search
      const result = await this.getUserPhotos(userId, { limit: 1000 });
      
      if (!result.success || !result.photos) {
        return result;
      }

      // Filter photos by location name (case-insensitive)
      const filteredPhotos = result.photos.filter(photo => 
        photo.metadata.locationName?.toLowerCase().includes(location.toLowerCase())
      );

      // Apply pagination
      const limit = options.limit || 50;
      const page = options.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);

      return {
        success: true,
        photos: paginatedPhotos,
        total: filteredPhotos.length
      };
    } catch (error: any) {
      console.error('Get photos by location error:', error);
      return { success: false, error: error.message };
    }
  }

  static async searchPhotos(userId: string, filters: { 
    query?: string; 
    year?: number; 
    location?: string; 
    tags?: string; 
    startDate?: string; 
    endDate?: string;
  }): Promise<{ success: boolean; photos?: Photo[]; total?: number; error?: string }> {
    try {
      // Get all user photos first (for simplicity, in production you'd use proper Firestore queries)
      const result = await this.getUserPhotos(userId, { limit: 1000 });
      
      if (!result.success || !result.photos) {
        return result;
      }

      let filteredPhotos = result.photos;

      // Apply search query filter
      if (filters.query) {
        const query = filters.query.toLowerCase();
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.fileName.toLowerCase().includes(query) ||
          photo.title?.toLowerCase().includes(query) ||
          photo.description?.toLowerCase().includes(query) ||
          photo.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply year filter
      if (filters.year) {
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoYear = new Date(photo.metadata.timestamp).getFullYear();
          return photoYear === filters.year;
        });
      }

      // Apply location filter
      if (filters.location) {
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.metadata.locationName?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoDate = new Date(photo.metadata.timestamp);
          return photoDate >= startDate && photoDate <= endDate;
        });
      }

      return {
        success: true,
        photos: filteredPhotos,
        total: filteredPhotos.length
      };
    } catch (error: any) {
      console.error('Search photos error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTimeline(userId: string, groupBy: string = 'month'): Promise<{ success: boolean; timeline?: any; error?: string }> {
    try {
      const result = await this.getUserPhotos(userId, { limit: 1000 });
      
      if (!result.success || !result.photos) {
        return { success: false, error: result.error };
      }

      const timeline: { [key: string]: Photo[] } = {};
      
      result.photos.forEach(photo => {
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

      return { success: true, timeline };
    } catch (error: any) {
      console.error('Get timeline error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTimelineByMonth(userId: string, year: number, month: number): Promise<{ success: boolean; photos?: Photo[]; total?: number; error?: string }> {
    try {
      const result = await this.getUserPhotos(userId, { limit: 1000 });
      
      if (!result.success || !result.photos) {
        return { success: false, error: result.error };
      }

      const monthPhotos = result.photos.filter(photo => {
        const date = new Date(photo.metadata.timestamp);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });

      return { 
        success: true, 
        photos: monthPhotos,
        total: monthPhotos.length
      };
    } catch (error: any) {
      console.error('Get timeline by month error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPhotoStats(userId: string): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const result = await this.getUserPhotos(userId, { limit: 1000 });
      
      if (!result.success || !result.photos) {
        return { success: false, error: result.error };
      }

      const stats = {
        totalPhotos: result.photos.length,
        byYear: {} as { [key: number]: number },
        byLocation: {} as { [key: string]: number },
        byCamera: {} as { [key: string]: number },
        byMonth: {} as { [key: string]: number }
      };

      result.photos.forEach(photo => {
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

      return { success: true, stats };
    } catch (error: any) {
      console.error('Get photo stats error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPhotosByYear(userId: string, year: number, options: { limit?: number; page?: number } = {}): Promise<{ success: boolean; photos?: Photo[]; total?: number; error?: string }> {
    try {
      const result = await this.getUserPhotos(userId, {
        year,
        limit: options.limit,
        page: options.page
      });

      return result;
    } catch (error: any) {
      console.error('Get photos by year error:', error);
      return { success: false, error: error.message };
    }
  }
}