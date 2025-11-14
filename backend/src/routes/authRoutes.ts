import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Verify token endpoint
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      uid: req.user!.uid,
      email: req.user!.email,
      displayName: req.user!.displayName
    }
  });
});

export { router as authRoutes };