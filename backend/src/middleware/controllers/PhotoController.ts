import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { photoService } from '../services/PhotoService';
import { PhotoQueryFilters } from '../@types/Photo';

export class PhotoController {
  /**
   * Upload single photo
   */
  static uploadPhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await photoService.uploadPhoto(req.user.uid, req.file);

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.status(201).json({
        success: true,
        photo: result.photo
      });
    } catch (error: any) {
      console.error('Upload photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Upload multiple photos
   */
  static uploadMultiplePhotos = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const uploadResults = [];
      
      for (const file of req.files as Express.Multer.File[]) {
        const result = await photoService.uploadPhoto(req.user.uid, file);
        uploadResults.push(result);
      }

      const successfulUploads = uploadResults.filter(r => r.photo);
      const failedUploads = uploadResults.filter(r => r.error);

      res.status(207).json({ // 207 Multi-Status
        success: true,
        uploaded: successfulUploads.length,
        failed: failedUploads.length,
        photos: successfulUploads.map(r => r.photo),
        errors: failedUploads.map(r => r.error)
      });
    } catch (error: any) {
      console.error('Upload multiple photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get user photos with filtering
   */
  static getPhotos = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const filters: PhotoQueryFilters = {
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        tripId: req.query.tripId as string,
        hasLocation: req.query.hasLocation === 'true',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await photoService.getUserPhotos(req.user.uid, filters);

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        photos: result.photos,
        total: result.total,
        hasMore: result.total > filters.offset! + result.photos.length
      });
    } catch (error: any) {
      console.error('Get photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get single photo
   */
  static getPhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { photoId } = req.params;
      const result = await photoService.getPhotoById(photoId, req.user.uid);

      if (result.error) {
        return res.status(404).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        photo: result.photo
      });
    } catch (error: any) {
      console.error('Get photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update photo
   */
  static updatePhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { photoId } = req.params;
      const result = await photoService.updatePhoto(photoId, req.user.uid, req.body);

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        photo: result.photo
      });
    } catch (error: any) {
      console.error('Update photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete photo
   */
  static deletePhoto = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { photoId } = req.params;
      const result = await photoService.deletePhoto(photoId, req.user.uid);

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}