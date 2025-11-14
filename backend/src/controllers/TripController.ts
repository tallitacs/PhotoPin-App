import { Response } from 'express';
import { tripService } from '../services/TripService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class TripController {
  static async createTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { name, description, photoIds, startDate, endDate } = req.body;

      if (!name || !photoIds || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, photoIds, startDate, endDate'
        });
      }

      const result = await tripService.createTrip(req.user.uid, {
        name,
        description,
        photoIds,
        startDate,
        endDate
      });

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        message: 'Trip created successfully',
        trip: result.trip
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getUserTrips(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await tripService.getUserTrips(req.user.uid);

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        trips: result.trips
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { tripId } = req.params;
      const result = await tripService.getTripById(tripId, req.user.uid);

      if (result.error) {
        return res.status(404).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        trip: result.trip
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { tripId } = req.params;
      const result = await tripService.updateTrip(tripId, req.user.uid, req.body);

      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: 'Trip updated successfully',
        trip: result.trip
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { tripId } = req.params;
      const result = await tripService.deleteTrip(tripId, req.user.uid);

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async addPhotosToTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { tripId } = req.params;
      const { photoIds } = req.body;

      if (!photoIds || !Array.isArray(photoIds)) {
        return res.status(400).json({
          success: false,
          error: 'photoIds array is required'
        });
      }

      const result = await tripService.addPhotosToTrip(tripId, req.user.uid, photoIds);

      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: 'Photos added to trip successfully',
        trip: result.trip
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async autoClusterPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { maxDistance = 50, maxTimeGap = 24, minPhotos = 3 } = req.body;

      const result = await tripService.autoClusterPhotos(req.user.uid, {
        maxDistance,
        maxTimeGap,
        minPhotos
      });

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: `Created ${result.trips?.length || 0} trips`,
        trips: result.trips
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}