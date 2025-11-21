import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PhotoService } from './PhotoService';
import axios from 'axios';

export class GooglePhotosService {
  // OAuth2 client for Google Photos API authentication
  private oauth2Client: OAuth2Client;

  // Initialize OAuth2 client with credentials from environment
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_PHOTOS_CLIENT_ID,
      process.env.GOOGLE_PHOTOS_CLIENT_SECRET,
      process.env.GOOGLE_PHOTOS_REDIRECT_URI
    );
  }

  // Generate OAuth2 authorization URL for user consent
  getAuthUrl(): string {
    // Request read-only access to Google Photos library
    const scopes = [
      'https://www.googleapis.com/auth/photoslibrary.readonly'
    ];

    // Generate authorization URL with offline access
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  }

  // Exchange authorization code for access and refresh tokens
  async getTokens(code: string) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      // Set credentials for future API calls
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Import photos from Google Photos with metadata extraction
  async importPhotos(userId: string, accessToken: string, limit: number = 50) {
    try {
      // Set access token for API calls
      this.oauth2Client.setCredentials({ access_token: accessToken });

      // Fetch media items from Google Photos API
      const response = await axios.get('https://photoslibrary.googleapis.com/v1/mediaItems', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          pageSize: limit
        }
      });

      // Initialize photo service and track results
      const photoService = new PhotoService();
      const imported: any[] = [];
      const errors: any[] = [];

      // Process each media item from Google Photos
      for (const item of response.data.mediaItems || []) {
        try {
          // Skip video files (only process images)
          if (item.mimeType && item.mimeType.startsWith('video/')) {
            continue;
          }

          // Construct full resolution download URL
          const photoUrl = item.baseUrl ? `${item.baseUrl}=d` : item.baseUrl;

          // Download photo image data
          const imageResponse = await axios.get(photoUrl, {
            responseType: 'arraybuffer'
          });

          // Create a file-like object
          const file: any = {
            buffer: Buffer.from(imageResponse.data),
            originalname: item.filename || `google-photo-${item.id}.jpg`,
            mimetype: item.mimeType || 'image/jpeg',
            size: imageResponse.data.byteLength
          };

          // Upload photo to PhotoPin (extracts EXIF metadata)
          const { photo, error } = await photoService.uploadPhoto(userId, file);

          // Track upload errors
          if (error) {
            errors.push({ filename: item.filename, error });
            continue;
          }

          // Enhance photo metadata with Google Photos API data
          if (photo && item.mediaMetadata) {
            const updates: any = {};

            // Add creation time from Google Photos if not in EXIF
            if (item.mediaMetadata.creationTime && !photo.metadata.takenAt) {
              updates.metadata = {
                ...photo.metadata,
                takenAt: new Date(item.mediaMetadata.creationTime).toISOString()
              };
            }

            // Add camera make/model from Google Photos metadata
            if (item.mediaMetadata.photo && item.mediaMetadata.photo.cameraMake) {
              if (!updates.metadata) updates.metadata = { ...photo.metadata };
              updates.metadata.cameraMake = item.mediaMetadata.photo.cameraMake;
            }
            if (item.mediaMetadata.photo && item.mediaMetadata.photo.cameraModel) {
              if (!updates.metadata) updates.metadata = { ...photo.metadata };
              updates.metadata.cameraModel = item.mediaMetadata.photo.cameraModel;
            }

            // Save enhanced metadata to database
            if (updates.metadata) {
              await photoService.updatePhoto(photo.id, userId, updates);
              // Update local photo object for return
              photo.metadata = updates.metadata;
            }
          }

          // Track successfully imported photo
          imported.push(photo);
        } catch (error: any) {
          console.error(`Error importing ${item.filename}:`, error);
          errors.push({
            filename: item.filename || item.id,
            error: error.message || 'Unknown error'
          });
        }
      }

      return { imported, errors };
    } catch (error: any) {
      console.error('Google Photos import error:', error);
      throw error;
    }
  }

  // Get detailed metadata for a specific media item from Google Photos
  async getMediaItemDetails(accessToken: string, mediaItemId: string) {
    try {
      // Fetch detailed information about a specific media item
      const response = await axios.get(
        `https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching media item details:', error);
      throw error;
    }
  }
}

export const googlePhotosService = new GooglePhotosService();