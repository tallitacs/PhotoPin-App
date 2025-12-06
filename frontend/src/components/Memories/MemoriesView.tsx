import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Grid, Card, CardMedia, CardContent, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../../types/trip.types';
import * as api from '../../services/api.service';
import { format, formatDistanceToNow } from 'date-fns';

type ClusteringStrategy = 'location-time' | 'date-range' | 'location' | 'camera' | 'tags';

export const MemoriesView: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [strategy, setStrategy] = useState<ClusteringStrategy>('location-time');
  const [maxDistance, setMaxDistance] = useState(50);
  const [maxTimeGap, setMaxTimeGap] = useState(24);
  const [minPhotos, setMinPhotos] = useState(3);
  const [dateRangeDays, setDateRangeDays] = useState(7);
  const [tagSimilarity, setTagSimilarity] = useState(2);

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
      setDialogOpen(false);
      console.log('Starting smart albums creation...');

      const options: any = {
        strategy,
        minPhotos
      };

      // Add strategy-specific options
      if (strategy === 'location-time' || strategy === 'location') {
        options.maxDistance = maxDistance;
      }
      if (strategy === 'location-time') {
        options.maxTimeGap = maxTimeGap;
      }
      if (strategy === 'date-range') {
        options.dateRangeDays = dateRangeDays;
      }
      if (strategy === 'tags') {
        options.tagSimilarity = tagSimilarity;
      }

      const data = await api.autoClusterPhotos(options);

      console.log('Smart albums response:', data);

      if (data.success) {
        const tripsCreated = data.trips?.length || 0;
        console.log(`Created ${tripsCreated} smart albums`);

        // Refresh trips after clustering
        await fetchTrips();

        if (tripsCreated > 0) {
          setError(null);
        } else {
          setError(`No smart albums were created. Try adjusting the settings or choose a different clustering strategy.`);
        }
      } else {
        const errorMsg = data.error || 'Failed to create smart albums.';
        console.error('Smart albums creation failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('Smart albums creation error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create smart albums.';
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
        <Box>
          <Typography variant="h4">
            Smart Albums
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automatically organize your photos into albums based on events, locations, or other criteria
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={clustering}
        >
          {clustering ? 'Creating Smart Albums...' : 'Create Smart Albums'}
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
            Click "Create Smart Albums" to automatically organize your photos into albums
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={clustering}
          >
            {clustering ? 'Creating Smart Albums...' : 'Create Smart Albums'}
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

      {/* Smart Albums Creation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Smart Albums</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Clustering Strategy</InputLabel>
              <Select
                value={strategy}
                label="Clustering Strategy"
                onChange={(e) => setStrategy(e.target.value as ClusteringStrategy)}
              >
                <MenuItem value="location-time">Location & Time (Events)</MenuItem>
                <MenuItem value="date-range">Date Range (Same Week/Day)</MenuItem>
                <MenuItem value="location">Location Only</MenuItem>
                <MenuItem value="camera">Camera (Same Device)</MenuItem>
                <MenuItem value="tags">Tags (Similar Tags)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Minimum Photos per Album"
              type="number"
              value={minPhotos}
              onChange={(e) => setMinPhotos(parseInt(e.target.value) || 3)}
              inputProps={{ min: 2, max: 50 }}
              helperText="Minimum number of photos required to create an album"
            />

            {strategy === 'location-time' && (
              <>
                <TextField
                  label="Max Distance (km)"
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value) || 50)}
                  inputProps={{ min: 1, max: 1000 }}
                  helperText="Maximum distance between photos in the same album"
                />
                <TextField
                  label="Max Time Gap (hours)"
                  type="number"
                  value={maxTimeGap}
                  onChange={(e) => setMaxTimeGap(parseInt(e.target.value) || 24)}
                  inputProps={{ min: 1, max: 168 }}
                  helperText="Maximum time between photos in the same album"
                />
              </>
            )}

            {strategy === 'location' && (
              <TextField
                label="Max Distance (km)"
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value) || 50)}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Maximum distance between photos in the same location"
              />
            )}

            {strategy === 'date-range' && (
              <TextField
                label="Date Range (days)"
                type="number"
                value={dateRangeDays}
                onChange={(e) => setDateRangeDays(parseInt(e.target.value) || 7)}
                inputProps={{ min: 1, max: 365 }}
                helperText="Group photos taken within this many days"
              />
            )}

            {strategy === 'tags' && (
              <TextField
                label="Minimum Common Tags"
                type="number"
                value={tagSimilarity}
                onChange={(e) => setTagSimilarity(parseInt(e.target.value) || 2)}
                inputProps={{ min: 1, max: 10 }}
                helperText="Minimum number of common tags to group photos"
              />
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              {strategy === 'location-time' && 'Groups photos taken at the same location within a time window (e.g., a trip or event).'}
              {strategy === 'date-range' && 'Groups photos taken within the same time period (e.g., same day or week).'}
              {strategy === 'location' && 'Groups all photos from the same location, regardless of when they were taken.'}
              {strategy === 'camera' && 'Groups photos taken with the same camera device.'}
              {strategy === 'tags' && 'Groups photos that share common tags.'}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={clustering}>
            Cancel
          </Button>
          <Button onClick={handleAutoCluster} variant="contained" disabled={clustering} startIcon={<AutoAwesomeIcon />}>
            Create Smart Albums
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

