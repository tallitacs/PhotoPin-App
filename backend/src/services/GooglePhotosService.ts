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
    console.log('GooglePhotosService initialized with OAuth2Client:', {
      clientId: process.env.GOOGLE_PHOTOS_CLIENT_ID?.substring(0, 20) + '...',
      clientSecret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET ? '********' : 'NOT_SET',
      redirectUri: process.env.GOOGLE_PHOTOS_REDIRECT_URI
    });
  }

  // Generate OAuth2 authorization URL for user consent
  getAuthUrl(): string {
    // Request read-only access to Google Photos library
    const scopes = [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.sharing'
    ];

    const redirectUri = process.env.GOOGLE_PHOTOS_REDIRECT_URI;
    console.log('OAuth Configuration:', {
      clientId: process.env.GOOGLE_PHOTOS_CLIENT_ID?.substring(0, 20) + '...',
      redirectUri: redirectUri,
      scopes: scopes
    });

    // Generate authorization URL with offline access
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: false
    });

    console.log('Generated Auth URL:', authUrl);
    console.log('⚠️ IMPORTANT: Make sure you grant ALL permissions when the consent screen appears!');
    return authUrl;
  }

  // Exchange authorization code for access and refresh tokens
  async getTokens(code: string) {
    try {
      console.log('Exchanging authorization code for tokens...');
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      // Verify token scopes
      if (tokens.access_token) {
        try {
          const tokenInfo = await this.verifyToken(tokens.access_token);
          if (tokenInfo) {
            console.log('Token scopes after exchange:', tokenInfo.scope);

            // Validate that the token has the required Google Photos scope
            const scopes = tokenInfo.scope?.split(' ') || [];
            const hasPhotosScope = scopes.some((scope: string) =>
              scope.includes('photoslibrary.readonly') ||
              scope.includes('photoslibrary.sharing')
            );

            if (!hasPhotosScope) {
              console.error('❌ CRITICAL: Token does NOT have Google Photos scope!');
              console.error('Token scopes:', scopes);
              console.error('Expected scope: https://www.googleapis.com/auth/photoslibrary.readonly');
              throw new Error('Token does not have required Google Photos permissions. Please disconnect, clear browser cache/cookies for Google, and reconnect. Make sure to grant ALL permissions when prompted.');
            } else {
              console.log('✅ Token has required Google Photos scope');
            }
          }
        } catch (verifyError: any) {
          // If verification fails, log but don't fail - the API call will tell us if there's a problem
          if (verifyError.message && verifyError.message.includes('required Google Photos permissions')) {
            throw verifyError;
          }
          console.warn('Could not verify token scopes:', verifyError);
        }
      }

      console.log('Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown',
        tokenType: tokens.token_type,
        scope: tokens.scope
      });

      // Set credentials for future API calls
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token!;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Verify token info (for debugging)
  async verifyToken(accessToken: string) {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v1/tokeninfo',
        {
          params: { access_token: accessToken }
        }
      );
      console.log('✅ Token info verified:', {
        audience: response.data.audience,
        scope: response.data.scope,
        expires_in: response.data.expires_in,
        email: response.data.email
      });
      return response.data;
    } catch (error: any) {
      console.warn('⚠️ Token verification failed (this is OK, continuing anyway):', error.response?.data || error.message);
      // Don't fail if token verification fails - the API call itself will tell us if there's a problem
      return null;
    }
  }

  // Fetch list of photos from Google Photos (without importing)
  async listPhotos(accessToken: string, limit: number = 100, pageToken?: string) {
    try {
      console.log('Fetching photos list from Google Photos API...');

      // Verify token has the right scopes (for debugging, but don't fail if verification fails)
      const tokenInfo = await this.verifyToken(accessToken);
      if (tokenInfo) {
        const scopes = tokenInfo.scope?.split(' ') || [];
        console.log('📋 Token has scopes:', scopes);
        const hasPhotosScope = scopes.some((scope: string) =>
          scope.includes('photoslibrary.readonly') ||
          scope.includes('photoslibrary.sharing') ||
          scope.includes('photospicker')
        );
        if (!hasPhotosScope) {
          console.warn('⚠️ WARNING: Token verification shows no Google Photos scope!');
          console.warn('Token scopes:', scopes);
          console.warn('This might be a false positive - continuing with API call...');
        } else {
          console.log('✅ Token verification: Has Google Photos scope');
        }
      } else {
        console.log('ℹ️ Could not verify token scopes, but continuing with API call...');
      }

      const requestBody: any = {
        pageSize: Math.min(limit, 100) // API max is 100
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('API endpoint: https://photoslibrary.googleapis.com/v1/mediaItems:search');

      const response = await axios.post(
        'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Google Photos API response:', {
        mediaItemCount: response.data.mediaItems?.length || 0,
        nextPageToken: response.data.nextPageToken ? 'Yes' : 'No'
      });

      // Format photos for frontend display (only images, with thumbnails)
      const photos = (response.data.mediaItems || [])
        .filter((item: any) => !item.mimeType || !item.mimeType.startsWith('video/'))
        .map((item: any) => ({
          id: item.id,
          filename: item.filename,
          mimeType: item.mimeType,
          thumbnailUrl: item.baseUrl ? `${item.baseUrl}=w300-h300` : null, // Thumbnail URL
          fullUrl: item.baseUrl ? `${item.baseUrl}=d` : null, // Full resolution URL
          creationTime: item.mediaMetadata?.creationTime,
          width: item.mediaMetadata?.width,
          height: item.mediaMetadata?.height,
          cameraMake: item.mediaMetadata?.photo?.cameraMake,
          cameraModel: item.mediaMetadata?.photo?.cameraModel
        }));

      return {
        photos,
        nextPageToken: response.data.nextPageToken || null
      };
    } catch (error: any) {
      console.error('❌ Google Photos list error:', error);
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      };
      console.error('📋 Full error details:', JSON.stringify(errorDetails, null, 2));

      // Log the full error response for debugging
      if (error.response?.data) {
        console.error('🔍 Full error response from Google:', JSON.stringify(error.response.data, null, 2));
      }

      if (error.response?.status === 401) {
        throw new Error('Your Google session has expired. Please disconnect and reconnect to Google Photos.');
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || 'Access denied';
        const errorStatus = errorData?.error?.status || 'UNKNOWN';

        console.error('🚫 403 Forbidden Error Details:');
        console.error('   Error message:', errorMessage);
        console.error('   Error status:', errorStatus);
        console.error('   Full error object:', JSON.stringify(errorData, null, 2));

        // Check token scopes before throwing error
        try {
          const tokenInfo = await this.verifyToken(accessToken);
          if (tokenInfo) {
            console.error('   Token scopes:', tokenInfo.scope);
            const scopes = tokenInfo.scope?.split(' ') || [];
            const hasPhotosScope = scopes.some((scope: string) =>
              scope.includes('photoslibrary.readonly') ||
              scope.includes('photoslibrary.sharing')
            );
            if (!hasPhotosScope) {
              console.error('   ❌ Token does NOT have photoslibrary scope!');
              console.error('   Available scopes:', scopes);
            }
          }
        } catch (verifyErr) {
          console.warn('   Could not verify token scopes:', verifyErr);
        }

        // Provide more specific error messages
        if (errorMessage.includes('insufficient authentication scopes') ||
          errorMessage.includes('Insufficient Permission') ||
          errorMessage.includes('insufficient_scope') ||
          errorStatus === 'PERMISSION_DENIED') {
          throw new Error(`Access token does not have required permissions (${errorStatus}). The token may have been issued with different scopes. Please: 1) Disconnect, 2) Clear browser cache/cookies for Google, 3) Reconnect and grant ALL permissions when prompted. Please disconnect and reconnect to Google Photos.`);
        } else if (errorMessage.includes('Access denied') ||
          errorMessage.includes('Forbidden')) {
          throw new Error(`Access denied (${errorStatus}): ${errorMessage}. Please disconnect and reconnect to Google Photos.`);
        } else {
          // Include the actual error message from Google
          throw new Error(`Access denied (${errorStatus}): ${errorMessage}. Please check your Google Cloud Console OAuth consent screen configuration.`);
        }
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        throw new Error(`Invalid request: ${errorData?.error?.message || error.message}`);
      }

      // Re-throw with original message for other errors
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch photos from Google Photos');
    }
  }

  // Import specific photos from Google Photos by their IDs
  async importSelectedPhotos(userId: string, accessToken: string, photoIds: string[]) {
    try {
      console.log(`Importing ${photoIds.length} selected photos from Google Photos...`);

      if (photoIds.length === 0) {
        return { imported: [], errors: [] };
      }

      if (photoIds.length > 25) {
        throw new Error('Cannot import more than 25 photos at a time');
      }

      // Fetch details for selected photos
      const photoService = new PhotoService();
      const imported: any[] = [];
      const errors: any[] = [];

      // Get all photos first (we'll filter by IDs)
      const requestBody = {
        pageSize: 100 // Get up to 100 to find our selected ones
      };

      const response = await axios.post(
        'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Filter to only selected photos
      const selectedItems = (response.data.mediaItems || [])
        .filter((item: any) => photoIds.includes(item.id))
        .filter((item: any) => !item.mimeType || !item.mimeType.startsWith('video/'));

      console.log(`Found ${selectedItems.length} of ${photoIds.length} requested photos`);

      // Process each selected photo
      for (const item of selectedItems) {
        try {
          // Construct full resolution download URL
          const photoUrl = item.baseUrl ? `${item.baseUrl}=d` : item.baseUrl;

          if (!photoUrl) {
            errors.push({ filename: item.filename, error: 'No download URL available' });
            continue;
          }

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

  // Import photos from Google Photos with metadata extraction (legacy method - kept for backwards compatibility)
  async importPhotos(userId: string, accessToken: string, limit: number = 50) {
    try {
      console.log('Importing photos from Google Photos...');
      console.log('Access token (first 20 chars):', accessToken?.substring(0, 20) + '...');

      // Google Photos API requires using searchMediaItems endpoint
      const requestBody = {
        pageSize: Math.min(limit, 100) // API max is 100
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      console.log('API endpoint: https://photoslibrary.googleapis.com/v1/mediaItems:search');

      let response;
      try {
        response = await axios.post(
          'https://photoslibrary.googleapis.com/v1/mediaItems:search',
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Google Photos API response status:', response.status);
      } catch (apiError: any) {
        const errorDetails = {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message,
          headers: apiError.response?.headers
        };
        console.error('Google Photos API error:', JSON.stringify(errorDetails, null, 2));

        // Provide more specific error messages
        if (apiError.response?.status === 403) {
          const errorData = apiError.response?.data;
          if (errorData?.error?.message?.includes('insufficient authentication scopes')) {
            throw new Error('Access token does not have required permissions. Please reconnect to Google Photos.');
          } else if (errorData?.error?.message?.includes('Access denied')) {
            throw new Error('Access denied. Please reconnect to Google Photos and grant permissions.');
          } else {
            throw new Error(`Access denied (403): ${errorData?.error?.message || 'Please check your Google Photos API permissions'}`);
          }
        }
        throw apiError;
      }

      console.log('Google Photos API response:', {
        mediaItemCount: response.data.mediaItems?.length || 0,
        nextPageToken: response.data.nextPageToken ? 'Yes' : 'No'
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