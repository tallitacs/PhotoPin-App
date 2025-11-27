import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define Firebase service account credentials structure
interface FirebaseCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Define application environment configuration structure
interface Environment {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  firebase: {
    credentials: FirebaseCredentials;
    projectId: string;
    databaseURL: string;
    storageBucket: string;
  };
  google: {
    mapsApiKey: string;
    photosClientId: string;
    photosClientSecret: string;
    photosRedirectUri: string;
  };
  security: {
    jwtSecret: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  storage: {
    maxFileSize: number;
    maxFilesPerUpload: number;
    allowedMimeTypes: string[];
  };
}

// Load Firebase credentials from file or environment variables
let firebaseCredentials: FirebaseCredentials;

try {
  // Try to load from file first (for local development)
  const credentialsPath = path.join(__dirname, '../../firebase-credentials.json');
  firebaseCredentials = require(credentialsPath);
} catch (error) {
  // Fall back to environment variables (for production/Railway)
  firebaseCredentials = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID!,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
    private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL!,
    client_id: process.env.FIREBASE_CLIENT_ID!,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL!,
    universe_domain: 'googleapis.com'
  };
}

// Build environment configuration object
export const environment: Environment = {
  // Application environment settings
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Firebase configuration
  firebase: {
    credentials: firebaseCredentials,
    projectId: firebaseCredentials.project_id,
    databaseURL: `https://${firebaseCredentials.project_id}.firebaseio.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${firebaseCredentials.project_id}.appspot.com`
  },

  // Google APIs configuration
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    photosClientId: process.env.GOOGLE_PHOTOS_CLIENT_ID || '',
    photosClientSecret: process.env.GOOGLE_PHOTOS_CLIENT_SECRET || '',
    photosRedirectUri: process.env.GOOGLE_PHOTOS_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    // Increased rate limits for development: 1000 requests per 15 minutes (was 100)
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)
  },

  // File upload settings
  storage: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || '10', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp,image/heic').split(',')
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'GOOGLE_MAPS_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && environment.nodeEnv === 'production') {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✅ Environment configuration loaded');
console.log(`📍 Environment: ${environment.nodeEnv}`);
console.log(`🔥 Firebase Project: ${environment.firebase.projectId}`);