import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import * as api from '../../services/api.service';

const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';

export const GooglePhotosImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: any[], errors: any[] } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
    if (token) {
      setAccessToken(token);
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
    } catch (err) {
      setError('An error occurred.');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!accessToken) {
      setError('No access token found. Please connect again.');
      return;
    }

    setImportLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.importGooglePhotos(accessToken, 25); // Import 25 photos
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to import photos.');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired
        setError('Your Google session has expired. Please connect again.');
        localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
        setAccessToken(null);
      } else {
        setError('An error occurred during import.');
      }
    }
    setImportLoading(false);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Import from Google Photos
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Successfully imported {result.imported.length} photos.
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
            Connected to Google Photos.
          </Typography>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importLoading}
            startIcon={importLoading ? <CircularProgress size={20} /> : null}
          >
            Import Latest 25 Photos
          </Button>
        </Box>
      )}
    </Paper>
  );
};