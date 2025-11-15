import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PhotoService } from './PhotoService';
import axios from 'axios';

export class GooglePhotosService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_PHOTOS_CLIENT_ID,
      process.env.GOOGLE_PHOTOS_CLIENT_SECRET,
      process.env.GOOGLE_PHOTOS_REDIRECT_URI
    );
  }

  /**
   * Generate auth URL for user consent
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/photoslibrary.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Import photos from Google Photos
   */
  async importPhotos(userId: string, accessToken: string, limit: number = 50) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await axios.get('https://photoslibrary.googleapis.com/v1/mediaItems', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          pageSize: limit
        }
      });

      const photoService = new PhotoService();
      const imported: any[] = [];
      const errors: any[] = [];

      for (const item of response.data.mediaItems || []) {
        try {
          // Download photo
          const imageResponse = await axios.get(item.baseUrl, {
            responseType: 'arraybuffer'
          });

          // Create a file-like object
          const file: any = {
            buffer: Buffer.from(imageResponse.data),
            originalname: item.filename,
            mimetype: item.mimeType,
            size: imageResponse.data.byteLength
          };

          // Upload to PhotoPin
          const { photo, error } = await photoService.uploadPhoto(userId, file);

          if (error) {
            errors.push({ filename: item.filename, error });
          } else {
            imported.push(photo);
          }
        } catch (error: any) {
          errors.push({ filename: item.filename, error: error.message });
        }
      }

      return { imported, errors };
    } catch (error) {
      console.error('Google Photos import error:', error);
      throw error;
    }
  }
}

export const googlePhotosService = new GooglePhotosService();