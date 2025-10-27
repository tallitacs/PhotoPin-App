import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
  };
}

/**
 * Authentication middleware to verify Firebase ID tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
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
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};