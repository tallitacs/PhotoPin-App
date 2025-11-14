import { Router, Request, Response } from 'express';
import { TripController } from '../controllers/TripController';
import { authenticateToken } from '../middleware/authMiddleware';
// Import the correct type
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

router.use(authenticateToken);

// FIX: Use base Request and cast 'req' when passing to controller
router.get('/', (req: Request, res: Response) => 
  TripController.getUserTrips(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.post('/', (req: Request, res: Response) => 
  TripController.createTrip(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.post('/auto-cluster', (req: Request, res: Response) => 
  TripController.autoClusterPhotos(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.get('/:tripId', (req: Request, res: Response) => 
  TripController.getTrip(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.put('/:tripId', (req: Request, res: Response) => 
  TripController.updateTrip(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.delete('/:tripId', (req: Request, res: Response) => 
  TripController.deleteTrip(req as AuthenticatedRequest, res)
);

// FIX: Use base Request and cast 'req' when passing to controller
router.post('/:tripId/photos', (req: Request, res: Response) => 
  TripController.addPhotosToTrip(req as AuthenticatedRequest, res)
);

export default router;