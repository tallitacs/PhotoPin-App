// src/services/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { environment } from '../environment/environment';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(environment.firebase.credentials as any),
    projectId: environment.firebase.credentials.project_id,
    databaseURL: environment.firebase.databaseURL,
    storageBucket: environment.firebase.storageBucket || `${environment.firebase.credentials.project_id}.appspot.com`
  });
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export const auth = admin.auth();

console.log('✅ Firebase Admin services initialized');