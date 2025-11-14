import React, { useEffect, useState } from 'react';
import { Grid, Box, CircularProgress, Typography } from '@mui/material';
import { PhotoCard } from './PhotoCard';
import { PhotoMetadata } from '../../types/photo.types';
import apiService from '../../services/api.service';

interface PhotoGalleryProps {
  filters?: any;
  onPhotoClick?: (photo: PhotoMetadata) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  filters, 
  onPhotoClick 
}) => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPhotos(filters);
      setPhotos(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await apiService.deletePhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err: any) {
      alert('Failed to delete photo: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (photos.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">
          No photos found. Upload some photos to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} p={2}>
      {photos.map((photo) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
          <PhotoCard 
            photo={photo} 
            onDelete={handleDelete}
            onClick={onPhotoClick}
          />
        </Grid>
      ))}
    </Grid>
  );
};
