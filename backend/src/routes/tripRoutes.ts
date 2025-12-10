import { Router, Request, Response } from 'express';
import { TripController } from '../controllers/TripController';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

// All trip routes require authentication
router.use(authenticateToken);

// Get all trips/albums for authenticated user
router.get('/', (req: Request, res: Response) =>
  TripController.getUserTrips(req as AuthenticatedRequest, res)
);

// Create a new trip/album
router.post('/', (req: Request, res: Response) =>
  TripController.createTrip(req as AuthenticatedRequest, res)
);

// Automatically cluster photos into trips based on location and time
router.post('/auto-cluster', (req: Request, res: Response) =>
  TripController.autoClusterPhotos(req as AuthenticatedRequest, res)
);

// Get a single trip/album by ID
router.get('/:tripId', (req: Request, res: Response) =>
  TripController.getTrip(req as AuthenticatedRequest, res)
);

// Update an existing trip/album
router.put('/:tripId', (req: Request, res: Response) =>
  TripController.updateTrip(req as AuthenticatedRequest, res)
);

// Delete a trip/album
router.delete('/:tripId', (req: Request, res: Response) =>
  TripController.deleteTrip(req as AuthenticatedRequest, res)
);

// Add photos to an existing trip/album
router.post('/:tripId/photos', (req: Request, res: Response) =>
  TripController.addPhotosToTrip(req as AuthenticatedRequest, res)
);

export default router;