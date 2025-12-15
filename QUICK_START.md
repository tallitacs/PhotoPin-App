# PhotoPin App - Start Guide

This guide will help you get both servers running locally and verify everything is set up correctly.

---

## Starting the Backend Server

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The backend should start on **http://localhost:5000**

   You should see output like:
   ```
   PhotoPin API running on port 5000
   PhotoPin API is ready!
   ```

---

## Starting the Frontend Server

1. **Open a new terminal window** (keep the backend running)

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

   The frontend should start on **http://localhost:3000**

   Your browser should automatically open to the app.

---

## Verifying the Setup

### 1. Backend Health Check

**Option A: Using curl** (in a new terminal):
```bash
curl http://localhost:5000/health
```

**Expected response**:
```json
{
  "success": true,
  "message": "PhotoPin API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Option B: Using a browser**:
- Open: http://localhost:5000/health
- You should see the JSON response above

### 2. Frontend Check

- Open your browser to **http://localhost:3000**
- You should see the PhotoPin app homepage
- Check the browser console (F12) for any errors

### 3. Test Authentication

1. **Sign Up**:
   - Click "Sign Up" or navigate to `/signup`
   - Create a test account
   - Verify you can create an account successfully

2. **Sign In**:
   - Sign in with your test account
   - You should be redirected to the photo gallery

### 4. Test API Connection

1. **Sign in to the app** (frontend)
2. **Open browser DevTools** (F12) > Network tab
3. **Try uploading a photo** or navigating to different pages
4. **Check that API requests** are being made to `http://localhost:5000/api/...`
5. **Verify responses** are successful (status 200)

### 5. Quick Functionality Tests

- ✅ **Photo Upload**: Try uploading a photo
- ✅ **Map View**: Navigate to the map page (should load if you have photos with GPS data)
- ✅ **Search**: Try searching for photos
- ✅ **Timeline**: Check the timeline view

---
