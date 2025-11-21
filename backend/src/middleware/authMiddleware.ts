import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';
import { AuthenticatedRequest } from '../@types/express';

// Middleware to verify Firebase authentication token (required)
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract authorization header
  const authHeader = req.headers.authorization;

  // Validate authorization header format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization token required'
    });
    return;
  }

  // Extract token from Bearer header
  const token = authHeader.split('Bearer ')[1];

  // Validate token exists
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format'
    });
    return;
  }

  // Verify Firebase ID token
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      // Attach user info to request object
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

// Middleware to optionally verify token (allows anonymous access)
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;

    // If token provided, verify and attach user
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      // Attach authenticated user to request
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name
      };
    } else {
      // No token provided - set anonymous user
      (req as AuthenticatedRequest).user = {
        uid: 'anonymous',
        email: undefined,
        displayName: undefined
      };
    }

    next();
  } catch (error) {
    // Token verification failed - allow as anonymous
    (req as AuthenticatedRequest).user = {
      uid: 'anonymous',
      email: undefined,
      displayName: undefined
    };
    next();
  }
};