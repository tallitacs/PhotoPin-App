import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import { PhotoCard } from './PhotoCard';
import { EditPhotoDialog } from './EditPhotoDialog';
import { PhotoViewer } from './PhotoViewer';
import { Photo } from '../../types/photo.types';
import * as api from '../../services/api.service';

export const PhotoGallery: React.FC = () => {
  const location = useLocation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching photos from:', process.env.REACT_APP_API_URL);
        const data = await api.getPhotos(); // Using our API service
        console.log('Photos response:', data);
        if (data.success) {
          setPhotos(data.photos || []);
        } else {
          setError(data.error || 'Failed to fetch photos.');
        }
      } catch (err: any) {
        console.error('Photo fetch error:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText
        });
        const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching photos.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [location.pathname]); // Refetch when navigating to this page

  const handleDelete = async (photoId: string) => {
    try {
      const data = await api.deletePhoto(photoId);
      if (data.success) {
        // Remove photo from state
        setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      } else {
        alert('Failed to delete photo.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    // Update photo in the list
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setEditDialogOpen(false);
    setEditingPhoto(null);
    // Update viewing photo if it's the same one
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setViewingPhoto(photo);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

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
    <Box>
      {photos.length === 0 ? (
        <Typography>No photos found. Try uploading some!</Typography>
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
                onClick={handlePhotoClick}
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
    </Box>
  );
};