import { Router, Request, Response } from 'express';
import { TripController } from '../controllers/TripController';
import { authenticateToken } from '../middleware/authMiddleware';
// Import from @types directory
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

router.use(authenticateToken);

// Cast req to AuthenticatedRequest
router.get('/', (req: Request, res: Response) =>
  TripController.getUserTrips(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.post('/', (req: Request, res: Response) =>
  TripController.createTrip(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.post('/auto-cluster', (req: Request, res: Response) =>
  TripController.autoClusterPhotos(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.get('/:tripId', (req: Request, res: Response) =>
  TripController.getTrip(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.put('/:tripId', (req: Request, res: Response) =>
  TripController.updateTrip(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.delete('/:tripId', (req: Request, res: Response) =>
  TripController.deleteTrip(req as AuthenticatedRequest, res)
);

// Cast req to AuthenticatedRequest
router.post('/:tripId/photos', (req: Request, res: Response) =>
  TripController.addPhotosToTrip(req as AuthenticatedRequest, res)
);

export default router;