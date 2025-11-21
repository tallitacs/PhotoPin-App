import { Response } from 'express';
import { auth } from '../config/firebaseAdmin';
import { AuthenticatedRequest } from '../@types/express';

export class AuthController {
  // Register a new user account
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      // Extract registration data from request body
      const { email, password, displayName } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Create user account in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0]
      });

      // Generate custom token for client-side authentication
      const customToken = await auth.createCustomToken(userRecord.uid);

      // Return success response with user data and token
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        },
        customToken
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register user'
      });
    }
  }

  // Get current authenticated user's profile
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Fetch user record from Firebase Auth
      const userRecord = await auth.getUser(req.user.uid);

      // Return user profile data
      res.json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          emailVerified: userRecord.emailVerified
        }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }
}