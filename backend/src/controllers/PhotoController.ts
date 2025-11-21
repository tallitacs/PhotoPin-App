import { Request, Response } from 'express';
import { photoService } from '../services/PhotoService';
import { AuthenticatedRequest } from '../@types/express';

export class PhotoController {
  
  // Handle single photo upload
  static async uploadPhoto(req: Request, res: Response) {
    try {
      // Get authenticated user from request
      const { user } = req as AuthenticatedRequest;

      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      // Upload photo using service
      const { photo, error } = await photoService.uploadPhoto(user.uid, req.file);

      // Handle upload errors
      if (error) {
        return res.status(500).json({ success: false, error });
      }
      
      // Return success response with photo data
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

  // Handle multiple photo uploads
  static async uploadMultiplePhotos(req: Request, res: Response) {
    try {
      // Get authenticated user from request
      const { user } = req as AuthenticatedRequest;

      // Validate files were uploaded
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No files uploaded' 
        });
      }

      // Track successful uploads and errors
      const uploaded: any[] = [];
      const errors: any[] = [];

      // Process each file
      for (const file of req.files) {
        const { photo, error } = await photoService.uploadPhoto(user.uid, file);
        
        // Collect results
        if (error) {
          errors.push({ filename: file.originalname, error });
        } else {
          uploaded.push(photo);
        }
      }

      // Return summary of uploads
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

  // Get user's photos with optional filters
  static async getPhotos(req: Request, res: Response) {
    try {
      // Get authenticated user and query parameters
      const { user } = req as AuthenticatedRequest;
      const { limit, page, year, tripId, hasLocation, tags } = req.query;

      // Build filter object from query parameters
      const filters = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: page ? (parseInt(page as string) - 1) * (parseInt(limit as string) || 50) : 0,
        year: year ? parseInt(year as string) : undefined,
        tripId: tripId as string,
        hasLocation: hasLocation === 'true',
        tags: tags ? (tags as string).split(',') : undefined
      };

      // Fetch photos using service
      const { photos, total, error } = await photoService.getUserPhotos(user.uid, filters);

      // Handle errors
      if (error) {
        return res.status(500).json({ success: false, error });
      }

      // Return photos with total count
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

  // Get photos grouped by date for timeline view
  static async getTimeline(req: Request, res: Response) {
    try {
      // Get authenticated user
      const { user } = req as AuthenticatedRequest;

      // Get timeline data from service
      const { timeline, total, error } = await photoService.getPhotoTimeline(user.uid);

      if (error) {
        return res.status(500).json({ success: false, error });
      }

      // Convert timeline object to array format
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

  // Get photos with GPS coordinates for map display
  static async getMapPins(req: Request, res: Response) {
    try {
      // Get authenticated user
      const { user } = req as AuthenticatedRequest;

      // Get photos with location data
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

  // Search photos by query term
  static async searchPhotos(req: Request, res: Response) {
    try {
      // Get authenticated user and search query
      const { user } = req as AuthenticatedRequest;
      const { q } = req.query;

      // Validate search query exists
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Perform search using service
      const { photos, total, error } = await photoService.searchPhotos(user.uid, q as string);

      // Handle errors
      if (error) {
        return res.status(500).json({ success: false, error });
      }

      // Return search results
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

  // Get single photo by ID
  static async getPhoto(req: Request, res: Response) {
    try {
      // Get authenticated user and photo ID from URL
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;

      // Fetch photo from service
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

  // Update photo metadata
  static async updatePhoto(req: Request, res: Response) {
    try {
      // Get authenticated user, photo ID, and update data
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;
      const updates = req.body;

      // Update photo using service
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

  // Delete photo and associated files
  static async deletePhoto(req: Request, res: Response) {
    try {
      // Get authenticated user and photo ID
      const { user } = req as AuthenticatedRequest;
      const { photoId } = req.params;

      // Delete photo using service
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