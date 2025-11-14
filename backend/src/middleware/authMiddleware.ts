import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
    displayName?: string;
  };
}

/**
 * Authentication middleware to verify Firebase ID tokens
 */
export const authenticateToken = (
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
      req.user = {
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

/**
 * Optional authentication middleware
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name
      };
    } else {
      // Set a default user object for optional routes
      req.user = {
        uid: 'anonymous',
        email: undefined,
        displayName: undefined
      };
    }

    next();
  } catch (error) {
    // Continue with anonymous user for optional routes
    req.user = {
      uid: 'anonymous',
      email: undefined,
      displayName: undefined
    };
    next();
  }
};