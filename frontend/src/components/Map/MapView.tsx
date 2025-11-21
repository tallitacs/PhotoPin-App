import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Box, CircularProgress, Alert, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Photo } from '../../types/photo.types';
import * as api from '../../services/api.service';

// Map container dimensions
const containerStyle = {
  width: '100%',
  height: '80vh',
};

// Default map center (world view)
const defaultCenter = {
  lat: 20,
  lng: 0,
};

export const MapView: React.FC = () => {
  // Load Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
  });

  // Component state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(2);

  // Fetch photos with GPS coordinates on component mount
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const data = await api.getMapPins();
        if (data.success && data.photos) {
          // Filter photos with GPS coordinates
          const photosWithLocation = data.photos.filter(
            (p: Photo) => p.metadata?.gps?.latitude && p.metadata?.gps?.longitude
          );
          setPhotos(photosWithLocation);
          setFilteredPhotos(photosWithLocation);

          // Center map on first photo
          if (photosWithLocation.length > 0) {
            const firstPhoto = photosWithLocation[0];
            setMapCenter({
              lat: firstPhoto.metadata.gps!.latitude,
              lng: firstPhoto.metadata.gps!.longitude,
            });
            setMapZoom(photosWithLocation.length === 1 ? 10 : 3);
          }
        }
      } catch (err) {
        console.error('Error fetching map pins:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPins();
  }, []);

  // Filter photos based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPhotos(photos);
      return;
    }

      // Build searchable text from filename, tags, and camera info
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = photos.filter((photo) => {
        const searchableText = [
          photo.fileName,
          ...photo.tags,
          photo.metadata?.cameraMake || '',
          photo.metadata?.cameraModel || '',
        ].join(' ').toLowerCase();

        // Check if search term matches any part of searchable text
        return searchableText.includes(lowerSearch);
      });

      // Update filtered photos
      setFilteredPhotos(filtered);

      // Auto-center map on first search result
      if (filtered.length > 0) {
      const firstResult = filtered[0];
      setMapCenter({
        lat: firstResult.metadata.gps!.latitude,
        lng: firstResult.metadata.gps!.longitude,
      });
      setMapZoom(10);
    }
  }, [searchTerm, photos]);

  // Show error if Google Maps failed to load
  if (loadError) {
    return <Alert severity="error">Error loading Google Maps. Please check your API key.</Alert>;
  }

  // Show loading spinner while maps API or photos are loading
  if (!isLoaded || loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search bar for filtering photos */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search photos by name, tags, camera..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  edge="end"
                >
                  ×
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {searchTerm && (
          <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
            Found {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </Box>
        )}
      </Box>
      
      {/* Google Maps container */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapZoom}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Render markers for each photo with GPS coordinates */}
          {filteredPhotos.map((photo) => {
            const gps = photo.metadata?.gps;
            // Skip photos without valid GPS data
            if (!gps || !gps.latitude || !gps.longitude) return null;

            return (
              <Marker
                key={photo.id}
                position={{
                  lat: gps.latitude,
                  lng: gps.longitude,
                }}
                onClick={() => setSelectedPhoto(photo)}
                title={photo.fileName}
              />
            );
          })}

          {/* InfoWindow showing photo details when marker is clicked */}
          {selectedPhoto && selectedPhoto.metadata?.gps && (
            <InfoWindow
              position={{
                lat: selectedPhoto.metadata.gps.latitude,
                lng: selectedPhoto.metadata.gps.longitude,
              }}
              onCloseClick={() => setSelectedPhoto(null)}
            >
              <Box sx={{ maxWidth: 250, p: 1 }}>
                <img
                  src={selectedPhoto.thumbnailUrl || selectedPhoto.url}
                  alt={selectedPhoto.fileName}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    marginBottom: 8,
                    borderRadius: 4,
                  }}
                />
                <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold', mb: 0.5 }}>
                  {selectedPhoto.fileName}
                </Box>
                {selectedPhoto.metadata.takenAt && (
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                    {new Date(selectedPhoto.metadata.takenAt).toLocaleDateString()}
                  </Box>
                )}
                {selectedPhoto.metadata.cameraMake && (
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {selectedPhoto.metadata.cameraMake} {selectedPhoto.metadata.cameraModel}
                  </Box>
                )}
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </Box>
    </Box>
  );
};