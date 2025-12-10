import { Router, Request, Response } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../@types/express';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// All photo routes require authentication
router.use(authenticateToken);

// Upload single photo
router.post(
  '/upload',
  upload.single('photo'),
  handleUploadError,
  (req: Request, res: Response) => PhotoController.uploadPhoto(req as AuthenticatedRequest, res)
);

// Upload multiple photos (up to 10 files)
router.post(
  '/upload-multiple',
  upload.array('photos', 10),
  handleUploadError,
  (req: Request, res: Response) => PhotoController.uploadMultiplePhotos(req as AuthenticatedRequest, res)
);

// Get user's photos with optional filters (year, trip, tags, etc.)
router.get('/', (req: Request, res: Response) =>
  PhotoController.getPhotos(req as AuthenticatedRequest, res)
);

// Get photos grouped by date for timeline view
router.get('/timeline', (req: Request, res: Response) =>
  PhotoController.getTimeline(req as AuthenticatedRequest, res)
);

// Get photos with GPS coordinates for map display
router.get('/map-pins', (req: Request, res: Response) =>
  PhotoController.getMapPins(req as AuthenticatedRequest, res)
);

// Search photos by filename, tags, or camera info
router.get('/search', (req: Request, res: Response) =>
  PhotoController.searchPhotos(req as AuthenticatedRequest, res)
);

// Get single photo by ID
router.get('/:photoId', (req: Request, res: Response) =>
  PhotoController.getPhoto(req as AuthenticatedRequest, res)
);

// Update photo metadata (tags, location, display name, etc.)
router.put('/:photoId', (req: Request, res: Response) =>
  PhotoController.updatePhoto(req as AuthenticatedRequest, res)
);

// Rotate photo by 90, 180, or 270 degrees
router.post('/:photoId/rotate', (req: Request, res: Response) =>
  PhotoController.rotatePhoto(req as AuthenticatedRequest, res)
);

// Delete photo and associated files
router.delete('/:photoId', (req: Request, res: Response) =>
  PhotoController.deletePhoto(req as AuthenticatedRequest, res)
);

// Bulk update multiple photos (tags, location)
router.post('/bulk-update', (req: Request, res: Response) =>
  PhotoController.bulkUpdatePhotos(req as AuthenticatedRequest, res)
);

// Bulk delete multiple photos
router.post('/bulk-delete', (req: Request, res: Response) =>
  PhotoController.bulkDeletePhotos(req as AuthenticatedRequest, res)
);

export default router;