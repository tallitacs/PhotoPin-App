import { Router, Request, Response } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import { authenticateToken } from '../middleware/authMiddleware';
// Import from @types directory
import { AuthenticatedRequest } from '../@types/express';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// Require authentication
router.use(authenticateToken);

// Upload photo
router.post(
  '/upload',
  upload.single('photo'),
  handleUploadError,
  // Cast req to AuthenticatedRequest
  (req: Request, res: Response) => PhotoController.uploadPhoto(req as AuthenticatedRequest, res)
);

router.post(
  '/upload-multiple',
  upload.array('photos', 10),
  handleUploadError,
  // Cast req to AuthenticatedRequest
  (req: Request, res: Response) => PhotoController.uploadMultiplePhotos(req as AuthenticatedRequest, res)
);

// Photo management
router.get('/', (req: Request, res: Response) =>
  PhotoController.getPhotos(req as AuthenticatedRequest, res)
);

router.get('/timeline', (req: Request, res: Response) =>
  PhotoController.getTimeline(req as AuthenticatedRequest, res)
);

router.get('/map-pins', (req: Request, res: Response) =>
  PhotoController.getMapPins(req as AuthenticatedRequest, res)
);

router.get('/search', (req: Request, res: Response) =>
  PhotoController.searchPhotos(req as AuthenticatedRequest, res)
);

router.get('/:photoId', (req: Request, res: Response) =>
  PhotoController.getPhoto(req as AuthenticatedRequest, res)
);

router.put('/:photoId', (req: Request, res: Response) =>
  PhotoController.updatePhoto(req as AuthenticatedRequest, res)
);

router.delete('/:photoId', (req: Request, res: Response) =>
  PhotoController.deletePhoto(req as AuthenticatedRequest, res)
);

export default router;