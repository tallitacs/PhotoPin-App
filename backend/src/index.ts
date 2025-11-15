import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { environment } from './environment/environment';
import { errorHandler } from './middleware/errorHandler';
import googlePhotosRoutes from './routes/googlePhotosRoutes';

// Routes
import photoRoutes from './routes/photoRoutes';
import tripRoutes from './routes/tripRoutes';
import { authRoutes } from './routes/authRoutes';


const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: environment.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: environment.security.rateLimitWindowMs,
  max: environment.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'PhotoPin API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/google-photos', googlePhotosRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = environment.port;

app.listen(PORT, () => {
  console.log(`🚀 PhotoPin API running on port ${PORT}`);
  console.log(`📍 Environment: ${environment.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${environment.firebase.projectId}`);
});

export default app;