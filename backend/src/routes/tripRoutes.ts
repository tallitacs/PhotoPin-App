import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { tripService } from '../services/TripService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create new trip
router.post('/', async (req: any, res) => {
  try {
    const { name, description, photoIds, startDate, endDate } = req.body;
    
    const result = await tripService.createTrip(req.user.uid, {
      name,
      description,
      photoIds,
      startDate,
      endDate
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      trip: result.trip
    });
  } catch (error: any) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user trips
router.get('/', async (req: any, res) => {
  try {
    const result = await tripService.getUserTrips(req.user.uid);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      trips: result.trips
    });
  } catch (error: any) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Auto-cluster photos into trips
router.post('/auto-cluster', async (req: any, res) => {
  try {
    const { maxDistance, maxTimeGap, minPhotos } = req.body;
    
    const result = await tripService.autoClusterPhotos(req.user.uid, {
      maxDistance: maxDistance || 50,
      maxTimeGap: maxTimeGap || 24,
      minPhotos: minPhotos || 3
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      trips: result.trips,
      message: `Created ${result.trips.length} trips from auto-clustering`
    });
  } catch (error: any) {
    console.error('Auto-cluster error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as tripRoutes };