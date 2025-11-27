import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { googlePhotosService } from '../services/GooglePhotosService';
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

router.use(authenticateToken);

// Get authorization URL
router.get('/auth-url', (req: Request, res: Response) => {
  const url = googlePhotosService.getAuthUrl();
  res.json({ success: true, authUrl: url });
});

// Handle OAuth callback
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const tokens = await googlePhotosService.getTokens(code);
    
    res.json({
      success: true,
      tokens
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List photos from Google Photos (for selection)
router.post('/list', async (req: Request, res: Response) => {
  try {
    const { accessToken, limit, pageToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const result = await googlePhotosService.listPhotos(
      accessToken,
      limit || 100,
      pageToken
    );

    res.json({
      success: true,
      photos: result.photos,
      nextPageToken: result.nextPageToken
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import selected photos by IDs
router.post('/import-selected', async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { accessToken, photoIds } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'photoIds array is required and must not be empty'
      });
    }

    if (photoIds.length > 25) {
      return res.status(400).json({
        success: false,
        error: 'Cannot import more than 25 photos at a time'
      });
    }

    const { imported, errors } = await googlePhotosService.importSelectedPhotos(
      user.uid,
      accessToken,
      photoIds
    );

    res.json({
      success: true,
      imported,
      errors
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import photos (legacy endpoint - kept for backwards compatibility)
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { accessToken, limit } = req.body;

    const { imported, errors } = await googlePhotosService.importPhotos(
      user.uid,
      accessToken,
      limit
    );

    res.json({
      success: true,
      imported,
      errors
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;