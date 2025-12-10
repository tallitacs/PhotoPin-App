import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Props for ProtectedRoute component
interface ProtectedRouteProps {
  children: JSX.Element;
}

// Component that protects routes requiring authentication
// Redirects to login if user is not authenticated
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect to login if user is not authenticated
  // Save current location to redirect back after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content if user is authenticated
  return children;
};