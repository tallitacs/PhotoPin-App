import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Grid, Card, CardMedia, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../../types/trip.types';
import * as api from '../../services/api.service';
import { format } from 'date-fns';

export const AlbumsView: React.FC = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = React.useRef(0);
  const isFetchingRef = React.useRef(false);

  useEffect(() => {
    if (!isFetchingRef.current) {
      fetchAlbums();
    }
    
    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      isFetchingRef.current = false;
    };
  }, []);

  const fetchAlbums = async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await api.getUserTrips();
      if (data.success) {
        setAlbums(data.trips || []);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        setError(data.error || 'Failed to fetch albums.');
      }
    } catch (err: any) {
      console.error('Albums fetch error:', err);
      // Handle rate limiting gracefully - only retry once with exponential backoff
      if (err.response?.status === 429) {
        if (retryCountRef.current < 1) {
          retryCountRef.current += 1;
          const retryDelay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 30000); // Max 30 seconds
          setError(`Too many requests. Retrying in ${retryDelay / 1000} seconds...`);
          
          retryTimeoutRef.current = setTimeout(() => {
            isFetchingRef.current = false; // Allow retry
            fetchAlbums();
          }, retryDelay);
        } else {
          setError('Too many requests. Please wait a minute and refresh the page.');
          isFetchingRef.current = false;
        }
      } else {
        setError(err.response?.data?.error || err.message || 'An error occurred while fetching albums.');
        isFetchingRef.current = false;
      }
    } finally {
      setLoading(false);
      // Only reset if not retrying
      if (!retryTimeoutRef.current) {
        isFetchingRef.current = false;
      }
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      setError('Album name is required');
      return;
    }

    try {
      // For albums, we'll create with empty photoIds (dates are optional)
      const data = await api.createTrip({
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim() || undefined,
        photoIds: []
      });

      if (data.success && data.trip) {
        setAlbums(prev => [data.trip!, ...prev]);
        setCreateDialogOpen(false);
        setNewAlbumName('');
        setNewAlbumDescription('');
        // Navigate to album detail page to add photos
        navigate(`/albums/${data.trip.id}`);
      } else {
        setError(data.error || 'Failed to create album.');
      }
    } catch (err: any) {
      console.error('Create album error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create album.');
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!window.confirm('Are you sure you want to delete this album? This will not delete the photos.')) {
      return;
    }

    try {
      const data = await api.deleteTrip(albumId);
      if (data.success) {
        setAlbums(prev => prev.filter(a => a.id !== albumId));
      } else {
        alert(data.error || 'Failed to delete album.');
      }
    } catch (err: any) {
      console.error('Delete album error:', err);
      alert(err.response?.data?.error || 'Failed to delete album.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !albums.length) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {albums.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No albums yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create an album to organize your photos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Album
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {albums.map((album) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={album.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/albums/${album.id}`)}
              >
                {/* Square thumbnail */}
                <Box
                  sx={{
                    width: '100%',
                    paddingTop: '100%', // Makes it square
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'grey.200'
                  }}
                >
                  <Box
                    component="img"
                    src={album.coverPhotoUrl || '/placeholder-album.png'}
                    alt={album.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography 
                    variant="body2" 
                    component="div" 
                    sx={{ 
                      fontWeight: 500,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {album.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {album.photoIds.length} {album.photoIds.length === 1 ? 'item' : 'items'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          </Grid>
          
          {/* Floating Create Button */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{
                borderRadius: '50%',
                minWidth: 56,
                width: 56,
                height: 56,
                boxShadow: 4
              }}
              onClick={() => setCreateDialogOpen(true)}
            >
              <AddIcon />
            </Button>
          </Box>
        </>
      )}

      {/* Create Album Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Album Name"
            fullWidth
            variant="outlined"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAlbum} variant="contained" disabled={!newAlbumName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

