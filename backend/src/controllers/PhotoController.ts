import { Request, Response } from 'express';
import { photoService } from '../services/PhotoService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Helper function to get authenticated user
function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user || req.user.uid === 'anonymous') {
    return null;
  }
  return req.user;
}

export class PhotoController {
  static async uploadPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || !req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'User authentication or file missing' 
        });
      }

      const result = await photoService.uploadPhoto(user.uid, req.file);

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: result.photo
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async uploadMultiplePhotos(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user || !req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ 
          success: false, 
          error: 'User authentication or files missing' 
        });
      }

      const uploadPromises = req.files.map(file => 
        photoService.uploadPhoto(user.uid, file)
      );
      
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.photo);
      const errors = results.filter(result => result.error);

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${successfulUploads.length} photos`,
        uploaded: successfulUploads.map(r => r.photo),
        errors: errors.map(e => e.error)
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
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
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total,
        page: page ? parseInt(page as string) : 1
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { photoId } = req.params;
      const result = await photoService.getPhotoById(photoId, user.uid);

      if (result.error) {
        return res.status(404).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        photo: result.photo
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updatePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { photoId } = req.params;
      const result = await photoService.updatePhoto(photoId, user.uid, req.body);

      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: 'Photo updated successfully',
        photo: result.photo
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deletePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { photoId } = req.params;
      const result = await photoService.deletePhoto(photoId, user.uid);

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTimeline(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { year, month } = req.query;
      const filters = {
        year: year ? parseInt(year as string) : undefined,
        month: month ? parseInt(month as string) : undefined
      };

      const result = await photoService.getPhotoTimeline(user.uid, filters);

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        timeline: result.timeline,
        total: result.total
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getMapPins(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await photoService.getPhotosWithLocation(user.uid);

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async searchPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ success: false, error: 'Search query required' });
      }

      const result = await photoService.searchPhotos(user.uid, q as string);

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}