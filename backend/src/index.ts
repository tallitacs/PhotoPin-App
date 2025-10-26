import express, { Express } from 'express';
import cors from 'cors';
import { log } from "./utils/logger";
import { myIPv4 } from "./utils/ipv4";

// Import config first to initialize Firebase Admin
import './config/firebaseAdmin';

// Import middleware
import { AuthMiddleware } from "./middleware/authMiddleware";
import { upload, handleUploadError } from "./middleware/upload";

// Import controllers
import { PhotoController } from "./controllers/PhotoController";

const app: Express = express();
const port = process.env.PORT || 5000; // Using your PORT from .env

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'PhotoPin Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Photo routes
app.post('/api/photos/upload', AuthMiddleware.authenticate, upload.single('photo'), handleUploadError, PhotoController.uploadPhoto);
app.post('/api/photos/multiple', AuthMiddleware.authenticate, upload.array('photos', 10), handleUploadError, PhotoController.uploadMultiplePhotos);
app.get('/api/photos', AuthMiddleware.authenticate, PhotoController.getPhotos);
app.get('/api/photos/:photoId', AuthMiddleware.authenticate, PhotoController.getPhoto);
app.delete('/api/photos/:photoId', AuthMiddleware.authenticate, PhotoController.deletePhoto);
app.put('/api/photos/:photoId', AuthMiddleware.authenticate, PhotoController.updatePhotoMetadata);

// Trip routes
app.post('/api/trips/auto-group', AuthMiddleware.authenticate, PhotoController.autoGroupPhotos);
app.get('/api/trips', AuthMiddleware.authenticate, PhotoController.getUserTrips);
app.post('/api/trips', AuthMiddleware.authenticate, PhotoController.createTrip);

// Map routes
app.get('/api/map/pins', AuthMiddleware.authenticate, PhotoController.getMapPins);

// Timeline routes
app.get('/api/timeline', AuthMiddleware.authenticate, PhotoController.getTimeline);

// Search routes
app.get('/api/search/photos', AuthMiddleware.authenticate, PhotoController.searchPhotos);

// Server info
app.get('/api/info', AuthMiddleware.authenticate, (req, res) => {
  res.json({
    success: true,
    server: {
      name: 'PhotoPin Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      maxFileSize: process.env.MAX_FILE_SIZE
    },
    user: (req as any).user
  });
});

app.listen(port, () => {
  log(`🚀 Backend server running at http://${myIPv4()}:${port}`);
  log(`📸 Photo endpoints available at /api/photos`);
  log(`❤️  Health check at /api/health`);
  log(`🌍 Environment: ${process.env.NODE_ENV}`);
});