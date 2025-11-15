import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { Navbar } from './components/Common/Navbar';

// Page Components
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { PhotoGallery } from './components/Photos/PhotoGallery';
import { MapView } from './components/Map/MapView';
import { TimelineView } from './components/Timeline/TimelineView';
import { PhotoUpload } from './components/Photos/PhotoUpload';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a global spinner while checking auth state
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
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupForm />} />

          {/* Protected Routes */}
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
          
          {/* Redirect any other path */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;