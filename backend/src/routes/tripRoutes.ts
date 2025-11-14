import { Router } from 'express';
import { TripController } from '../controllers/TripController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', TripController.getUserTrips);
router.post('/', TripController.createTrip);
router.post('/auto-cluster', TripController.autoClusterPhotos);
router.get('/:tripId', TripController.getTrip);
router.put('/:tripId', TripController.updateTrip);
router.delete('/:tripId', TripController.deleteTrip);
router.post('/:tripId/photos', TripController.addPhotosToTrip);

export default router;