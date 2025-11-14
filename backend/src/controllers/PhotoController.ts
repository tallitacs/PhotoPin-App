import { Response, Express } from 'express';
import { photoService } from '../services/PhotoService';
// Import from the correct @types directory
import { AuthenticatedRequest } from '../@types/express';

// Helper function to get authenticated user
function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user || req.user.uid === 'anonymous') {
    return null;
  }
  return req.user;
}

export class PhotoController {
  static async uploadPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || !req.file) {
        res.status(400).json({ 
          success: false, 
          error: 'User authentication or file missing' 
        });
        return;
      }

      const result = await photoService.uploadPhoto(user.uid, req.file);

      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }
      
      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: result.photo
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async uploadMultiplePhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || !req.files || !Array.isArray(req.files)) {
        res.status(400).json({ 
          success: false, 
          error: 'User authentication or files missing' 
        });
        return;
      }

      // Explicitly type 'file' here to fix implicit any
      const uploadPromises = (req.files as Express.Multer.File[]).map((file: Express.Multer.File) => 
        photoService.uploadPhoto(user.uid, file)
      );
      
      const results = await Promise.all(uploadPromises);
      
      // Explicitly type 'result' here
      type UploadResult = { photo?: any; error?: any };

      const successfulUploads = results.filter((result: UploadResult) => result.photo);
      const errors = results.filter((result: UploadResult) => result.error);

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${successfulUploads.length} photos`,
        // Explicitly type 'r' and 'e' here
        uploaded: successfulUploads.map((r: { photo?: any }) => r.photo),
        errors: errors.map((e: { error?: any }) => e.error)
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async getPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { limit, page, year, month, tripId, hasLocation, tags } = req.query;

      const filters = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : 0,
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined,
        tripId: tripId as string,
        hasLocation: hasLocation === 'true',
        tags: tags ? (tags as string).split(',') : undefined
      };

      const result = await photoService.getUserPhotos(user.uid, filters);

      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total,
        page: page ? parseInt(page as string) : 1
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async getPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { photoId } = req.params;
      const result = await photoService.getPhotoById(photoId, user.uid);

      if (result.error) {
        res.status(404).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        photo: result.photo
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async updatePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { photoId } = req.params;
      const result = await photoService.updatePhoto(photoId, user.uid, req.body);

      if (result.error) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'Photo updated successfully',
        photo: result.photo
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { photoId } = req.params;
      const result = await photoService.deletePhoto(photoId, user.uid);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async getTimeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { year, month } = req.query;
      const filters = {
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined
      };

      const result = await photoService.getPhotoTimeline(user.uid, filters);

      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        timeline: result.timeline,
        total: result.total
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async getMapPins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await photoService.getPhotosWithLocation(user.uid);

      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async searchPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { q } = req.query;
      
      if (!q) {
        res.status(400).json({ success: false, error: 'Search query required' });
        return;
      }

      const result = await photoService.searchPhotos(user.uid, q as string);

      if (result.error) {
        res.status(500).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }
}