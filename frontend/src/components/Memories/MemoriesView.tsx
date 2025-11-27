import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Grid, Card, CardMedia, CardContent, Chip, LinearProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../../types/trip.types';
import * as api from '../../services/api.service';
import { format, formatDistanceToNow } from 'date-fns';

export const MemoriesView: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserTrips();
      if (data.success) {
        // Filter to show only trips with dates (auto-clustered trips)
        const tripsWithDates = (data.trips || []).filter(trip => trip.startDate);
        setTrips(tripsWithDates);
      } else {
        setError(data.error || 'Failed to fetch memories.');
      }
    } catch (err: any) {
      console.error('Memories fetch error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while fetching memories.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCluster = async () => {
    try {
      setClustering(true);
      setError(null);
      console.log('Starting auto-cluster...');
      
      const data = await api.autoClusterPhotos({
        maxDistance: 50, // 50km
        maxTimeGap: 24, // 24 hours
        minPhotos: 3 // Minimum 3 photos to create a trip
      });
      
      console.log('Auto-cluster response:', data);
      
      if (data.success) {
        const tripsCreated = data.trips?.length || 0;
        console.log(`Created ${tripsCreated} trips`);
        
        // Refresh trips after clustering
        await fetchTrips();
        
        if (tripsCreated > 0) {
          // Show success message
          setError(null);
          // You could show a success snackbar here
        } else {
          setError('No memories were created. Make sure you have at least 3 photos with location data taken within 24 hours of each other.');
        }
      } else {
        const errorMsg = data.error || 'Failed to cluster photos.';
        console.error('Auto-cluster failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Auto-cluster error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to cluster photos.';
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(errorMsg);
    } finally {
      setClustering(false);
    }
  };

  const formatTripDate = (trip: Trip): string => {
    if (!trip.startDate) return '';
    
    const startDate = new Date(trip.startDate);
    const endDate = trip.endDate ? new Date(trip.endDate) : startDate;
    
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If same day
    if (startDate.toDateString() === endDate.toDateString()) {
      if (daysAgo === 0) return 'Today';
      if (daysAgo === 1) return 'Yesterday';
      if (daysAgo < 7) return `${daysAgo} days ago`;
      if (daysAgo < 365) return formatDistanceToNow(startDate, { addSuffix: true });
      return format(startDate, 'MMM d, yyyy');
    }
    
    // Different days
    const isSameMonth = startDate.getMonth() === endDate.getMonth() && 
                       startDate.getFullYear() === endDate.getFullYear();
    
    if (isSameMonth) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
    } else {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Memories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleAutoCluster}
          disabled={clustering}
        >
          {clustering ? 'Creating Memories...' : 'Auto-Create Memories'}
        </Button>
      </Box>

      {clustering && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Analyzing your photos and creating memories...
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {trips.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No memories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click "Auto-Create Memories" to automatically group your photos by time and location
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleAutoCluster}
            disabled={clustering}
          >
            {clustering ? 'Creating Memories...' : 'Create Memories'}
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={trip.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/albums/${trip.id}`)}
              >
                <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
                  <CardMedia
                    component="img"
                    image={trip.coverPhotoUrl || '/placeholder-album.png'}
                    alt={trip.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Gradient overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                      p: 2,
                      color: 'white'
                    }}
                  >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {trip.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {trip.startDate && (
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {formatTripDate(trip)}
                        </Typography>
                      )}
                      <Chip
                        label={`${trip.photoIds.length} ${trip.photoIds.length === 1 ? 'photo' : 'photos'}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

