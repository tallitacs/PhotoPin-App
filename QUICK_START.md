# PhotoPin - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file (see SETUP_GUIDE.md)
npm run build
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create .env file (see SETUP_GUIDE.md)
npm start
```

### 3. Required Environment Variables

**Backend `.env`**:
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_MAPS_API_KEY=your-key
GOOGLE_PHOTOS_CLIENT_ID=your-client-id
GOOGLE_PHOTOS_CLIENT_SECRET=your-secret
GOOGLE_PHOTOS_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**Frontend `.env`**:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your-key
```

### 4. Firebase Setup
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Create Storage bucket
5. Download service account key → `backend/firebase-credentials.json`
6. Deploy rules: `firebase deploy --only firestore:rules,storage:rules`

### 5. Google APIs
1. Enable Maps JavaScript API
2. Enable Photos Library API
3. Create OAuth 2.0 credentials
4. Add API keys to `.env` files

## 🧪 Quick Test

1. Sign up at `http://localhost:3000/signup`
2. Upload a photo with GPS coordinates
3. Go to `/map` - see your photo on the map
4. Search for photos on the map
5. Import from Google Photos at `/import`

## 📋 What Was Fixed

✅ **MapView**: Now correctly uses `metadata.gps` for location data
✅ **Storage Rules**: Fixed to allow authenticated users
✅ **Google Photos**: Enhanced metadata extraction
✅ **Map Search**: Added search functionality

## 📚 Full Documentation

See `SETUP_GUIDE.md` for complete setup, testing, and deployment instructions.

## 🐛 Common Issues

**CORS Error**: Check `CORS_ORIGIN` in backend `.env`
**Maps Not Loading**: Verify API key and restrictions
**Storage Permission Denied**: Deploy storage rules
**Photos Not on Map**: Ensure photos have GPS in metadata

