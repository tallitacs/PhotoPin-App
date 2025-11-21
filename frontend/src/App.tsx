import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { Navbar } from './components/Common/Navbar';

// Page components
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { PhotoGallery } from './components/Photos/PhotoGallery';
import { MapView } from './components/Map/MapView';
import { TimelineView } from './components/Timeline/TimelineView';
import { PhotoUpload } from './components/Photos/PhotoUpload';
// Google Photos components
import { GooglePhotosImport } from './components/Import/GooglePhotosImport';
import { GoogleCallback } from './components/Import/GoogleCallback';


function App() {
  const { user, loading } = useAuth();

  if (loading) {
    // Show spinner while checking auth
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {user && <Navbar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: user ? 3 : 0 // No padding for login/signup pages
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupForm />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PhotoGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <PhotoUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <TimelineView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapView />
              </ProtectedRoute>
            }
          />

          {/* Google Photos import routes */}
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <GooglePhotosImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/google/callback"
            element={
              <ProtectedRoute>
                <GoogleCallback />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown paths */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;