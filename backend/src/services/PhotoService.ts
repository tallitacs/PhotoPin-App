import { db, bucket } from '../config/firebaseAdmin';
import { PhotoMetadataUtil } from '../utils/photoMetadata';
import { v4 as uuidv4 } from 'uuid';
import {
  Photo,
  PhotoUploadResult,
  PhotosQueryResult,
  PhotoQueryResult,
  PhotoDeleteResult,
  PhotoFilters
} from '../@types/Photo';

export class PhotoService {
  // Reference to Firestore photos collection
  private photosCollection = db.collection('photos');

  // Upload photo with thumbnail generation and metadata extraction
  async uploadPhoto(userId: string, file: Express.Multer.File): Promise<PhotoUploadResult> {
    try {
      // Validate file type
      if (!PhotoMetadataUtil.isValidImageFile(file.mimetype, file.originalname)) {
        return { error: 'Invalid image file type' };
      }

      // Generate unique identifiers and storage paths
      const photoId = uuidv4();
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const storagePath = `users/${userId}/photos/${timestamp}_${photoId}.${fileExtension}`;
      const thumbnailPath = `users/${userId}/thumbnails/${timestamp}_${photoId}_thumb.jpg`;

      // Extract EXIF metadata (GPS, camera info, date taken, etc.)
      const metadata = await PhotoMetadataUtil.extractMetadata(file.buffer, file.originalname);

      // Generate automatic tags based on metadata
      const tags = PhotoMetadataUtil.generateTags(metadata, file.originalname);

      // Generate thumbnail for faster loading
      const thumbnailBuffer = await PhotoMetadataUtil.generateThumbnail(file.buffer);

      // Upload original photo
      const fileRef = bucket.file(storagePath);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            userId,
            photoId,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Upload thumbnail
      const thumbnailRef = bucket.file(thumbnailPath);
      await thumbnailRef.save(thumbnailBuffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId,
            photoId,
            isThumbnail: 'true'
          }
        }
      });

      // Make files publicly accessible
      await Promise.all([
        fileRef.makePublic(),
        thumbnailRef.makePublic()
      ]);

      // Generate public URLs for accessing files
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
      const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

      // Create photo document for Firestore
      const photoData: Photo = {
        id: photoId,
        userId,
        fileName: file.originalname,
        storagePath,
        url: publicUrl,
        thumbnailUrl,
        metadata,
        tags,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save photo document to Firestore database
      await this.photosCollection.doc(photoId).set(photoData);

      return { photo: photoData };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { error: error.message || 'Failed to upload photo' };
    }
  }

  // Get user's photos with advanced filtering options
  async getUserPhotos(userId: string, filters: PhotoFilters = {}): Promise<PhotosQueryResult> {
    try {
      // Start with base query - filter by user ID
      let query: FirebaseFirestore.Query = this.photosCollection.where('userId', '==', userId);

      // Apply date range filters (year, month)
      if (filters.year) {
        const startDate = new Date(`${filters.year}-01-01`).toISOString();
        const endDate = new Date(`${filters.year}-12-31T23:59:59.999Z`).toISOString();
        query = query.where('metadata.takenAt', '>=', startDate)
          .where('metadata.takenAt', '<=', endDate);
      }

      if (filters.month && filters.year) {
        const startDate = new Date(`${filters.year}-${String(filters.month).padStart(2, '0')}-01`).toISOString();
        const endMonth = filters.month === 12 ? 1 : filters.month + 1;
        const endYear = filters.month === 12 ? filters.year + 1 : filters.year;
        const endDate = new Date(`${endYear}-${String(endMonth).padStart(2, '0')}-01`).toISOString();
        query = query.where('metadata.takenAt', '>=', startDate)
          .where('metadata.takenAt', '<', endDate);
      }

      if (filters.tripId) {
        query = query.where('tripId', '==', filters.tripId);
      }

      // Filter photos with GPS location data
      if (filters.hasLocation) {
        query = query.where('tags', 'array-contains', 'has-location');
      }

      // Sort by date taken (newest first) and apply limit
      query = query.orderBy('metadata.takenAt', 'desc');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      const photos: Photo[] = [];

      // Convert Firestore documents to Photo objects
      snapshot.forEach((doc) => {
        photos.push(doc.data() as Photo);
      });

      // Apply client-side tag filtering (Firestore doesn't support multiple array-contains)
      let filteredPhotos = photos;
      if (filters.tags && filters.tags.length > 0) {
        filteredPhotos = photos.filter(photo =>
          filters.tags!.every(tag => photo.tags.includes(tag))
        );
      }

      // Apply pagination offset
      if (filters.offset) {
        filteredPhotos = filteredPhotos.slice(filters.offset);
      }

      return { photos: filteredPhotos, total: filteredPhotos.length };
    } catch (error: any) {
      console.error('Get photos error:', error);
      return { error: error.message || 'Failed to retrieve photos' };
    }
  }

  // Get single photo by ID with ownership verification
  async getPhotoById(photoId: string, userId: string): Promise<PhotoQueryResult> {
    try {
      // Fetch photo document from Firestore
      const doc = await this.photosCollection.doc(photoId).get();

      // Check if photo exists
      if (!doc.exists) {
        return { error: 'Photo not found' };
      }

      const photo = doc.data() as Photo;

      // Verify user owns this photo
      if (photo.userId !== userId) {
        return { error: 'Access denied' };
      }

      return { photo };
    } catch (error: any) {
      console.error('Get photo error:', error);
      return { error: error.message || 'Failed to retrieve photo' };
    }
  }

  // Update photo metadata with ownership verification
  async updatePhoto(photoId: string, userId: string, updates: Partial<Photo>): Promise<PhotoQueryResult> {
    try {
      // Fetch photo to verify existence and ownership
      const doc = await this.photosCollection.doc(photoId).get();

      if (!doc.exists) {
        return { error: 'Photo not found' };
      }

      const photo = doc.data() as Photo;

      // Verify user owns this photo
      if (photo.userId !== userId) {
        return { error: 'Access denied' };
      }

      // Build allowed updates object (only specific fields can be updated)
      const allowedUpdates: any = {
        updatedAt: new Date().toISOString()
      };

      if (updates.tags) allowedUpdates.tags = updates.tags;
      if (updates.tripId !== undefined) allowedUpdates.tripId = updates.tripId;
      if (updates.metadata) {
        allowedUpdates.metadata = {
          ...photo.metadata,
          ...updates.metadata
        };
      }

      // Update photo document in Firestore
      await this.photosCollection.doc(photoId).update(allowedUpdates);

      // Fetch and return updated photo
      const updatedDoc = await this.photosCollection.doc(photoId).get();
      return { photo: updatedDoc.data() as Photo };
    } catch (error: any) {
      console.error('Update photo error:', error);
      return { error: error.message || 'Failed to update photo' };
    }
  }

  // Delete photo and associated files with ownership verification
  async deletePhoto(photoId: string, userId: string): Promise<PhotoDeleteResult> {
    try {
      // Fetch photo to verify existence and ownership
      const doc = await this.photosCollection.doc(photoId).get();

      if (!doc.exists) {
        return { success: false, error: 'Photo not found' };
      }

      const photo = doc.data() as Photo;

      // Verify user owns this photo
      if (photo.userId !== userId) {
        return { success: false, error: 'Access denied' };
      }

      // Delete files from Firebase Storage
      const deletePromises = [
        bucket.file(photo.storagePath).delete().catch(err =>
          console.warn('Original file delete failed:', err)
        )
      ];

      // Delete thumbnail if exists
      if (photo.thumbnailUrl) {
        const thumbnailPath = photo.thumbnailUrl.split(`${bucket.name}/`)[1];
        if (thumbnailPath) {
          deletePromises.push(
            bucket.file(thumbnailPath).delete().catch(err =>
              console.warn('Thumbnail delete failed:', err)
            )
          );
        }
      }

      // Wait for all file deletions to complete
      await Promise.all(deletePromises);

      // Delete photo document from Firestore
      await this.photosCollection.doc(photoId).delete();

      return { success: true };
    } catch (error: any) {
      console.error('Delete photo error:', error);
      return { success: false, error: error.message || 'Failed to delete photo' };
    }
  }

  // Get photos that have GPS location data for map display
  async getPhotosWithLocation(userId: string): Promise<PhotosQueryResult> {
    try {
      // Query photos with location tag, sorted by date
      const query = this.photosCollection
        .where('userId', '==', userId)
        .where('tags', 'array-contains', 'has-location')
        .orderBy('metadata.takenAt', 'desc');

      const snapshot = await query.get();
      const photos: Photo[] = [];

      // Filter to only include photos with actual GPS coordinates
      snapshot.forEach((doc) => {
        const photo = doc.data() as Photo;
        if (photo.metadata.gps) {
          photos.push(photo);
        }
      });

      return { photos, total: photos.length };
    } catch (error: any) {
      console.error('Get location photos error:', error);
      return { error: error.message || 'Failed to retrieve location photos' };
    }
  }

  // Search photos by filename, tags, or camera info
  async searchPhotos(userId: string, searchTerm: string): Promise<PhotosQueryResult> {
    try {
      // Get all user's photos (Firestore doesn't support full-text search)
      const snapshot = await this.photosCollection
        .where('userId', '==', userId)
        .get();

      const photos: Photo[] = [];
      const lowerSearchTerm = searchTerm.toLowerCase();

      // Filter photos by search term in memory
      snapshot.forEach((doc) => {
        const photo = doc.data() as Photo;
        // Build searchable text from filename, tags, and camera info
        const searchableText = [
          photo.fileName,
          ...photo.tags,
          photo.metadata.cameraMake || '',
          photo.metadata.cameraModel || ''
        ].join(' ').toLowerCase();

        // Check if search term matches
        if (searchableText.includes(lowerSearchTerm)) {
          photos.push(photo);
        }
      });

      // Sort by relevance (exact filename matches first)
      photos.sort((a, b) => {
        const aExact = a.fileName.toLowerCase() === lowerSearchTerm ? 1 : 0;
        const bExact = b.fileName.toLowerCase() === lowerSearchTerm ? 1 : 0;
        return bExact - aExact;
      });

      return { photos, total: photos.length };
    } catch (error: any) {
      console.error('Search photos error:', error);
      return { error: error.message || 'Failed to search photos' };
    }
  }

  // Get photos grouped by date for timeline view
  async getPhotoTimeline(userId: string, filters: PhotoFilters = {}): Promise<any> {
    try {
      // Get user's photos with filters
      const result = await this.getUserPhotos(userId, filters);

      if (result.error || !result.photos) {
        return { error: result.error || 'No photos found' };
      }

      // Group photos by date (YYYY-MM-DD format)
      const timeline: { [key: string]: Photo[] } = {};

      result.photos.forEach(photo => {
        // Extract date from takenAt timestamp
        const date = photo.metadata.takenAt
          ? new Date(photo.metadata.takenAt).toISOString().split('T')[0]
          : 'unknown';

        // Initialize date array if needed
        if (!timeline[date]) {
          timeline[date] = [];
        }
        timeline[date].push(photo);
      });

      return { timeline, total: result.photos.length };
    } catch (error: any) {
      console.error('Get timeline error:', error);
      return { error: error.message || 'Failed to retrieve timeline' };
    }
  }
}

export const photoService = new PhotoService();