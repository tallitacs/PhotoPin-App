import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { Navbar } from './components/Common/Navbar';

// Page components
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { HomePage } from './components/Home/HomePage';
import { PhotoGallery } from './components/Photos/PhotoGallery';
import { TimelineView } from './components/Timeline/TimelineView';
import { PhotoUpload } from './components/Photos/PhotoUpload';
import { AlbumsView } from './components/Albums/AlbumsView';
import { AlbumDetailView } from './components/Albums/AlbumDetailView';
import { MemoriesView } from './components/Memories/MemoriesView';
import { FavoritesView } from './components/Favorites/FavoritesView';
// Google Photos import components
import { GooglePhotosImport } from './components/Import/GooglePhotosImport';
import { GoogleCallback } from './components/Import/GoogleCallback';

// Main application component with routing
function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Show navbar only when user is authenticated */}
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
          {/* Public routes - accessible without authentication */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupForm />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
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
            path="/gallery"
            element={
              <ProtectedRoute>
                <PhotoGallery />
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
            path="/albums"
            element={
              <ProtectedRoute>
                <AlbumsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/:id"
            element={
              <ProtectedRoute>
                <AlbumDetailView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories"
            element={
              <ProtectedRoute>
                <MemoriesView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesView />
              </ProtectedRoute>
            }
          />

          {/* Google Photos import routes - OAuth callback handler */}
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

          {/* Catch-all route - redirect unknown paths to home or login */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;