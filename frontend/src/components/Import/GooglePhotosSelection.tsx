import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import * as api from '../../services/api.service';

interface GooglePhoto {
  id: string;
  filename: string;
  mimeType?: string;
  thumbnailUrl: string | null;
  fullUrl: string | null;
  creationTime?: string;
  width?: number;
  height?: number;
  cameraMake?: string;
  cameraModel?: string;
}

interface GooglePhotosSelectionProps {
  accessToken: string;
  onImport: (photoIds: string[]) => void;
  onCancel: () => void;
  onTokenCleared?: () => void; // Callback when tokens are cleared due to permission error
}

export const GooglePhotosSelection: React.FC<GooglePhotosSelectionProps> = ({
  accessToken,
  onImport,
  onCancel,
  onTokenCleared
}) => {
  const [photos, setPhotos] = useState<GooglePhoto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<GooglePhoto | null>(null);

  const MAX_SELECTION = 25;

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async (pageToken?: string) => {
    try {
      if (pageToken) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await api.listGooglePhotos(accessToken, 100, pageToken);
      
      if (data.success) {
        if (pageToken) {
          setPhotos(prev => [...prev, ...data.photos]);
        } else {
          setPhotos(data.photos);
        }
        setNextPageToken(data.nextPageToken || null);
      } else {
        setError(data.error || 'Failed to load photos.');
      }
    } catch (err: any) {
      console.error('Load photos error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMsg = 'An error occurred while loading photos.';
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // If it's a permission error, clear tokens and suggest reconnecting
      if (err.response?.status === 403 || err.response?.status === 500) {
        const errorData = err.response?.data?.error || '';
        if (errorData.includes('PERMISSION_DENIED') || 
            errorData.includes('insufficient authentication scopes') ||
            errorData.includes('Access token does not have required permissions') ||
            errorMsg.includes('PERMISSION_DENIED')) {
          // Clear tokens to force re-authentication
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_refresh_token');
          localStorage.removeItem('google_token_expiry');
          
          // Notify parent component that tokens were cleared (this will set error and close view)
          if (onTokenCleared) {
            onTokenCleared();
          } else {
            // Fallback: close view if callback not provided
            setTimeout(() => {
              onCancel();
            }, 3000);
          }
          
          errorMsg = 'Access token does not have required permissions. Tokens have been cleared. Please: 1) Disconnect, 2) Clear browser cache/cookies for Google (if issue persists), 3) Reconnect and grant ALL permissions when prompted.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('Access denied') || errorMsg.includes('expired')) {
          errorMsg += ' Please disconnect and reconnect to Google Photos.';
        }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleToggleSelection = (photoId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        if (newSet.size >= MAX_SELECTION) {
          return newSet; // Don't allow more than MAX_SELECTION
        }
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      const maxSelect = Math.min(photos.length, MAX_SELECTION);
      setSelectedIds(new Set(photos.slice(0, maxSelect).map(p => p.id)));
    }
  };

  const handleImport = () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one photo to import.');
      return;
    }
    onImport(Array.from(selectedIds));
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      loadPhotos(nextPageToken);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading photos from Google Photos...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Select Photos to Import
        </Typography>
        <Box>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={selectedIds.size === 0}
          >
            Import {selectedIds.size} Photo{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {selectedIds.size} of {MAX_SELECTION} selected
        </Typography>
        <Button size="small" onClick={handleSelectAll}>
          {selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);
          const isMaxReached = selectedIds.size >= MAX_SELECTION && !isSelected;

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={photo.id}>
              <Card
                sx={{
                  position: 'relative',
                  cursor: isMaxReached ? 'not-allowed' : 'pointer',
                  opacity: isMaxReached ? 0.6 : 1,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
                onClick={() => !isMaxReached && handleToggleSelection(photo.id)}
              >
                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                  <CardMedia
                    component="img"
                    image={photo.thumbnailUrl || '/placeholder-image.png'}
                    alt={photo.filename}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%'
                    }}
                  >
                    {isSelected ? (
                      <CheckCircleIcon color="primary" />
                    ) : (
                      <RadioButtonUncheckedIcon />
                    )}
                  </Box>
                </Box>
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ display: 'block', fontSize: '0.7rem' }}
                  >
                    {photo.filename}
                  </Typography>
                  {photo.creationTime && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', fontSize: '0.65rem' }}
                    >
                      {new Date(photo.creationTime).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {nextPageToken && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={20} /> : null}
          >
            {loadingMore ? 'Loading...' : 'Load More Photos'}
          </Button>
        </Box>
      )}

      {photos.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No photos found in your Google Photos library.
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        maxWidth="md"
        fullWidth
      >
        {previewPhoto && (
          <>
            <DialogTitle>{previewPhoto.filename}</DialogTitle>
            <DialogContent>
              <img
                src={previewPhoto.fullUrl || previewPhoto.thumbnailUrl || ''}
                alt={previewPhoto.filename}
                style={{ width: '100%', height: 'auto' }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewPhoto(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

