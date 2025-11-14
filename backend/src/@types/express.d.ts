import { Request } from 'express';

// This augments the global Express 'Request' object
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      uid: string;
      email?: string;
      displayName?: string;
    };
  }
}

// This creates a specific, exported type for authenticated routes
export interface AuthenticatedRequest extends Request {
  // Make 'user' non-optional for routes that *require* authentication
  user: {
    uid: string;
    email?: string;
    displayName?: string;
  };
}