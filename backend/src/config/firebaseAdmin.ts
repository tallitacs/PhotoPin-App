// backend/src/config/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Load Firebase credentials from file or environment variables
let serviceAccount: any;

try {
  // Try to load from file first (for local development)
  const credentialsPath = path.join(__dirname, '../../firebase-credentials.json');
  const credentialsFile = require(credentialsPath);
  serviceAccount = {
    projectId: credentialsFile.project_id,
    privateKeyId: credentialsFile.private_key_id,
    privateKey: credentialsFile.private_key,
    clientEmail: credentialsFile.client_email,
    clientId: credentialsFile.client_id,
    authUri: credentialsFile.auth_uri,
    tokenUri: credentialsFile.token_uri,
    authProviderX509CertUrl: credentialsFile.auth_provider_x509_cert_url,
    clientX509CertUrl: credentialsFile.client_x509_cert_url,
    universeDomain: credentialsFile.universe_domain
  };
  console.log('✅ Loaded Firebase credentials from firebase-credentials.json');
} catch (error) {
  // Fall back to environment variables (for production/Railway)
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

  // Construct the service account object from environment variables
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID!,
    // Replace escaped newlines with actual newlines in the private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    clientId: process.env.FIREBASE_CLIENT_ID!,
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
    clientX509CertUrl: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL!.replace('@', '%40')}`,
    universeDomain: "googleapis.com"
  };
  console.log('✅ Loaded Firebase credentials from environment variables');
}

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.firebasestorage.app`
  });

  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`   Project: ${serviceAccount.projectId}`);
  console.log(`   Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.firebasestorage.app`}`);
}

// Export Firebase services for use throughout the application
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
// Get bucket with explicit name from environment variable or use default (firebasestorage.app format)
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.firebasestorage.app`;
console.log(`📦 Using storage bucket: ${storageBucket}`);
export const bucket = storage.bucket(storageBucket);

// Verify bucket exists on startup
bucket.exists()
  .then(([exists]) => {
    if (exists) {
      console.log(`✅ Storage bucket verified: ${storageBucket}`);
    } else {
      console.error(`❌ Storage bucket does NOT exist: ${storageBucket}`);
      console.error('Please create the bucket in Firebase Console: https://console.firebase.google.com/project/photopin-d0d05/storage');
    }
  })
  .catch((error) => {
    console.error('❌ Error checking bucket:', error.message);
  });

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