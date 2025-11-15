import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuthController } from '../controllers/AuthController';
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

// Register new user
router.post('/register', (req: Request, res: Response) => 
  AuthController.register(req as AuthenticatedRequest, res)
);

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

// Get user profile
router.get('/profile', authenticateToken, (req: Request, res: Response) => 
  AuthController.getProfile(req as AuthenticatedRequest, res)
);

export { router as authRoutes };