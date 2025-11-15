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

// Import photos
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