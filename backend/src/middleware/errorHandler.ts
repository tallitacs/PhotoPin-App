import { Request, Response, NextFunction } from 'express';

// Global error handler middleware - catches all unhandled errors
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', error);

  // Handle Firebase authentication errors
  if (error.code && error.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication error'
    });
  }

  // Handle Firestore permission errors (code 5 = NOT_FOUND, code 7 = PERMISSION_DENIED)
  if (error.code === 5 || error.code === 7) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Handle all other errors with generic message
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};