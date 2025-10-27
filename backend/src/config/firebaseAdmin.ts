import * as admin from 'firebase-admin';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin with your service account
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "photopin-d0d05",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "df08ed3a3f3f2d4abd12a6eac857ca281da9959e",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCe8MXKfWjwg0UX
hM0nH5OblWs4Yb8WRpXgRrfzAxQk41K9VPpdJtJwkkXb/XLhUwB9PHBzBgqi+SxH
Q2p2rGw1t8X2I2MECC0CsNd/7IWGn9e/NPJV8NE2bRPDwazEV4EjHKdD+8aVYVjq
LIevdAxZrYR3TBRzbD1qTuHVzqYLDj1/r/Hmd/TxtWP91+kdxS3fik4NqcVmA6F3
C2E/euWrB4oedpROPwdesHvfvVoI6XHrfn9kYKF4Hn6iuSryPfyIb/+EMVoh9p6v
gUigZsI/B2XC6ql9lIx0953o3p1oZjxRZh7wcLqZ/eYF9IQtffM+4/P5ZLotUtao
yl5b7IbnAgMBAAECggEAG/ol1s7cefmhX9JwikJ0qR5UEUijajhiiWfpWU1hblzV
Y55hs6Pxxv74bRDf9+m0XFcXNCgMF0PlF2Y2h00yfwIqRnlUJJGL2r1mMY5gsqHQ
SEf5oEcTjJEGuZ6N2sHMaXHRv5XCDuljzVSpTakPw3lXp+gscWTMKrpX5lrJv4gr
B+7wsMsWju4nORdc0NlqEbHqncyu0DsKflrqy9hd4nM+YWoGNiOLLa8mSWtKBiMq
aXe/mYdeXcnxVzvicADNZoZ/6vydlMdThEQlNsHNrYYQLNb0rVs5DNvwrVgFBi00
is8Mr6R0Mg6CFtvdFi36+0GF1B9WEsAC+x48OxlXgQKBgQDV+c6KtFxW6QAd0jFr
xFS35smMKbqLupH82OXvp0UxzZvziqbK18KUnG5B1Qc7x+CdK2RN5lKQaF868DL/
peRel4qL1FO+oR5lFuiqVjlTi4ZHVfJaPXsq7HiD0cu7gG8f93ammy7d09Fcgf1l
PGRqJNMwipm7tOoEtWkqEAwvUwKBgQC+J+w3+nTuDkjX8L3K7QHLS5JTeOYRnbuc
8/OIKyKrGndJbOxgtz7+RWcQqhl1kVdJpAEjQvW/SF9qumWk0iL+td6QDxlsP8Jh
0OGNATvkPeVMKg9a3ytY1RRIZbRiH6kdPRh9sCDBpRfZ/tzCOaRW1ULNmrTA/42e
kyF8KrtbnQKBgFvbP4Vf4/wTTk9++mRPBidkVcVr7H8repxW6G63GgdFQtuL/Ao8
EXYGqXZtYwuQxKX0CL1AUNVZWPhOQTZqGt1YpMtePQ0q0YeIDB2DolxxGxXomX+P
wR4uIZZFK/a0LgBFFZR0LexgkBHsY8Ff6aN/Z4IBHfnsskGPNzQta22tAoGAHFv7
4MVblv1OY9YlmBQMxnL42bYYKdxqVJgVY+N7AiWqUKsL/ciWfnl/S37y2RPZ/sOU
39tmpyZ2BIbUDebBDVe2X6nA0uIXbVsnqE3czsdkYR2MuLK71j3BDqMMae3q3M91
zZjs6bRjgEGATv8lwUWA9wTxnC8AwfuTbN86ngkCgYAWitnLSr7ippSTYSUF2Vip
zL4nY3bJXeIFqwAiymKAvk4vz5VjxaMQOlrtTF+BFwTdPCprLng3lEsusk9SIMRw
dTex8tghhRijMhKInubXEWw4+KAPiGVCVs0z044g1cQywCqKLDkaWjRzLataZntD
ClF4AkfWTzMIUlZhKHh6Yg==
-----END PRIVATE KEY-----`,
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@photopin-d0d05.iam.gserviceaccount.com",
  client_id: process.env.FIREBASE_CLIENT_ID || "115220203827394096581",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40photopin-d0d05.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Check if Firebase app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export const auth = admin.auth();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });

// Test the connection
db.listCollections()
  .then(() => console.log('✅ Firebase Admin initialized successfully'))
  .catch((error) => console.error('❌ Firebase Admin initialization error:', error));

export default admin;