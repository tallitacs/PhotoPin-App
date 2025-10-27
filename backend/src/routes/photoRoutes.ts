import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload routes
router.post('/upload', upload.single('photo'), PhotoController.uploadPhoto);
router.post('/upload-multiple', upload.array('photos', 10), PhotoController.uploadMultiplePhotos);

// CRUD routes
router.get('/', PhotoController.getPhotos);
router.get('/:photoId', PhotoController.getPhoto);
router.put('/:photoId', PhotoController.updatePhoto);
router.delete('/:photoId', PhotoController.deletePhoto);

export { router as photoRoutes };