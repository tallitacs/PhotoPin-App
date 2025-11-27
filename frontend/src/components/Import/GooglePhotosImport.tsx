import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import * as api from '../../services/api.service';
import { GooglePhotosSelection } from './GooglePhotosSelection';

const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';
const GOOGLE_REFRESH_TOKEN_KEY = 'google_refresh_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'google_token_expiry';

export const GooglePhotosImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: any[], errors: any[] } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);

  useEffect(() => {
    // Check for token in localStorage and verify it's not expired
    const token = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
    const expiry = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    
    if (token) {
      // Check if token is expired (with 5 minute buffer)
      if (expiry) {
        const expiryDate = parseInt(expiry);
        const now = Date.now();
        if (expiryDate && now < expiryDate - 5 * 60 * 1000) {
          setAccessToken(token);
        } else {
          // Token expired, clear it
          console.log('Access token expired, clearing...');
          localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
        }
      } else {
        // No expiry info, assume token is valid (for backwards compatibility)
        setAccessToken(token);
      }
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGoogleAuthUrl();
      if (data.success) {
        // Redirect to Google auth page
        window.location.href = data.authUrl;
      } else {
        setError('Could not get Google auth URL.');
      }
    } catch (err: any) {
      console.error('Get auth URL error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred.');
    }
    setLoading(false);
  };

  const handleShowSelection = () => {
    if (!accessToken) {
      setError('No access token found. Please connect again.');
      return;
    }
    setShowSelection(true);
    setError(null);
    setResult(null);
  };

  const handleImportSelected = async (photoIds: string[]) => {
    if (!accessToken) {
      setError('No access token found. Please connect again.');
      return;
    }

    setImportLoading(true);
    setError(null);
    setResult(null);
    setShowSelection(false);

    try {
      const data = await api.importSelectedGooglePhotos(accessToken, photoIds);
      if (data.success) {
        setResult(data);
        // Clear selection after successful import
        setShowSelection(false);
      } else {
        setError(data.error || 'Failed to import photos.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 401) {
        // Token expired
        const errorMsg = err.response?.data?.error || 'Your Google session has expired. Please connect again.';
        setError(errorMsg);
        localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
        localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
        setAccessToken(null);
        setShowSelection(false);
      } else if (err.response?.status === 403 || err.response?.status === 500) {
        // 403 = Access denied, 500 = Backend caught 403 and returned 500
        const errorMsg = err.response?.data?.error || 'Access denied. Please disconnect and reconnect to Google Photos to grant all permissions.';
        setError(errorMsg);
        localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
        localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
        setAccessToken(null);
        setShowSelection(false);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        const errorMsg = err.response?.data?.error || err.message || 'An error occurred during import.';
        setError(errorMsg);
      }
    }
    setImportLoading(false);
  };

  if (showSelection && accessToken) {
    return (
      <GooglePhotosSelection
        accessToken={accessToken}
        onImport={handleImportSelected}
        onCancel={() => {
          setShowSelection(false);
          // Only clear error if manually canceling (not due to permission error)
          // onTokenCleared will set the error message for permission issues
          if (!error || (!error.includes('permission') && !error.includes('PERMISSION_DENIED'))) {
            setError(null);
          }
        }}
        onTokenCleared={() => {
          // Clear tokens and reset state when permission error occurs
          localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
          setAccessToken(null);
          setShowSelection(false);
          setError('Your Google Photos connection has been reset due to permission issues. Please: 1) Click "Connect to Google Photos" below, 2) Grant ALL permissions when prompted, 3) If issues persist, clear your browser cache/cookies for Google.');
        }}
      />
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Import from Google Photos
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Successfully imported {result.imported.length} photo{result.imported.length !== 1 ? 's' : ''}.
          {result.errors.length > 0 && ` Failed to import ${result.errors.length}.`}
        </Alert>
      )}

      {!accessToken ? (
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Connect to Google Photos
        </Button>
      ) : (
        <Box>
          <Typography sx={{ mb: 2 }}>
            Connected to Google Photos. Select up to 25 photos to import.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleShowSelection}
              disabled={importLoading}
              startIcon={importLoading ? <CircularProgress size={20} /> : null}
            >
              Choose Photos to Import
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
                localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
                localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
                setAccessToken(null);
                setError(null);
                setResult(null);
              }}
            >
              Disconnect
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};