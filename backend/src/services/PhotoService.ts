import { db, bucket } from '../config/firebaseAdmin';
import { Photo, PhotoMetadata, PhotoQueryFilters } from '../@types/Photo';
import { PhotoMetadataUtil } from '../utils/photoMetadata';
import { v4 as uuidv4 } from 'uuid';

export class PhotoService {
  private static instance: PhotoService;

  public static getInstance(): PhotoService {
    if (!PhotoService.instance) {
      PhotoService.instance = new PhotoService();
    }
    return PhotoService.instance;
  }

  /**
   * Upload photo with metadata extraction
   */
  async uploadPhoto(
    userId: string, 
    file: Express.Multer.File
  ): Promise<{ photo: Photo | null; error: string | null }> {
    try {
      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `photos/${userId}/${uuidv4()}.${fileExtension}`;
      const filePath = `thumbnails/${userId}/${uuidv4()}_thumb.jpg`;

      // Extract metadata
      const metadata = await PhotoMetadataUtil.extractMetadata(file.buffer, file.originalname);

      // Upload original to Firebase Storage
      const fileRef = bucket.file(fileName);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            userId: userId,
            originalName: file.originalname
          }
        }
      });

      // Generate download URL
      const [downloadURL] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future expiration
      });

      // Create thumbnail (simplified - you'd use Sharp here)
      const thumbnailURL = await this.generateThumbnail(userId, file.buffer, filePath);

      // Create photo document
      const photoData: Omit<Photo, 'id'> = {
        userId,
        fileName: file.originalname,
        filePath: fileName,
        downloadURL,
        thumbnailURL,
        metadata,
        location: metadata.gps ? {
          latitude: metadata.gps.latitude,
          longitude: metadata.gps.longitude
        } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: PhotoMetadataUtil.generateTags(metadata, file.originalname),
        isPublic: false
      };

      const docRef = await db.collection('photos').add(photoData);
      
      const photo: Photo = {
        id: docRef.id,
        ...photoData
      };

      return { photo, error: null };
    } catch (error: any) {
      console.error('Photo upload error:', error);
      return { photo: null, error: 'Failed to upload photo' };
    }
  }

  /**
   * Generate thumbnail (placeholder implementation)
   */
  private async generateThumbnail(
    userId: string, 
    buffer: Buffer, 
    filePath: string
  ): Promise<string> {
    // In a real implementation, you'd use Sharp to create thumbnails
    // For now, return the original URL or a placeholder
    try {
      const thumbRef = bucket.file(filePath);
      // You would process the buffer with Sharp and save the thumbnail
      // await thumbRef.save(processedBuffer, { ... });
      
      const [thumbnailURL] = await thumbRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });

      return thumbnailURL;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      // Return original URL if thumbnail generation fails
      return '';
    }
  }

  /**
   * Get user photos with filtering
   */
  async getUserPhotos(
    userId: string, 
    filters: PhotoQueryFilters = {}
  ): Promise<{ photos: Photo[]; total: number; error?: string }> {
    try {
      let query: FirebaseFirestore.Query = db.collection('photos')
        .where('userId', '==', userId);

      // Apply filters
      if (filters.year) {
        const startDate = new Date(filters.year, 0, 1).toISOString();
        const endDate = new Date(filters.year + 1, 0, 1).toISOString();
        query = query.where('metadata.takenAt', '>=', startDate)
                     .where('metadata.takenAt', '<', endDate);
      }

      if (filters.tripId) {
        query = query.where('tripId', '==', filters.tripId);
      }

      if (filters.hasLocation) {
        query = query.where('location', '!=', null);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', filters.tags);
      }

      // Get total count
      const countQuery = query;
      const totalSnapshot = await countQuery.get();
      const total = totalSnapshot.size;

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      // Order by date taken or creation date
      query = query.orderBy('metadata.takenAt', 'desc')
                   .orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      const photos: Photo[] = [];

      snapshot.forEach(doc => {
        photos.push({
          id: doc.id,
          ...doc.data()
        } as Photo);
      });

      return { photos, total };
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      return { photos: [], total: 0, error: 'Failed to fetch photos' };
    }
  }

  /**
   * Get photo by ID
   */
  async getPhotoById(photoId: string, userId: string): Promise<{ photo: Photo | null; error?: string }> {
    try {
      const doc = await db.collection('photos').doc(photoId).get();
      
      if (!doc.exists) {
        return { photo: null, error: 'Photo not found' };
      }

      const photo = { id: doc.id, ...doc.data() } as Photo;

      // Check ownership
      if (photo.userId !== userId) {
        return { photo: null, error: 'Access denied' };
      }

      return { photo };
    } catch (error: any) {
      console.error('Error fetching photo:', error);
      return { photo: null, error: 'Failed to fetch photo' };
    }
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const photoDoc = await db.collection('photos').doc(photoId).get();
      
      if (!photoDoc.exists) {
        return { success: false, error: 'Photo not found' };
      }

      const photo = photoDoc.data() as Photo;

      // Verify ownership
      if (photo.userId !== userId) {
        return { success: false, error: 'Access denied' };
      }

      // Delete from storage
      const fileRef = bucket.file(photo.filePath);
      await fileRef.delete();

      // Delete thumbnail if exists
      if (photo.thumbnailURL) {
        const thumbPath = photo.thumbnailURL.split('/').pop();
        if (thumbPath) {
          const thumbRef = bucket.file(`thumbnails/${userId}/${thumbPath}`);
          await thumbRef.delete().catch(() => {}); // Ignore errors for thumbnails
        }
      }

      // Delete from Firestore
      await db.collection('photos').doc(photoId).delete();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      return { success: false, error: 'Failed to delete photo' };
    }
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(
    photoId: string, 
    userId: string, 
    updates: Partial<Photo>
  ): Promise<{ photo: Photo | null; error?: string }> {
    try {
      const photoDoc = await db.collection('photos').doc(photoId).get();
      
      if (!photoDoc.exists) {
        return { photo: null, error: 'Photo not found' };
      }

      const currentPhoto = photoDoc.data() as Photo;

      // Verify ownership
      if (currentPhoto.userId !== userId) {
        return { photo: null, error: 'Access denied' };
      }

      // Remove fields that shouldn't be updated
      const { id, userId: _, createdAt, ...allowedUpdates } = updates;
      allowedUpdates.updatedAt = new Date().toISOString();

      await db.collection('photos').doc(photoId).update(allowedUpdates);

      // Get updated photo
      const updatedDoc = await db.collection('photos').doc(photoId).get();
      const updatedPhoto = { id: updatedDoc.id, ...updatedDoc.data() } as Photo;

      return { photo: updatedPhoto };
    } catch (error: any) {
      console.error('Error updating photo:', error);
      return { photo: null, error: 'Failed to update photo' };
    }
  }
}

export const photoService = PhotoService.getInstance();