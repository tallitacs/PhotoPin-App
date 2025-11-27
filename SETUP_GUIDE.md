# PhotoPin App - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Code Changes Made](#code-changes-made)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [Google APIs Setup](#google-apis-setup)
6. [Local Development Setup](#local-development-setup)
7. [Testing Guide](#testing-guide)
8. [Deployment Guide](#deployment-guide)
9. [Security Checklist](#security-checklist)

---

## 🎯 Project Overview

PhotoPin is a Progressive Web App (PWA) for organizing photos with location-based features:
- **Photo Organization**: Upload and organize photos with metadata extraction
- **Map Integration**: View photos on Google Maps with location pins
- **Search Functionality**: Search photos by name, tags, camera, or location
- **Google Photos Import**: Import photos from Google Photos with metadata
- **Timeline View**: View photos organized by date
- **Security**: Firebase Authentication with proper access controls

---

## 🔧 Code Changes Made

### 1. **Fixed MapView Component** (`frontend/src/components/Map/MapView.tsx`)
**Issue**: Component was using `pin.location` but backend returns `metadata.gps`
**Fix**: 
- Updated to use `photo.metadata.gps` for GPS coordinates
- Added search functionality to filter photos on the map
- Added InfoWindow to show photo details when clicking markers
- Improved error handling and loading states

**Why**: The backend stores GPS data in `metadata.gps`, not a separate `location` field. This ensures consistency across the app.

### 2. **Fixed Firebase Storage Rules** (`storage.rules`)
**Issue**: Storage rules blocked all access (`allow read, write: if false`)
**Fix**: 
- Allow authenticated users to read/write their own files
- Maintain public read access for photos (as they're made public in PhotoService)
- Proper user ownership validation

**Why**: Without proper storage rules, users cannot upload or access their photos, breaking core functionality.

### 3. **Enhanced Google Photos API Integration** (`backend/src/services/GooglePhotosService.ts`)
**Issue**: Google Photos metadata wasn't being properly extracted and merged
**Fix**:
- Extract creation time, camera make/model from Google Photos API
- Merge Google Photos metadata with EXIF data from downloaded images
- Skip video files (only process images)
- Use full resolution URLs from Google Photos

**Why**: Google Photos API provides valuable metadata (creation time, camera info) that should be preserved when importing.

### 4. **Added Map Search Functionality**
**Issue**: No way to search/filter photos on the map
**Fix**: 
- Added search bar in MapView component
- Real-time filtering by filename, tags, camera make/model
- Auto-center map on search results
- Display search result count

**Why**: Users need to find specific photos on the map, especially when they have many location-tagged photos.

---

## 🔐 Environment Variables Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Node Environment
NODE_ENV=development
PORT=5000

# CORS Origin (your frontend URL)
CORS_ORIGIN=http://localhost:3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Google Photos API (OAuth 2.0)
GOOGLE_PHOTOS_CLIENT_ID=your-google-photos-client-id
GOOGLE_PHOTOS_CLIENT_SECRET=your-google-photos-client-secret
GOOGLE_PHOTOS_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Security
JWT_SECRET=your-random-secret-key-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=52428800
MAX_FILES_PER_UPLOAD=10
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,image/heic
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Base URL
REACT_APP_API_URL=http://localhost:5000/api

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase Configuration (if using client-side SDK)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Important**: 
- Never commit `.env` files to version control
- Add `.env` to `.gitignore`
- Use different values for production

---

## 🔥 Firebase Configuration

### 1. **Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "photopin-app")
4. Enable Google Analytics (optional for student project)
5. Create project

### 2. **Enable Authentication**
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. (Optional) Enable **Google** provider for OAuth

### 3. **Create Firestore Database**
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (we'll update rules)
4. Choose a location (closest to your users)

### 4. **Create Storage Bucket**
1. Go to **Storage**
2. Click "Get started"
3. Start in **test mode** (we'll update rules)
4. Choose same location as Firestore

### 5. **Deploy Security Rules**

**Firestore Rules** (`firestore.rules`):
```bash
cd backend
firebase deploy --only firestore:rules
```

**Storage Rules** (`storage.rules`):
```bash
firebase deploy --only storage
```

**Note**: Make sure your `firebase.json` includes the storage bucket configuration:
```json
"storage": [
  {
    "bucket": "your-project-id.appspot.com",
    "rules": "storage.rules"
  }
]
```

### 6. **Get Firebase Admin SDK Credentials**
1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Save as `backend/firebase-credentials.json`
4. **Add to `.gitignore`** immediately!

### 7. **Get Firebase Client Config**
1. Go to **Project Settings** > **General**
2. Scroll to "Your apps"
3. Click Web icon (`</>`) to add web app
4. Copy the config object for your frontend `.env`
5. **Important**: Use the `apiKey` from Firebase config (not your Google Maps API key)

### 8. **Enable Identity Toolkit API (Required for Authentication)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`photopin-d0d05`)
3. Go to **APIs & Services** > **Library**
4. Search for "Identity Toolkit API"
5. Click **Enable**
6. This API is required for Firebase Authentication to work

**Note**: If you're using the same API key for both Firebase and Google Maps:
- Go to **APIs & Services** > **Credentials**
- Click on your API key
- Under **API restrictions**, make sure "Identity Toolkit API" is included
- Or set to "Don't restrict key" (less secure, but works for development)

---

## 🗺️ Google APIs Setup

### 1. **Google Maps API**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create new)
3. Go to **APIs & Services** > **Library**
4. Search for "Maps JavaScript API"
5. Click **Enable**
6. Go to **Credentials** > **Create Credentials** > **API Key**
7. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - Add your domains: `localhost:3000`, `your-domain.com`
   - **API restrictions**: Restrict to "Maps JavaScript API"
8. Copy the API key to your `.env` files

### 2. **Google Photos API**
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Photos Library API"
3. Click **Enable**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: "PhotoPin"
   - User support email: your email
   - Developer contact: your email
   - Add scopes: `https://www.googleapis.com/auth/photoslibrary.readonly`
   - **Important**: If app is in "Testing" mode, add your email as a test user
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "PhotoPin Web Client"
   - Authorized redirect URIs (must match EXACTLY):
     - `http://localhost:3000/auth/google/callback` (development)
     - **No trailing slash!**
     - **Must be `http://` not `https://` for localhost**
     - `https://your-domain.com/auth/google/callback` (production)
7. Copy Client ID and Client Secret to backend `.env`

**Troubleshooting "Access blocked" error:**
- Verify redirect URI matches exactly (no trailing slash, correct protocol)
- If app is in Testing mode, ensure your email is added as a test user
- Wait a few minutes after making changes for them to propagate
- Clear browser cache/cookies for Google
- Check that Photos Library API is enabled

**Note**: Google Photos API requires verification for production use, but works fine for development/testing.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
# Copy firebase-credentials.json to backend/

# Build TypeScript
npm run build

# Start development server
npm run dev
```

Backend should run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies

npm install

# Create .env file (see Environment Variables section)

# Start development server
npm start
```

Frontend should run on `http://localhost:3000`

### Verify Setup

1. **Backend Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"success":true,"message":"PhotoPin API is running",...}`

2. **Frontend**: Open `http://localhost:3000` in browser
3. **Firebase**: Check Firebase Console for authentication attempts

---

## 🧪 Testing Guide

### 1. **Authentication Testing**

**Test Sign Up**:
1. Go to `/signup`
2. Create a new account
3. Verify email (if email verification enabled)
4. Check Firebase Console > Authentication for new user

**Test Sign In**:
1. Go to `/login`
2. Sign in with created account
3. Should redirect to photo gallery

**Test Protected Routes**:
1. Try accessing `/map` without signing in
2. Should redirect to `/login`

### 2. **Photo Upload Testing**

**Test Single Upload**:
1. Sign in
2. Go to `/upload`
3. Select a photo with EXIF data (GPS coordinates)
4. Upload photo
5. Check:
   - Photo appears in gallery
   - Metadata extracted (camera, GPS, date)
   - Thumbnail generated

**Test Multiple Upload**:
1. Select multiple photos
2. Upload all
3. Verify all photos appear

**Test Metadata Extraction**:
- Upload a photo with GPS coordinates
- Check Firestore: `photos/{photoId}` should have `metadata.gps`
- Check Storage: Original and thumbnail should exist

### 3. **Map Functionality Testing**

**Test Map Display**:
1. Upload at least 2 photos with GPS coordinates
2. Go to `/map`
3. Verify:
   - Map loads without errors
   - Markers appear at correct locations
   - Clicking marker shows photo info

**Test Map Search**:
1. On map page, use search bar
2. Search by:
   - Photo filename
   - Camera make/model
   - Tags
3. Verify:
   - Map filters to matching photos
   - Map centers on first result
   - Search result count displays

### 4. **Google Photos Import Testing**

**Test OAuth Flow**:
1. Go to `/import`
2. Click "Connect Google Photos"
3. Sign in with Google account
4. Grant permissions
5. Should redirect back with authorization code

**Test Photo Import**:
1. After OAuth, click "Import Photos"
2. Select number of photos to import
3. Verify:
   - Photos download from Google Photos
   - Metadata extracted (creation time, camera info)
   - Photos appear in gallery
   - GPS coordinates preserved (if available)

### 5. **Timeline Testing**

1. Go to `/timeline`
2. Verify photos grouped by date
3. Check date formatting
4. Verify chronological order

### 6. **Security Testing**

**Test Unauthorized Access**:
1. Sign out
2. Try accessing API directly:
   ```bash
   curl http://localhost:5000/api/photos
   ```
3. Should return 401 Unauthorized

**Test User Isolation**:
1. Create two test accounts
2. Upload photos with account A
3. Sign in as account B
4. Verify account B cannot see account A's photos

**Test Storage Rules**:
1. Try accessing another user's photo URL directly
2. Should be accessible (photos are public)
3. Try uploading to another user's path
4. Should be blocked by storage rules

---

## 🚀 Deployment Guide

### Option 1: Vercel (Recommended for Student Projects)

**Why Vercel?**
- Free tier with generous limits
- Automatic deployments from Git
- Built-in CI/CD
- Easy environment variable management
- Supports both frontend and backend (via serverless functions)
- Automatic HTTPS
- Global CDN

---

## 📦 Deploying Frontend to Vercel

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Ensure `.env` is in `.gitignore`** (never commit secrets!)

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended for automatic deployments)
3. Authorize Vercel to access your repositories

### Step 3: Deploy Frontend via Vercel Dashboard

1. **Import Project**:
   - Click "Add New..." > "Project"
   - Select your GitHub repository
   - Choose the `frontend` folder as the root directory

2. **Configure Project Settings**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add each variable from your `frontend/.env`:
     ```
     REACT_APP_API_URL=https://your-backend-url.vercel.app/api
     REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=your-project-id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     REACT_APP_FIREBASE_APP_ID=your-app-id
     ```
   - Set for **Production**, **Preview**, and **Development** environments

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Step 4: Deploy Frontend via CLI (Alternative)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```
   - Follow prompts:
     - Set up and deploy? **Yes**
     - Which scope? (select your account)
     - Link to existing project? **No** (first time) or **Yes** (updates)
     - Project name: `photopin-frontend` (or your choice)
     - Directory: `./` (current directory)
     - Override settings? **No**

4. **Add Environment Variables**:
   ```bash
   vercel env add REACT_APP_API_URL
   vercel env add REACT_APP_GOOGLE_MAPS_API_KEY
   # ... add all other variables
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

---

## 🔧 Deploying Backend to Vercel

### Step 1: Prepare Backend for Vercel

1. **Create `vercel.json` in `backend/` directory**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

2. **Update `backend/src/index.ts`** to export the app:
   ```typescript
   // At the end of the file, add:
   export default app;
   ```

3. **Ensure build script exists in `backend/package.json`**:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

### Step 2: Deploy Backend via Vercel Dashboard

1. **Create New Project**:
   - Click "Add New..." > "Project"
   - Select the same GitHub repository
   - Choose the `backend` folder as root directory

2. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   - Add all variables from `backend/.env`:
     ```
     NODE_ENV=production
     PORT=5000
     CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:3000
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     GOOGLE_MAPS_API_KEY=your-google-maps-api-key
     GOOGLE_PHOTOS_CLIENT_ID=your-google-photos-client-id
     GOOGLE_PHOTOS_CLIENT_SECRET=your-google-photos-client-secret
     GOOGLE_PHOTOS_REDIRECT_URI=https://your-frontend-url.vercel.app/auth/google/callback
     JWT_SECRET=your-jwt-secret
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX_REQUESTS=1000
     MAX_FILE_SIZE=52428800
     MAX_FILES_PER_UPLOAD=10
     ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,image/heic
     ```
   - **Important**: For Firebase credentials, you'll need to:
     - Either: Upload `firebase-credentials.json` and reference it
     - Or: Convert to environment variables (see below)

4. **Handle Firebase Credentials**:
   
   **Option A: Use Environment Variables** (Recommended):
   - Convert `firebase-credentials.json` to environment variables:
     ```env
     FIREBASE_CLIENT_EMAIL=your-service-account-email
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     FIREBASE_PROJECT_ID=your-project-id
     ```
   - Update `backend/src/services/FirebaseService.ts` to use env vars:
     ```typescript
     const credentials = {
       client_email: process.env.FIREBASE_CLIENT_EMAIL!,
       private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
       project_id: process.env.FIREBASE_PROJECT_ID!
     };
     ```

   **Option B: Use Vercel Secrets**:
   - Upload `firebase-credentials.json` as a secret
   - Reference it in your code

5. **Deploy**:
   - Click "Deploy"
   - Note the deployment URL (e.g., `https://photopin-backend.vercel.app`)

### Step 3: Update Frontend API URL

1. **Update Frontend Environment Variable**:
   - Go to Frontend project in Vercel
   - Settings > Environment Variables
   - Update `REACT_APP_API_URL` to your backend URL:
     ```
     REACT_APP_API_URL=https://your-backend-url.vercel.app/api
     ```
   - Redeploy frontend

### Step 4: Update Google OAuth Redirect URI

1. **Go to Google Cloud Console**:
   - APIs & Services > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URI:
     ```
     https://your-frontend-url.vercel.app/auth/google/callback
     ```
   - Save

### Step 5: Update Google Maps API Key Restrictions

1. **Go to Google Cloud Console**:
   - APIs & Services > Credentials
   - Edit your Maps API key
   - Under "Application restrictions" > "HTTP referrers", add:
     ```
     https://your-frontend-url.vercel.app/*
     https://*.vercel.app/*
     ```
   - Save

---

## 📱 Deploying as PWA (Progressive Web App)

### Step 1: Verify PWA Configuration

1. **Check `frontend/public/manifest.json`** exists:
   ```json
   {
     "short_name": "PhotoPin",
     "name": "PhotoPin - Photo Organizer",
     "icons": [
       {
         "src": "favicon.ico",
         "sizes": "64x64 32x32 24x24 16x16",
         "type": "image/x-icon"
       },
       {
         "src": "logo192.png",
         "type": "image/png",
         "sizes": "192x192"
       },
       {
         "src": "logo512.png",
         "type": "image/png",
         "sizes": "512x512"
       }
     ],
     "start_url": ".",
     "display": "standalone",
     "theme_color": "#ff4e00",
     "background_color": "#121212"
   }
   ```

2. **Check Service Worker** (`frontend/src/serviceWorkerRegistration.ts`):
   - Should be registered in `frontend/src/index.tsx`

### Step 2: Test PWA Locally

1. **Build and serve**:
   ```bash
   cd frontend
   npm run build
   npx serve -s build
   ```

2. **Test in browser**:
   - Open DevTools > Application > Service Workers
   - Verify service worker is registered
   - Check "Add to Home Screen" works

### Step 3: Deploy PWA to Vercel

1. **PWA works automatically** on Vercel if:
   - `manifest.json` is in `public/` folder
   - Service worker is registered
   - App is served over HTTPS (Vercel provides this automatically)

2. **Verify after deployment**:
   - Visit your Vercel URL
   - Open DevTools > Application
   - Check:
     - ✅ Service Worker registered
     - ✅ Manifest detected
     - ✅ HTTPS enabled
   - On mobile, you should see "Add to Home Screen" option

### Step 4: Install PWA

**On Desktop (Chrome/Edge)**:
1. Visit your deployed site
2. Click the install icon in address bar
3. Or: Menu > "Install PhotoPin"

**On Mobile (iOS Safari)**:
1. Visit your deployed site
2. Tap Share button
3. Tap "Add to Home Screen"

**On Mobile (Android Chrome)**:
1. Visit your deployed site
2. Tap menu (3 dots)
3. Tap "Add to Home Screen" or "Install App"

---

## 🔄 Continuous Deployment Setup

### Automatic Deployments from GitHub

1. **Vercel automatically deploys** when you:
   - Push to `main` branch → Production deployment
   - Push to other branches → Preview deployment
   - Open Pull Request → Preview deployment

2. **Customize deployment** in `vercel.json`:
   ```json
   {
     "git": {
       "deploymentEnabled": {
         "main": true
       }
     },
     "github": {
       "enabled": true,
       "autoAlias": true
     }
   }
   ```

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🧪 Testing Deployment

### 1. Test Frontend
- [ ] Visit frontend URL
- [ ] Sign up/Sign in works
- [ ] Photos upload successfully
- [ ] Map displays correctly
- [ ] Search functionality works

### 2. Test Backend
- [ ] Health check: `https://your-backend.vercel.app/health`
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] File uploads work

### 3. Test Integration
- [ ] Frontend can connect to backend
- [ ] CORS is configured correctly
- [ ] Google OAuth redirect works
- [ ] Google Maps loads
- [ ] Google Photos import works

### 4. Test PWA
- [ ] Service worker registers
- [ ] App works offline (cached pages)
- [ ] "Add to Home Screen" works
- [ ] App icon displays correctly
- [ ] Splash screen shows on launch

---

## 🔧 Troubleshooting Deployment

### Issue: "Module not found" errors
**Solution**:
- Ensure all dependencies are in `package.json`
- Run `npm install` before building
- Check `package-lock.json` is committed

### Issue: "Environment variable not found"
**Solution**:
- Verify all env vars are set in Vercel Dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Issue: "CORS error" in production
**Solution**:
- Update `CORS_ORIGIN` in backend to include production URL
- Format: `https://your-frontend.vercel.app,http://localhost:3000`
- Redeploy backend

### Issue: "Google OAuth redirect mismatch"
**Solution**:
- Verify redirect URI in Google Console matches exactly
- Must be `https://` (not `http://`) for production
- No trailing slash
- Wait a few minutes for changes to propagate

### Issue: "Service worker not registering"
**Solution**:
- Ensure app is served over HTTPS (Vercel does this automatically)
- Check `manifest.json` is in `public/` folder
- Verify service worker file exists in `build/` after build

### Issue: "Backend functions timeout"
**Solution**:
- Vercel free tier has 10-second timeout for serverless functions
- Optimize long-running operations
- Consider using Vercel Pro for longer timeouts
- Or use alternative hosting (Railway, Render) for backend

### Option 2: Railway (Alternative)

**Why Railway?**
- Free tier with $5 credit/month
- Simple deployment
- Automatic HTTPS
- Database support

1. **Sign up**: [railway.app](https://railway.app)
2. **Create New Project**
3. **Deploy from GitHub**:
   - Connect GitHub repo
   - Select backend or frontend
   - Railway auto-detects Node.js
4. **Add Environment Variables**
5. **Deploy**

### Option 3: Render (Alternative)

**Why Render?**
- Free tier available
- Automatic SSL
- Easy setup

1. **Sign up**: [render.com](https://render.com)
2. **Create Web Service**
3. **Connect GitHub**
4. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add Environment Variables**

### Option 4: Firebase Hosting (Frontend Only)

**For Frontend**:
```bash
cd frontend
npm run build
firebase init hosting
# Select: Use existing project, public directory: build, single-page app: Yes
firebase deploy --only hosting
```

**For Backend**: Use Cloud Functions or separate hosting (Vercel, Railway, etc.)

### Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Health check endpoint responds
- [ ] Update CORS origins in backend
- [ ] Update Google OAuth redirect URIs
- [ ] Update Google Maps API key restrictions
- [ ] All environment variables configured
- [ ] Test authentication flow (sign up/sign in)
- [ ] Test photo upload
- [ ] Test map functionality
- [ ] Test Google Photos import
- [ ] Verify HTTPS is working
- [ ] Check Firebase rules are deployed
- [ ] PWA installable and works offline
- [ ] Service worker registered
- [ ] Monitor error logs in Vercel Dashboard
- [ ] Test on mobile devices
- [ ] Verify all API endpoints work

### Vercel Dashboard Monitoring

1. **View Deployments**:
   - Go to your project in Vercel Dashboard
   - See all deployments (production, preview)
   - View build logs and errors

2. **Monitor Performance**:
   - Analytics tab shows page views, performance metrics
   - Functions tab shows API usage and response times

3. **View Logs**:
   - Click on any deployment
   - View function logs for debugging
   - Check for errors or warnings

4. **Environment Variables**:
   - Settings > Environment Variables
   - Manage all secrets securely
   - Different values for Production/Preview/Development

---

## 🔒 Security Checklist

### Backend Security
- [x] Firebase Authentication middleware
- [x] Rate limiting enabled
- [x] Helmet.js for security headers
- [x] CORS properly configured
- [x] File upload validation
- [x] User ownership checks
- [x] Environment variables for secrets

### Frontend Security
- [x] Protected routes
- [x] Token-based authentication
- [x] Secure API calls
- [x] Input validation

### Firebase Security
- [x] Firestore rules enforce user ownership
- [x] Storage rules enforce user ownership
- [x] Authentication required for writes
- [x] Public read for photos (as intended)

### API Security
- [x] Google OAuth properly configured
- [x] API keys restricted
- [x] HTTPS enforced in production
- [x] Error messages don't leak sensitive info

### Additional Recommendations
- [ ] Enable Firebase App Check
- [ ] Set up monitoring/alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use secrets management (Vercel/Railway provide this)

---

## 📝 Common Issues & Solutions

### Issue: "CORS error" in browser
**Solution**: 
- Check `CORS_ORIGIN` in backend `.env` matches frontend URL
- Include both `http://localhost:3000` and production URL

### Issue: "Google Maps not loading"
**Solution**:
- Verify API key is correct
- Check API key restrictions allow your domain
- Enable "Maps JavaScript API" in Google Cloud Console

### Issue: "Firebase Storage permission denied"
**Solution**:
- Deploy storage rules: `firebase deploy --only storage:rules`
- Check rules allow authenticated users
- Verify user is signed in

### Issue: "Google Photos import fails"
**Solution**:
- Verify OAuth credentials are correct
- Check redirect URI matches exactly
- Ensure Photos Library API is enabled
- Check OAuth consent screen is configured

### Issue: "Photos not showing on map"
**Solution**:
- Verify photos have GPS coordinates in metadata
- Check `metadata.gps` exists in Firestore
- Ensure photos are filtered correctly in MapView

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps API Docs](https://developers.google.com/maps/documentation)
- [Google Photos API Docs](https://developers.google.com/photos/library/guides/overview)
- [Vercel Documentation](https://vercel.com/docs)
- [React PWA Guide](https://create-react-app.dev/docs/making-a-progressive-web-app/)

---

## 🎓 Student Project Notes

This project demonstrates:
- Full-stack development (React + Node.js)
- Firebase integration (Auth, Firestore, Storage)
- Google APIs integration (Maps, Photos)
- PWA implementation
- Security best practices
- RESTful API design
- Metadata extraction and processing

**For Grading/Portfolio**:
- Document your architecture decisions
- Explain security measures
- Show test results
- Include deployment URL
- Document any limitations or future improvements

---

## ✅ Final Checklist Before Submission

- [ ] All environment variables configured
- [ ] Firebase project set up and rules deployed
- [ ] Google APIs configured and restricted
- [ ] Local development working
- [ ] All tests passing
- [ ] Deployed to hosting platform
- [ ] HTTPS enabled
- [ ] Security rules verified
- [ ] Documentation complete
- [ ] README updated with deployment URL

---

**Good luck with your project! 🚀**

