import { Response } from 'express';
import { tripService } from '../services/TripService';
import { AuthenticatedRequest } from '../@types/express';

export class TripController {
  // Create a new trip/album
  static async createTrip(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Extract trip data from request body
      const { name, description, photoIds, startDate, endDate } = req.body;

      // Validate required fields
      if (!name || !photoIds) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, photoIds'
        });
      }

      // Use provided dates or default to current date (for albums that don't need dates)
      const tripStartDate = startDate || new Date().toISOString();
      const tripEndDate = endDate || new Date().toISOString();

      // Create trip using service
      const result = await tripService.createTrip(req.user.uid, {
        name,
        description,
        photoIds,
        startDate: tripStartDate,
        endDate: tripEndDate
      });

      // Handle service errors
      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      // Return success response with created trip
      res.status(201).json({
        success: true,
        message: 'Trip created successfully',
        trip: result.trip
      });
    } catch (error: unknown) {
      console.error('Create trip error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Get all trips/albums for the authenticated user
  static async getUserTrips(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Fetch user's trips from service
      const result = await tripService.getUserTrips(req.user.uid);

      // Handle service errors
      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      // Return trips list
      res.json({
        success: true,
        trips: result.trips
      });
    } catch (error: unknown) {
      console.error('Get user trips error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Get a single trip/album by ID
  static async getTrip(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get trip ID from URL parameters
      const { tripId } = req.params;
      
      // Fetch trip from service (includes ownership verification)
      const result = await tripService.getTripById(tripId, req.user.uid);

      // Handle not found or access denied errors
      if (result.error) {
        return res.status(404).json({ success: false, error: result.error });
      }

      // Return trip data
      res.json({
        success: true,
        trip: result.trip
      });
    } catch (error: unknown) {
      console.error('Get trip error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Update an existing trip/album
  static async updateTrip(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get trip ID from URL parameters
      const { tripId } = req.params;
      
      // Update trip using service (includes ownership verification)
      const result = await tripService.updateTrip(tripId, req.user.uid, req.body);

      // Handle service errors
      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Return updated trip
      res.json({
        success: true,
        message: 'Trip updated successfully',
        trip: result.trip
      });
    } catch (error: unknown) {
      console.error('Update trip error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Delete a trip/album
  static async deleteTrip(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get trip ID from URL parameters
      const { tripId } = req.params;
      
      // Delete trip using service (includes ownership verification and photo cleanup)
      const result = await tripService.deleteTrip(tripId, req.user.uid);

      // Handle service errors
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Return success response
      res.json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } catch (error: unknown) {
      console.error('Delete trip error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Add photos to an existing trip/album
  static async addPhotosToTrip(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Get trip ID from URL and photo IDs from request body
      const { tripId } = req.params;
      const { photoIds } = req.body;

      // Validate photoIds array
      if (!photoIds || !Array.isArray(photoIds)) {
        return res.status(400).json({
          success: false,
          error: 'photoIds array is required'
        });
      }

      // Add photos to trip using service
      const result = await tripService.addPhotosToTrip(tripId, req.user.uid, photoIds);

      // Handle service errors
      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Return success response with updated trip
      res.json({
        success: true,
        message: 'Photos added to trip successfully',
        trip: result.trip
      });
    } catch (error: unknown) {
      console.error('Add photos to trip error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }

  // Automatically cluster photos into trips/albums based on location and time
  static async autoClusterPhotos(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Extract clustering options from request body with defaults
      const {
        strategy = 'location-time',
        maxDistance = 50,
        maxTimeGap = 24,
        minPhotos = 3,
        dateRangeDays = 7,
        tagSimilarity = 2
      } = req.body;

      // Perform auto-clustering using service
      const result = await tripService.autoClusterPhotos(req.user.uid, {
        strategy,
        maxDistance,
        maxTimeGap,
        minPhotos,
        dateRangeDays,
        tagSimilarity
      });

      // Handle service errors
      if (result.error) {
        return res.status(500).json({ success: false, error: result.error });
      }

      // Return created trips
      res.json({
        success: true,
        message: `Created ${result.trips?.length || 0} smart albums`,
        trips: result.trips
      });
    } catch (error: unknown) {
      console.error('Auto cluster photos error:', error);
      res.status(500).json({ success: false, error: (error instanceof Error) ? error.message : 'Unknown error' });
    }
  }
}