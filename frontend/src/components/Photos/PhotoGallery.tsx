import React, { useEffect, useState } from 'react';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { PhotoCard } from './PhotoCard'; // You already have this
import { PhotoMetadata } from '../../types/photo.types';
import * as api from '../../services/api.service';

export const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const data = await api.getPhotos(); // Using our API service
        if (data.success) {
          setPhotos(data.photos);
        } else {
          setError('Failed to fetch photos.');
        }
      } catch (err) {
        setError('An error occurred while fetching photos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

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
      <Typography variant="h4" gutterBottom>
        Your Gallery
      </Typography>
      {photos.length === 0 ? (
        <Typography>No photos found. Try uploading some!</Typography>
      ) : (
        <Grid container spacing={3}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
              <PhotoCard photo={photo} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};