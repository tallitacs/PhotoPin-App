import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', error);

  // Handle Firebase errors
  if (error.code && error.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication error'
    });
  }

  // Handle Firestore errors
  if (error.code === 5 || error.code === 7) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Handle default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};