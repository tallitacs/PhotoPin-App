import { Request, Response } from 'express';
import { photoService } from '../services/PhotoService';
import { AuthenticatedRequest } from '../@types/express';

export class PhotoController {
  
  static async uploadPhoto(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      const { photo, error } = await photoService.uploadPhoto(user.uid, req.file);

      if (error) {
        return res.status(500).json({ success: false, error });
      }
      
      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo
      });

    } catch (error: any) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async uploadMultiplePhotos(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No files uploaded' 
        });
      }

      const uploaded: any[] = [];
      const errors: any[] = [];

      for (const file of req.files) {
        const { photo, error } = await photoService.uploadPhoto(user.uid, file);
        
        if (error) {
          errors.push({ filename: file.originalname, error });
        } else {
          uploaded.push(photo);
        }
      }

      res.status(201).json({
        success: true,
        message: `Uploaded ${uploaded.length} of ${req.files.length} photos`,
        uploaded,
        errors
      });

    } catch (error: any) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPhotos(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;
      const { limit, page, year, tripId, hasLocation, tags } = req.query;

      const filters = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : 0,
        year: year ? parseInt(year as string) : undefined,
        tripId: tripId as string,
        hasLocation: hasLocation === 'true',
        tags: tags ? (tags as string).split(',') : undefined
      };

      const { photos, total, error } = await photoService.getUserPhotos(user.uid, filters);

      if (error) {
        return res.status(500).json({ success: false, error });
      }

      res.json({
        success: true,
        photos,
        total
      });

    } catch (error: any) {
      console.error('Get photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;

      const { timeline, total, error } = await photoService.getPhotoTimeline(user.uid);

      if (error) {
        return res.status(500).json({ success: false, error });
      }

      res.json({
        success: true,
        timeline: Object.entries(timeline).map(([date, photos]) => ({
          date,
          photos
        })),
        total
      });

    } catch (error: any) {
      console.error('Timeline error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getMapPins(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;

      const { photos, total, error } = await photoService.getPhotosWithLocation(user.uid);

      if (error) {
        return res.status(500).json({ success: false, error });
      }

      res.json({
        success: true,
        photos,
        total
      });

    } catch (error: any) {
      console.error('Map pins error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async searchPhotos(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const { photos, total, error } = await photoService.searchPhotos(user.uid, q as string);

      if (error) {
        return res.status(500).json({ success: false, error });
      }

      res.json({
        success: true,
        photos,
        total
      });

    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPhoto(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;

      const { photo, error } = await photoService.getPhotoById(photoId, user.uid);

      if (error) {
        return res.status(404).json({ success: false, error });
      }

      res.json({
        success: true,
        photo
      });

    } catch (error: any) {
      console.error('Get photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async updatePhoto(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;
      const updates = req.body;

      const { photo, error } = await photoService.updatePhoto(photoId, user.uid, updates);

      if (error) {
        return res.status(400).json({ success: false, error });
      }

      res.json({ success: true, photo });

    } catch (error: any) {
      console.error('Update photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async deletePhoto(req: Request, res: Response) {
    try {
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;

      const { success, error } = await photoService.deletePhoto(photoId, user.uid);

      if (error) {
        return res.status(400).json({ success: false, error });
      }

      res.json({ success: true, message: 'Photo deleted' });

    } catch (error: any) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}