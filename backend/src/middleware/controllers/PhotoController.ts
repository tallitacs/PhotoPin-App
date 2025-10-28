import { Request, Response } from 'express';
import { PhotoService } from '../../services/PhotoService';

export class PhotoController {

  // --- Core Photo Methods ---

  public static async uploadPhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { title, description, tags, albumIds } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const result = await PhotoService.uploadPhoto(req.file, user.uid, {
        title, description, tags, albumIds
      });

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async getPhotos(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { limit, page, year } = req.query;

      const result = await PhotoService.getUserPhotos(user.uid, {
        limit: limit ? parseInt(limit as string) : 50,
        page: page ? parseInt(page as string) : 1,
        year: year ? parseInt(year as string) : undefined
      });

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      console.error('Get photos error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async getPhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;

      const result = await PhotoService.getPhoto(user.uid, photoId);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      console.error('Get photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async deletePhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;

      const result = await PhotoService.deletePhoto(user.uid, photoId);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      console.error('Delete photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async updatePhoto(req: Request, res: Response) {
    try {
      const { user } = (req as any);
      const { photoId } = req.params;

      // Note: Your router calls this 'updatePhoto', but your service
      // calls it 'updatePhotoMetadata'. We're calling the service method here.
      const result = await PhotoService.updatePhotoMetadata(user.uid, photoId, req.body);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
      console.error('Update photo error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // --- STUB METHODS (To fix compilation) ---
  // These methods are in your router but not in your service yet.
  // This will make your app compile, but they will return a "Not implemented" error if you call them.

  public static async uploadMultiplePhotos(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async autoGroupPhotos(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async getUserTrips(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async createTrip(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async getMapPins(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async getTimeline(req: Request, res: Response) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  public static async searchPhotos(req: Request, res: Response) {
  res.status(501).json({ success: false, error: 'Not implemented' }); 
}
}