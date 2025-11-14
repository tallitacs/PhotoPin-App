import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { TimelineItem } from './TimelineItem';
import { PhotoMetadata } from '../../types/photo.types';
import apiService from '../../services/api.service';

interface TimelineViewProps {
  year?: number;
  onPhotoClick?: (photo: PhotoMetadata) => void;
}

interface TimelineGroup {
  date: string;
  photos: PhotoMetadata[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  year, 
  onPhotoClick 
}) => {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [year]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTimeline(year);
      setTimeline(response.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (timeline.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">
          No photos found for this timeline
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {timeline.map((group, idx) => (
        <TimelineItem
          key={idx}
          date={group.date}
          photos={group.photos}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </Box>
  );
};