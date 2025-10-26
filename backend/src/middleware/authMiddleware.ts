import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export class AuthMiddleware {
    static async authenticate(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    success: false,
                    error: 'No token provided' 
                });
            }

            const token = authHeader.split('Bearer ')[1];
            
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                (req as any).user = decodedToken;
                next();
            } catch (error) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid token' 
                });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Authentication failed' 
            });
        }
    }
}