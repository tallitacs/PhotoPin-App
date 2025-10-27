import { Router } from 'express';
import { PhotoController } from '../middleware/controllers/PhotoController';
// ✅ FIX 1: Import the correct exported function name
import { authenticateToken } from '../middleware/authMiddleware'; 
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// Define photo routes
// ✅ FIX 1 (continued): Use the correct function name
router.post('/upload', authenticateToken, upload.single('photo'), handleUploadError, PhotoController.uploadPhoto);
router.post('/multiple', authenticateToken, upload.array('photos', 10), handleUploadError, PhotoController.uploadMultiplePhotos); // Now points to a stub
router.get('/', authenticateToken, PhotoController.getPhotos); // ✅ FIX 2: Corrected method name to match controller
router.get('/:photoId', authenticateToken, PhotoController.getPhoto); 
router.delete('/:photoId', authenticateToken, PhotoController.deletePhoto);
router.put('/:photoId', authenticateToken, PhotoController.updatePhoto); // ✅ FIX 2: Corrected method name to match controller

// Trip routes 
router.post('/trips/auto-group', authenticateToken, PhotoController.autoGroupPhotos); // Now points to a stub
router.get('/trips', authenticateToken, PhotoController.getUserTrips); // Now points to a stub
router.post('/trips', authenticateToken, PhotoController.createTrip); // Now points to a stub

// Map routes 
router.get('/map/pins', authenticateToken, PhotoController.getMapPins); // Now points to a stub

// Timeline routes 
router.get('/timeline', authenticateToken, PhotoController.getTimeline); // Now points to a stub

// Search routes 
router.get('/search/photos', authenticateToken, PhotoController.searchPhotos); // Now points to a stub

export default router;

