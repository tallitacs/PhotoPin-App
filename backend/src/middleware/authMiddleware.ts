import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';
// FIX: This import path is corrected to point to your express.d.ts file
import { AuthenticatedRequest } from '../@types/express';

export const authenticateToken = (
  // Use the base Request type here
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization token required'
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format'
    });
    return;
  }

  // Verify Firebase token
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      // Cast 'req' when assigning the user property
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name
      };
      next();
    })
    .catch((error) => {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    });
};

export const optionalAuthenticate = async (
  // Use the base Request type here
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      // Cast 'req' when assigning
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name
      };
    } else {
      // Cast 'req' when assigning
      (req as AuthenticatedRequest).user = {
        uid: 'anonymous',
        email: undefined,
        displayName: undefined
      };
    }

    next();
  } catch (error) {
    // Cast 'req' when assigning
    (req as AuthenticatedRequest).user = {
      uid: 'anonymous',
      email: undefined,
      displayName: undefined
    };
    next();
  }
};