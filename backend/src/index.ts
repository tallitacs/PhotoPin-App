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

// CORS must be configured before other middleware
app.use(cors({
  origin: environment.corsOrigin,
  credentials: true
}));

// Security middleware - adds security headers (configured to allow API requests)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API (can be configured more strictly later)
}));

// Rate limiting - prevent abuse
// More lenient in development mode
const limiter = rateLimit({
  windowMs: environment.security.rateLimitWindowMs,
  max: environment.nodeEnv === 'development' 
    ? environment.security.rateLimitMaxRequests * 10 // 10x more lenient in dev
    : environment.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  }
});
app.use(limiter);

// Body parsing middleware - handle JSON and URL-encoded requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'PhotoPin API',
    version: '1.0.0',
    endpoints: {
      health: '/health or /api/health',
      auth: '/api/auth',
      photos: '/api/photos',
      trips: '/api/trips',
      googlePhotos: '/api/google-photos'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - verify API is running
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'PhotoPin API is running',
    timestamp: new Date().toISOString()
  });
});

// API health check endpoint (for consistency with other API routes)
app.get('/api/health', (req, res) => {
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

// Start server on configured port (only in local development, not on Vercel)
// Vercel serverless functions handle the server lifecycle automatically
const PORT = environment.port;

// Only start the server if not running on Vercel (serverless environment)
// Vercel sets VERCEL environment variable automatically
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 PhotoPin API running on port ${PORT}`);
    console.log(`📍 Environment: ${environment.nodeEnv}`);
    console.log(`🔥 Firebase Project: ${environment.firebase.projectId}`);
  });
} else {
  console.log(`🚀 PhotoPin API running on Vercel`);
  console.log(`📍 Environment: ${environment.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${environment.firebase.projectId}`);
}

// Export app for Vercel serverless functions
export default app;