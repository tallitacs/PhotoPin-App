import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { environment } from './environment/environment';
import { errorHandler } from './middleware/errorHandler';
import googlePhotosRoutes from './routes/googlePhotosRoutes';

// Import route handlers
import photoRoutes from './routes/photoRoutes';
import tripRoutes from './routes/tripRoutes';
import { authRoutes } from './routes/authRoutes';

// Initialize Express application
const app = express();

// Security middleware - adds security headers
app.use(helmet());
app.use(cors({
  origin: environment.corsOrigin,
  credentials: true
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: environment.security.rateLimitWindowMs,
  max: environment.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware - handle JSON and URL-encoded requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint - verify API is running
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'PhotoPin API is running',
    timestamp: new Date().toISOString()
  });
});

// Register API route handlers
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/google-photos', googlePhotosRoutes);

// Global error handler - catch all errors
app.use(errorHandler);

// 404 handler - catch undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server on configured port
const PORT = environment.port;

app.listen(PORT, () => {
  console.log(`🚀 PhotoPin API running on port ${PORT}`);
  console.log(`📍 Environment: ${environment.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${environment.firebase.projectId}`);
});

export default app;