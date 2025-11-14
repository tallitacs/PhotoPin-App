import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin with your service account
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "photopin-d0d05",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "d02ec5ae107d91b2c314f9521d8338c44e42432f",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCRfh9nt6DVwGP5
L+EfqkOCw52ODDLciWCO0RefZCR94i+rEgckw25I/X3wR/VzjYk07+dldynlMrha
d5YPJcciKG6m8sc2G0AN62vwRCfmAJn0YOBKz6zD317SjXkmXsNJONGd4Ftku4RV
sMOBkPm1b+zgpyxMQPs6L1UBXUu6CaXaCskJlkvFAYcHeZ7/Wx6Jnfikiz0kO1AP
8V6P9qzhF0NLeio2/gTn8VoVpjOu7GsJaO7w8u2aqp8t5SC5zLo7HL097wRcYnNT
mGUjseOm0bEmi1NijIT5OfVafaWjWtDYDHwDa1YmbEtowqXkdsBTt8xohabEbN2y
CMiU1U2TAgMBAAECggEAIKChGFhUyDq58MLtAHXlZ+jIZ3eS3GQudDitzH/fsx9L
Q1jqozL0g4fde0oX4E8ISwfV46pCifTC5P7WdxUowB9DGUtuo1KfHcAC18HhFLJj
1Cr5ga1q+A4arKsvVQyBTOViFL6goElxFupqHZ9OcILmI0c6JuuXq2e7729lsRVs
MoXb+0J7V1sdmLyz6+/AOnd1cFWqaGEtGktQ2R13DHc7xLXULyjlJCUmPx/RDscJ
ZoDsDIrsW+jeEXsmlR4nmVZT5e5jvuZRY50ejHqIhcbC9ldGUTK8GWQ0sjFU+zQf
C4f4oSCjym90tPJ180eIAFH7gCCR4OhicbZK7g7K+QKBgQDHN3DwXjv+BUa2AQBy
CCTK8ndcVs4zfRgcdFdkw/joOaWqV3+mvtOpNgNSuuV1kDWFZ7EXb0MWYWPTGC6e
yypmqPy2quIUVkod3/DP9QUeOKCmk6vYrEib+BVbXRPlGTWDxuLvcn6j4yGepxd2
tQqatLiA9mobcbzDv/l2algqdQKBgQC69oW8kjon9B3gX6IvTlhpZQaY0tTe6DPz
Jq5aW4ydV3hr5G5L2i2XwN6tGrioRE1NhhY0q4+9dvObUwW1XUf2zwENK+kUF6/I
ZdU3aHNgjexUbSzXSH4rgZTzD69EMmgmJIgKsSByvHfSN3wRqlYo7uVy4R1WlrzL
Fxig8Z9G5wKBgQCAptIduI1/n0Kp+P2jppS0J19j1380ix2OCqgBn/lXZxsQZY8/
TM794K7Gt4HFqUqXC363BphJlL1VrrE0xTltsMX65WI5Bfy5TEyEz9PtT16YFJeO
xrvhVZXdOb/GXMBNiJw3TDZyehTVE0040PO3MuxQBFJDxDFbW2ZxlWHnQKBgFs2
TBasbEzzruO5JGHZ4g5BKE/Eg+/f7wBQPb19boOQmgJhJmJBJf8kLD7di3skH2aT
5R97F5xCfSSpA17xDFvfr86iPor751loPPZUMf3IH6UswjShfFRzWpyeaU5nHSKG
rgwxT/hJ9FcNlKz1oiVEL5K1Ot/0mFSohu52EtO/AoGAVFafiRE7iJ/CcpKEyf8d
23Q2Oml7OBSTWkqIPo2H4fPVOngs+suGaCSz1BsRoYcKxmb2zBoC35l2G0t7/viQ
HzGnJ0Bp5INbF2O1C2ScsXLHjDP3BCbpoB/yyzFNHz5tv3D5aIYV1MGeBS9hCq9h
CxTgKepeBxIminmBJxk2Zv8=
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
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export const auth = admin.auth();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });

export default admin;