import { db, bucket } from '../config/firebaseAdmin';
import { PhotoMetadataUtil } from '../utils/photoMetadata';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
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
  async uploadPhoto(userId: string, file: Express.Multer.File, tripId?: string): Promise<PhotoUploadResult> {
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
      
      // Ensure takenAt is always set (required for queries)
      if (!metadata.takenAt) {
        metadata.takenAt = new Date().toISOString();
        console.log('No EXIF date found, using current date');
      }

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
        tripId: tripId || undefined, // Associate with trip/album if provided
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save photo document to Firestore database
      console.log('Saving photo to Firestore:', { photoId, userId, fileName: file.originalname, tripId });
      await this.photosCollection.doc(photoId).set(photoData);
      console.log('Photo saved successfully to Firestore');

      // If tripId is provided, update the trip's photoIds and coverPhotoUrl
      if (tripId) {
        try {
          const tripRef = db.collection('trips').doc(tripId);
          const tripDoc = await tripRef.get();
          
          if (tripDoc.exists) {
            const trip = tripDoc.data();
            if (trip && trip.userId === userId) {
              const currentPhotoIds = trip.photoIds || [];
              if (!currentPhotoIds.includes(photoId)) {
                await tripRef.update({
                  photoIds: [...currentPhotoIds, photoId],
                  coverPhotoUrl: trip.coverPhotoUrl || thumbnailUrl, // Set cover if not already set
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }
        } catch (tripError) {
          console.warn('Failed to update trip with new photo:', tripError);
          // Don't fail the upload if trip update fails
        }
      }

      return { photo: photoData };
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
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
      // Allow setting tripId to null/undefined to remove photo from trip/album
      if (updates.tripId !== undefined) {
        allowedUpdates.tripId = updates.tripId || null;
      }
      if (updates.displayName !== undefined) allowedUpdates.displayName = updates.displayName || null; // Allow clearing displayName
      if (updates.isFavorite !== undefined) allowedUpdates.isFavorite = updates.isFavorite || false;
      if (updates.metadata) {
        allowedUpdates.metadata = {
          ...photo.metadata,
          ...updates.metadata
        };
        // If GPS is explicitly set to undefined/null, remove it
        if (updates.metadata.gps === undefined || updates.metadata.gps === null) {
          allowedUpdates.metadata.gps = null;
        }
      }
      
      // Update location if provided (for reverse geocoded location info)
      // Allow setting location to null to clear it, or updating with address/city/country without GPS
      if (updates.location !== undefined) {
        if (updates.location === null) {
          // Clear location
          allowedUpdates.location = null;
        } else {
          // Update location (can include just address/city/country without GPS)
          allowedUpdates.location = {
            ...photo.location, // Preserve existing location data
            ...updates.location // Override with new values
          };
        }
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

  // Rotate photo by specified angle (90, 180, or 270 degrees)
  async rotatePhoto(photoId: string, userId: string, angle: number): Promise<PhotoQueryResult> {
    try {
      // Validate angle
      if (![90, 180, 270].includes(angle)) {
        return { error: 'Invalid rotation angle. Must be 90, 180, or 270 degrees.' };
      }

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

      // Get current rotation or default to 0
      const currentRotation = photo.metadata?.rotation || 0;
      const newRotation = (currentRotation + angle) % 360;

      // Download original image from storage
      const fileRef = bucket.file(photo.storagePath);
      const [fileBuffer] = await fileRef.download();

      // Rotate image using Sharp
      const rotatedBuffer = await sharp(fileBuffer)
        .rotate(angle)
        .toBuffer();

      // Get file metadata
      const [fileMetadata] = await fileRef.getMetadata();

      // Upload rotated image back to storage
      await fileRef.save(rotatedBuffer, {
        metadata: {
          contentType: fileMetadata.contentType,
          metadata: fileMetadata.metadata
        }
      });

      // Regenerate thumbnail with rotation
      const thumbnailBuffer = await PhotoMetadataUtil.generateThumbnail(rotatedBuffer);
      
      // Extract thumbnail path from thumbnailUrl
      const thumbnailPath = photo.thumbnailUrl 
        ? photo.thumbnailUrl.split('/').slice(-2).join('/') // Get last 2 parts (thumbnails/filename)
        : photo.storagePath.replace('photos', 'thumbnails').replace(/\.[^.]+$/, '_thumb.jpg');
      
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
      
      // Make thumbnail public
      await thumbnailRef.makePublic();

      // Get new dimensions after rotation
      const rotatedMetadata = await sharp(rotatedBuffer).metadata();
      const newWidth = rotatedMetadata.width || photo.metadata.width;
      const newHeight = rotatedMetadata.height || photo.metadata.height;

      // Update photo document with new rotation and dimensions
      await this.photosCollection.doc(photoId).update({
        'metadata.rotation': newRotation,
        'metadata.width': newWidth,
        'metadata.height': newHeight,
        updatedAt: new Date().toISOString()
      });

      // Fetch and return updated photo
      const updatedDoc = await this.photosCollection.doc(photoId).get();
      return { photo: updatedDoc.data() as Photo };
    } catch (error: any) {
      console.error('Rotate photo error:', error);
      return { error: error.message || 'Failed to rotate photo' };
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

  // Get photos that have location data (GPS or address) for map display
  async getPhotosWithLocation(userId: string): Promise<PhotosQueryResult> {
    try {
      // Get all user photos (we'll filter for location data client-side)
      // This is more flexible than querying by tag since location can be added manually
      // Remove orderBy to avoid index requirement - we'll sort client-side if needed
      const query = this.photosCollection
        .where('userId', '==', userId);

      const snapshot = await query.get();
      const photos: Photo[] = [];

      console.log(`Found ${snapshot.size} total photos for user ${userId}`);

      // Filter to include photos with GPS coordinates OR location address data
      snapshot.forEach((doc) => {
        const photo = doc.data() as Photo;
        
        // Debug logging
        const hasGPS = !!(photo.metadata?.gps?.latitude && photo.metadata?.gps?.longitude);
        const hasLocation = !!(photo.location && (photo.location.address || photo.location.city || photo.location.country));
        
        if (hasGPS) {
          console.log(`Photo ${photo.id} has GPS:`, photo.metadata?.gps);
          photos.push(photo);
        } else if (hasLocation) {
          console.log(`Photo ${photo.id} has location data:`, photo.location);
          // Photo has address but no GPS - will need geocoding on frontend
          photos.push(photo);
        } else {
          console.log(`Photo ${photo.id} (${photo.fileName}) has no location data`);
        }
      });

      console.log(`Returning ${photos.length} photos with location data`);
      return { photos, total: photos.length };
    } catch (error: any) {
      console.error('Get location photos error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
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

      // If there's an error (not just no photos), return it
      if (result.error) {
        return { error: result.error };
      }

      // If no photos found, return empty timeline (not an error)
      if (!result.photos || result.photos.length === 0) {
        return { timeline: {}, total: 0 };
      }

      // Group photos by date (YYYY-MM-DD format)
      const timeline: { [key: string]: Photo[] } = {};

      result.photos.forEach(photo => {
        // Extract date from takenAt timestamp
        // Handle cases where metadata might be undefined
        const date = photo.metadata?.takenAt
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