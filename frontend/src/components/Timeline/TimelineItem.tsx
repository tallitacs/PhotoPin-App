import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { PhotoCard } from '../Photos/PhotoCard';
import { PhotoMetadata } from '../../types/photo.types';
import { format } from 'date-fns';

interface TimelineItemProps {
  date: string;
  photos: PhotoMetadata[];
  onPhotoClick?: (photo: PhotoMetadata) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ 
  date, 
  photos,
  onPhotoClick 
}) => {
  return (
    <Box mb={4}>
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.main' }}>
        <Typography variant="h6" color="white">
          {format(new Date(date), 'MMMM d, yyyy')}
        </Typography>
        <Typography variant="caption" color="white">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        {photos.map((photo) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
            <PhotoCard photo={photo} onClick={onPhotoClick} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};