import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
// Import the correct type (though not strictly needed here, it's good practice)
import { AuthenticatedRequest } from '../@types/express';

const router = Router();

// Verify token endpoint
// FIX: Use the base Request type. Express provides this to the handler.
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      // Use the non-null assertion '!' because we know
      // 'authenticateToken' ran successfully and added req.user
      uid: req.user!.uid,
      email: req.user!.email,
      displayName: req.user!.displayName
    }
  });
});

export { router as authRoutes };