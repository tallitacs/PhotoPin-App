// backend/src/config/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// List of required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID'
];

// Validate that all required environment variables are present
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Construct the service account object
const serviceAccount = {
  type: "service_account" as const,
  project_id: process.env.FIREBASE_PROJECT_ID!,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
  // Replace escaped newlines with actual newlines in the private key
  private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL!,
  client_id: process.env.FIREBASE_CLIENT_ID!,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL!.replace('@', '%40')}`,
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
}

// Export Firebase services for use throughout the application
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export const bucket = storage.bucket();

// Set Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true, // Ignore undefined values in documents
});

// Export the admin instance as default
export default admin;

// Optional: Export a test connection function for debugging
export const testConnection = async (): Promise<boolean> => {
  try {
    // Test Firestore connection
    await db.collection('_connection_test').limit(1).get();
    
    // Test Storage connection
    await bucket.exists();
    
    // Test Auth connection
    await auth.listUsers(1);
    
    console.log('✅ All Firebase services are accessible');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};