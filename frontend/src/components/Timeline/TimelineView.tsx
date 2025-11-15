import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { TimelineItem } from './TimelineItem'; // You already have this
import { PhotoMetadata } from '../../types/photo.types';
import * as api from '../../services/api.service';

interface TimelineGroup {
  date: string;
  photos: PhotoMetadata[];
}

export const TimelineView: React.FC = () => {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await api.getTimeline(); // Using our API service
        if (data.success) {
          setTimeline(data.timeline);
        } else {
          setError('Failed to fetch timeline.');
        }
      } catch (err) {
        setError('An error occurred while fetching timeline.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

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
        Your Timeline
      </Typography>
      {timeline.length === 0 ? (
        <Typography>No photos found to build a timeline.</Typography>
      ) : (
        <Box>
          {timeline.map((group) => (
            <TimelineItem key={group.date} date={group.date} photos={group.photos} />
          ))}
        </Box>
      )}
    </Box>
  );
};