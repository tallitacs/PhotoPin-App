import React, { useEffect, useState } from 'react';
import { Typography, Box, CircularProgress, Alert, AppBar, Toolbar, IconButton, Button } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { PhotoCard } from '../Photos/PhotoCard';
import { EditPhotoDialog } from '../Photos/EditPhotoDialog';
import { PhotoViewer } from '../Photos/PhotoViewer';
import { BulkActionsDialog } from '../Photos/BulkActionsDialog';
import { Photo } from '../../types/photo.types';
import * as api from '../../services/api.service';

export const FavoritesView: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPhotos();
        if (data.success) {
          // Filter only favorited photos
          const favoritedPhotos = (data.photos || []).filter(p => p.isFavorite === true);
          setPhotos(favoritedPhotos);
        } else {
          setError(data.error || 'Failed to fetch photos.');
        }
      } catch (err: any) {
        console.error('Photo fetch error:', err);
        setError(err.response?.data?.error || err.message || 'An error occurred while fetching photos.');
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setEditDialogOpen(false);
    setEditingPhoto(null);
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setViewingPhoto(photo);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = async (photo: Photo) => {
    try {
      const response = await api.updatePhoto(photo.id, {
        isFavorite: !photo.isFavorite
      });
      if (response.success && response.photo) {
        const updatedPhoto = response.photo;
        // If photo is unfavorited, remove it from the favorites list
        if (!updatedPhoto.isFavorite) {
          setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photo.id));
        } else {
          setPhotos(prevPhotos =>
            prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
          );
        }
        if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
          setViewingPhoto(updatedPhoto);
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const data = await api.deletePhoto(photoId);
      if (data.success) {
        setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
        if (viewingPhoto && viewingPhoto.id === photoId) {
          setViewerOpen(false);
          setViewingPhoto(null);
        }
      } else {
        alert('Failed to delete photo.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  // Toggle selection state for a single favorite photo
  const handleToggleSelection = (photoId: string, selected: boolean) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(photoId);
      } else {
        newSet.delete(photoId);
      }
      return newSet;
    });
  };

  // Select or deselect all favorite photos (toggles based on current state)
  const handleSelectAll = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map(p => p.id)));
    }
  };

  // Exit selection mode and clear all selections in favorites view
  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPhotoIds(new Set());
  };

  // Handle bulk tag update for favorites: refreshes filtered favorites list and exits selection mode on success
  const handleBulkUpdateTags = async (tagsToAdd: string[], tagsToRemove: string[]) => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      const updates: { tagsToAdd?: string[], tagsToRemove?: string[] } = {};
      if (tagsToAdd.length > 0) updates.tagsToAdd = tagsToAdd;
      if (tagsToRemove.length > 0) updates.tagsToRemove = tagsToRemove;
      
      await api.bulkUpdatePhotos(photoIds, updates);
      
      const data = await api.getPhotos();
      if (data.success) {
        const favoritedPhotos = (data.photos || []).filter(p => p.isFavorite === true);
        setPhotos(favoritedPhotos);
      }
      
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update tags');
    }
  };

  // Handle bulk location update for favorites: refreshes filtered favorites list and exits selection mode on success
  const handleBulkUpdateLocation = async (location: { city?: string, country?: string, address?: string } | null) => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      await api.bulkUpdatePhotos(photoIds, { location });
      
      const data = await api.getPhotos();
      if (data.success) {
        const favoritedPhotos = (data.photos || []).filter(p => p.isFavorite === true);
        setPhotos(favoritedPhotos);
      }
      
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update location');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      await api.bulkDeletePhotos(photoIds);
      
      // Remove deleted photos from state
      setPhotos(prevPhotos => prevPhotos.filter(p => !selectedPhotoIds.has(p.id)));
      
      // Exit selection mode
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete photos');
    }
  };

  // Get all unique tags from photos for autocomplete
  const allTags = Array.from(new Set(photos.flatMap(p => p.tags || [])));
  
  // Get tags from selected photos
  const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
  const selectedPhotosTags = Array.from(new Set(selectedPhotos.flatMap(p => p.tags || [])));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Selection mode toolbar */}
      {selectionMode && (
        <AppBar
          position="sticky"
          sx={{
            top: 0,
            zIndex: 1100,
            backgroundColor: 'primary.main'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleExitSelectionMode}
              sx={{ mr: 2 }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedPhotoIds.size} selected
            </Typography>
            <Button
              color="inherit"
              onClick={handleSelectAll}
              startIcon={selectedPhotoIds.size === photos.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              sx={{ mr: 1 }}
            >
              {selectedPhotoIds.size === photos.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setBulkActionsOpen(true)}
              disabled={selectedPhotoIds.size === 0}
            >
              Actions
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Header */}
      {!selectionMode && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon sx={{ color: '#ff1744', fontSize: '2rem' }} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* Selection mode toggle button */}
      {!selectionMode && photos.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            onClick={() => setSelectionMode(true)}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.1)'
              }
            }}
            title="Select photos"
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {photos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the heart icon on any photo to add it to your favorites
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)'
            },
            gap: { xs: 0.5, sm: 0.75, md: 1 } // Smaller gaps
          }}
        >
          {photos.map((photo) => (
            <Box
              key={photo.id}
              sx={{
                width: '100%',
                height: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' }, // Fixed height for all photos
                overflow: 'hidden'
              }}
            >
              <PhotoCard 
                photo={photo} 
                onDelete={handleDelete}
                onEdit={handleEdit}
                onClick={selectionMode ? undefined : handlePhotoClick}
                isSelected={selectedPhotoIds.has(photo.id)}
                onSelect={handleToggleSelection}
                selectionMode={selectionMode}
                onFavoriteToggle={handleFavoriteToggle}
                onToggleSelectionMode={() => {
                  if (!selectionMode) {
                    setSelectionMode(true);
                    handleToggleSelection(photo.id, true);
                  }
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      <EditPhotoDialog
        open={editDialogOpen}
        photo={editingPhoto}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingPhoto(null);
        }}
        onSave={handleSaveEdit}
      />

      <PhotoViewer
        open={viewerOpen}
        photo={viewingPhoto}
        photos={photos}
        onClose={() => {
          setViewerOpen(false);
          setViewingPhoto(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFavoriteToggle={handleFavoriteToggle}
      />

      <BulkActionsDialog
        open={bulkActionsOpen}
        onClose={() => setBulkActionsOpen(false)}
        selectedCount={selectedPhotoIds.size}
        onBulkUpdateTags={handleBulkUpdateTags}
        onBulkUpdateLocation={handleBulkUpdateLocation}
        onBulkDelete={handleBulkDelete}
        existingTags={allTags}
        selectedPhotosTags={selectedPhotosTags}
      />
    </Box>
  );
};

