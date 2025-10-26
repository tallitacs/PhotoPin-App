import * as firebaseCredentials from './firebase-credentials.json';

// src/environment/environment.ts
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Firebase credentials interface
export interface FirebaseCredentials {
  type?: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

// Main environment configuration
export interface EnvironmentConfig {
  firebase: {
    credentials: FirebaseCredentials;
    databaseURL: string;
    storageBucket: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

// Build the environment configuration
export const environment: EnvironmentConfig = {
  firebase: {
    credentials: {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID || '',
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
      client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || '',
      universe_domain: 'googleapis.com'
    },
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  },
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',')
  }
};

// Validation function to ensure required environment variables are set
export function validateEnvironment(): void {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY', 
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Firebase credentials format
  if (!environment.firebase.credentials.project_id) {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }

  if (!environment.firebase.credentials.private_key) {
    throw new Error('FIREBASE_PRIVATE_KEY is required');
  }

  if (!environment.firebase.credentials.client_email) {
    throw new Error('FIREBASE_CLIENT_EMAIL is required');
  }

  // Validate private key format
  if (!environment.firebase.credentials.private_key.includes('BEGIN PRIVATE KEY')) {
    throw new Error('FIREBASE_PRIVATE_KEY appears to be malformed');
  }

  console.log('✅ Environment configuration loaded successfully');
  console.log(`📁 Project: ${environment.firebase.credentials.project_id}`);
  console.log(`🚀 Server Port: ${environment.server.port}`);
  console.log(`🌍 Environment: ${environment.server.nodeEnv}`);
}

// Utility functions
export const EnvironmentUtils = {
  // Check if running in production
  isProduction(): boolean {
    return environment.server.nodeEnv === 'production';
  },

  // Check if running in development
  isDevelopment(): boolean {
    return environment.server.nodeEnv === 'development';
  },

  // Get allowed file extensions from MIME types
  getAllowedExtensions(): string[] {
    const mimeToExt: { [key: string]: string[] } = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    };

    return environment.upload.allowedMimeTypes.flatMap(mimeType => 
      mimeToExt[mimeType] || []
    );
  },

  // Get human-readable max file size
  getMaxFileSizeHumanReadable(): string {
    const bytes = environment.upload.maxFileSize;
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  },

  // Validate file against upload constraints
  validateFile(file: { mimetype: string; size: number }): { isValid: boolean; error?: string } {
    if (!environment.upload.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} not allowed. Supported types: ${environment.upload.allowedMimeTypes.join(', ')}`
      };
    }

    if (file.size > environment.upload.maxFileSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${this.getMaxFileSizeHumanReadable()}`
      };
    }

    return { isValid: true };
  }
};

// Export default for easier imports
export default environment;

