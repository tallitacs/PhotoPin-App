import { Request, Response } from 'express';
// ✅ FIX 1: Import the INSTANCE 'photoService' (lowercase 'p')
import { photoService } from '../../services/PhotoService';

export class PhotoController {
  
  static async uploadPhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any); // From your auth middleware

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      // ✅ FIX 2: Call the method on the INSTANCE
      // ✅ FIX 3: Pass arguments in the correct order (userId, file)
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

  static async getPhotos(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { limit, page, year, tripId, hasLocation, tags } = req.query;

      // Prepare filters
      const filters = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : 0,
        year: year ? parseInt(year as string) : undefined,
        tripId: tripId as string,
        hasLocation: hasLocation === 'true',
        tags: tags ? (tags as string).split(',') : undefined
      };

      // ✅ FIX: Call the method on the INSTANCE
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

  static async getPhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;

      // ✅ FIX 2: Call the method on the INSTANCE
      // ✅ FIX 3: Use the correct method name 'getPhotoById'
      // ✅ FIX 3: Pass arguments in the correct order (photoId, userId)
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

  static async deletePhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;

      // ✅ FIX 2: Call the method on the INSTANCE
      // ✅ FIX 3: Pass arguments in the correct order (photoId, userId)
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

  static async updatePhotoMetadata(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;
      const updates = req.body;

      // ✅ FIX 2: Call the method on the INSTANCE
      // ✅ FIX 3: Use the correct method name 'updatePhoto'
      // ✅ FIX 3: Pass arguments in the correct order (photoId, userId, updates)
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
}