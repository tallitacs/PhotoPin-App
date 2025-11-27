import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Autocomplete,
  Grid,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { Photo, PhotoUpdateData } from '../../types/photo.types';
import * as api from '../../services/api.service';

interface EditPhotoDialogProps {
  open: boolean;
  photo: Photo | null;
  onClose: () => void;
  onSave: (photo: Photo) => void;
}

export const EditPhotoDialog: React.FC<EditPhotoDialogProps> = ({
  open,
  photo,
  onClose,
  onSave
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState({
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: ''
  });
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when photo changes
  useEffect(() => {
    if (photo) {
      setTags(photo.tags || []);
      setDisplayName(photo.displayName || '');
      setLocation({
        address: photo.location?.address || '',
        city: photo.location?.city || '',
        country: photo.location?.country || '',
        latitude: photo.metadata?.gps?.latitude?.toString() || '',
        longitude: photo.metadata?.gps?.longitude?.toString() || ''
      });
      setDescription(photo.metadata?.description || '');
      setError(null);
    }
  }, [photo]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!photo) return;

    setLoading(true);
    setError(null);

    try {
      // Validate GPS coordinates if provided
      if (location.latitude && (parseFloat(location.latitude) < -90 || parseFloat(location.latitude) > 90)) {
        setError('Latitude must be between -90 and 90');
        setLoading(false);
        return;
      }
      if (location.longitude && (parseFloat(location.longitude) < -180 || parseFloat(location.longitude) > 180)) {
        setError('Longitude must be between -180 and 180');
        setLoading(false);
        return;
      }

      // Check if location text fields have changed (to trigger re-geocoding)
      const locationTextChanged = 
        location.address !== (photo.location?.address || '') ||
        location.city !== (photo.location?.city || '') ||
        location.country !== (photo.location?.country || '');
      
      // Check if GPS coordinates were manually changed
      const gpsManuallyChanged = 
        (location.latitude && location.latitude !== (photo.metadata?.gps?.latitude?.toString() || '')) ||
        (location.longitude && location.longitude !== (photo.metadata?.gps?.longitude?.toString() || ''));

      // Build update object
      const updates: any = {
        tags: tags,
        displayName: displayName.trim() || undefined, // Set to undefined if empty to remove it
        metadata: {
          ...photo.metadata,
          description: description || undefined
        }
      };

      // Handle GPS coordinates
      if (gpsManuallyChanged && location.latitude && location.longitude) {
        // User manually entered GPS coordinates - use them
        updates.metadata.gps = {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          altitude: photo.metadata?.gps?.altitude
        };
      } else if (locationTextChanged) {
        // Location text changed - clear GPS so it gets re-geocoded
        updates.metadata.gps = undefined;
      } else if (photo.metadata?.gps) {
        // Keep existing GPS if nothing changed
        updates.metadata.gps = photo.metadata.gps;
      }

      // Build location object - include any provided fields
      const locationData: any = {};
      
      // Include address fields if provided (even without GPS)
      if (location.address) {
        locationData.address = location.address;
      }
      if (location.city) {
        locationData.city = location.city;
      }
      if (location.country) {
        locationData.country = location.country;
      }
      
      // Only set location if there's any location data
      if (Object.keys(locationData).length > 0) {
        updates.location = locationData;
      }

      // Update photo via API
      const response = await api.updatePhoto(photo.id, updates);

      if (response.success && response.photo) {
        // If location text changed, GPS was cleared - trigger immediate geocoding
        if (locationTextChanged && !gpsManuallyChanged) {
          // The GPS was cleared, so on next map load it will re-geocode
          // Trigger a storage event to notify map to refresh
          console.log('Location changed, GPS cleared. Will re-geocode on map load.');
          try {
            localStorage.setItem('photo-updated', Date.now().toString());
            // Remove it immediately so it can trigger again
            setTimeout(() => localStorage.removeItem('photo-updated'), 100);
          } catch (e) {
            // Storage might not be available, that's OK
          }
        }
        onSave(response.photo);
        onClose();
      } else {
        setError(response.error || 'Failed to update photo');
      }
    } catch (err: any) {
      console.error('Update photo error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  if (!photo) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Photo</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.fileName}
              style={{
                width: '100%',
                maxWidth: '400px',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: 8,
                transform: photo.metadata?.rotation 
                  ? `rotate(${photo.metadata.rotation}deg)` 
                  : 'none',
                transition: 'transform 0.3s ease'
              }}
            />
            {/* Rotation buttons overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 2,
                p: 0.5
              }}
            >
              <IconButton
                size="small"
                onClick={async () => {
                  if (!photo || rotating) return;
                  setRotating(true);
                  setError(null);
                  try {
                    const data = await api.rotatePhoto(photo.id, 90);
                    if (data.success && data.photo) {
                      onSave(data.photo);
                    } else {
                      setError(data.error || 'Failed to rotate photo');
                    }
                  } catch (err: any) {
                    setError(err.response?.data?.error || err.message || 'Failed to rotate photo');
                  } finally {
                    setRotating(false);
                  }
                }}
                disabled={rotating || loading}
                sx={{ color: 'white' }}
                title="Rotate 90° clockwise"
              >
                <RotateRightIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={async () => {
                  if (!photo || rotating) return;
                  setRotating(true);
                  setError(null);
                  try {
                    const data = await api.rotatePhoto(photo.id, 270); // 270 = -90
                    if (data.success && data.photo) {
                      onSave(data.photo);
                    } else {
                      setError(data.error || 'Failed to rotate photo');
                    }
                  } catch (err: any) {
                    setError(err.response?.data?.error || err.message || 'Failed to rotate photo');
                  } finally {
                    setRotating(false);
                  }
                }}
                disabled={rotating || loading}
                sx={{ color: 'white' }}
                title="Rotate 90° counter-clockwise"
              >
                <RotateLeftIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Typography variant="subtitle1" gutterBottom>
            {photo.fileName}
          </Typography>
          {rotating && (
            <Typography variant="caption" color="text.secondary">
              Rotating...
            </Typography>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Display Name Section */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Photo Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={photo.fileName}
              helperText="Leave empty to show original filename, or enter a custom name"
            />
          </Grid>

          {/* Tags Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                color="primary"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Location Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Location
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Country"
                  value={location.country}
                  onChange={(e) => setLocation({ ...location, country: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Latitude"
                  type="number"
                  value={location.latitude}
                  onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                  helperText="GPS latitude coordinate"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Longitude"
                  type="number"
                  value={location.longitude}
                  onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                  helperText="GPS longitude coordinate"
                />
              </Grid>
            </Grid>
            {photo.metadata?.gps && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Current GPS: {photo.metadata.gps.latitude}, {photo.metadata.gps.longitude}
              </Typography>
            )}
          </Grid>

          {/* Description Section */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this photo..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

