import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { googlePhotosService } from '../services/GooglePhotosService';
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

// All Google Photos routes require authentication
router.use(authenticateToken);

// Get OAuth2 authorization URL for Google Photos
router.get('/auth-url', (req: Request, res: Response) => {
  const url = googlePhotosService.getAuthUrl();
  res.json({ success: true, authUrl: url });
});

// Handle OAuth callback - exchange authorization code for tokens
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    // Exchange authorization code for access and refresh tokens
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

// List photos from Google Photos library (for user selection)
router.post('/list', async (req: Request, res: Response) => {
  try {
    const { accessToken, limit, pageToken } = req.body;

    // Validate access token
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Fetch photos from Google Photos API
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

// Import selected photos by their Google Photos IDs
router.post('/import-selected', async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { accessToken, photoIds } = req.body;

    // Validate access token
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Validate photoIds array
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'photoIds array is required and must not be empty'
      });
    }

    // Limit batch size to 25 photos (Google Photos API limit)
    if (photoIds.length > 25) {
      return res.status(400).json({
        success: false,
        error: 'Cannot import more than 25 photos at a time'
      });
    }

    // Import photos from Google Photos to user's PhotoPin library
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

// Import photos from Google Photos (legacy endpoint - kept for backwards compatibility)
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { accessToken, limit } = req.body;

    // Import recent photos from Google Photos
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