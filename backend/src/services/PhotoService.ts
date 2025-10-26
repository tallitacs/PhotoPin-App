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

  // Add other methods as needed...
}