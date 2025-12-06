import { Response } from 'express';
import { tripService } from '../services/TripService';
// Import from @types directory
import { AuthenticatedRequest } from '../@types/express';

export class TripController {
  static async createTrip(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { name, description, photoIds, startDate, endDate } = req.body;

      if (!name || !photoIds) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, photoIds'
        });
      }

      // Use provided dates or default to current date (for albums that don't need dates)
      const tripStartDate = startDate || new Date().toISOString();
      const tripEndDate = endDate || new Date().toISOString();

      const result = await tripService.createTrip(req.user.uid, {
        name,
        description,
        photoIds,
        startDate: tripStartDate,
        endDate: tripEndDate
      });

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        message: 'Trip created successfully',
        trip: result.trip
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
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
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
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
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
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
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
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
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
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
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  static async autoClusterPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const {
        strategy = 'location-time',
        maxDistance = 50,
        maxTimeGap = 24,
        minPhotos = 3,
        dateRangeDays = 7,
        tagSimilarity = 2
      } = req.body;

      const result = await tripService.autoClusterPhotos(req.user.uid, {
        strategy,
        maxDistance,
        maxTimeGap,
        minPhotos,
        dateRangeDays,
        tagSimilarity
      });

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: `Created ${result.trips?.length || 0} smart albums`,
        trips: result.trips
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }
}