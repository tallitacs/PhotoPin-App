import React, { useEffect, useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Box, CircularProgress, Alert, TextField, InputAdornment, IconButton, Typography, Drawer, useTheme, useMediaQuery } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PhotoCard } from '../Photos/PhotoCard';
import { EditPhotoDialog } from '../Photos/EditPhotoDialog';
import { PhotoViewer } from '../Photos/PhotoViewer';
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Component state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(2); // World view zoom level
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationPhotos, setLocationPhotos] = useState<Photo[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Fetch photos with GPS coordinates on component mount
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const data = await api.getMapPins();
        if (data.success && data.photos) {
          // Filter photos with GPS coordinates
          const photosWithLocation = data.photos.filter(
            (p: Photo) => p.metadata?.gps?.latitude && p.metadata?.gps?.longitude
          ) as Photo[];
          setPhotos(photosWithLocation);
          setFilteredPhotos(photosWithLocation);

          // Reset to world view - ensure map starts zoomed out
          setMapCenter(defaultCenter);
          setMapZoom(2);
        }
      } catch (err) {
        console.error('Error fetching map pins:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPins();
  }, []);

  // Listen for close sidebar event from Navbar logo click
  useEffect(() => {
    const handleCloseSidebar = () => {
      setSidebarOpen(false);
      setSelectedLocation(null);
      setSelectedPhoto(null);
      setMapCenter(defaultCenter);
      setMapZoom(2);
    };

    window.addEventListener('closeMapSidebar', handleCloseSidebar);
    return () => {
      window.removeEventListener('closeMapSidebar', handleCloseSidebar);
    };
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

    // Don't auto-center on search results - keep world view
    // Users can click markers to see photos from specific locations
  }, [searchTerm, photos]);

  // Group photos by location
  const photosByLocation = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    filteredPhotos.forEach(photo => {
      let locationKey = '';
      if (photo.location?.city && photo.location?.country) {
        locationKey = `${photo.location.city}, ${photo.location.country}`;
      } else if (photo.location?.city) {
        locationKey = photo.location.city;
      } else if (photo.location?.country) {
        locationKey = photo.location.country;
      } else if (photo.location?.address) {
        locationKey = photo.location.address;
      } else {
        locationKey = 'Unknown Location';
      }

      if (!groups[locationKey]) {
        groups[locationKey] = [];
      }
      groups[locationKey].push(photo);
    });
    return groups;
  }, [filteredPhotos]);

  // Handle marker click - toggle sidebar for that location
  const handleMarkerClick = (photo: Photo) => {
    const locationKey = photo.location?.city && photo.location?.country
      ? `${photo.location.city}, ${photo.location.country}`
      : photo.location?.city || photo.location?.country || photo.location?.address || 'Unknown Location';

    // If sidebar is already open for this location, close it
    if (sidebarOpen && selectedLocation === locationKey) {
      setSidebarOpen(false);
      setSelectedLocation(null);
      setSelectedPhoto(null);
      // Reset to world view when closing
      setMapCenter(defaultCenter);
      setMapZoom(2);
      return;
    }

    // Otherwise, open sidebar for this location
    setSelectedPhoto(photo);
    setSelectedLocation(locationKey);
    setLocationPhotos(photosByLocation[locationKey] || []);
    setSidebarOpen(true);

    // Zoom to the clicked marker location
    if (photo.metadata?.gps?.latitude && photo.metadata?.gps?.longitude) {
      setMapCenter({
        lat: photo.metadata.gps.latitude,
        lng: photo.metadata.gps.longitude,
      });
      setMapZoom(10); // Zoom in when clicking a marker
    }
  };

  // Handlers for photo actions
  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setFilteredPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setLocationPhotos(prevPhotos =>
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
        setPhotos(prevPhotos =>
          prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
        );
        setFilteredPhotos(prevPhotos =>
          prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
        );
        setLocationPhotos(prevPhotos =>
          prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
        );
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
        setFilteredPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
        setLocationPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row', position: 'relative' }}>
      {/* Photo Gallery Sidebar */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400, md: 450 },
            maxWidth: '90vw'
          }
        }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Sidebar Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <LocationOnIcon color="primary" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {locationPhotos.length} Photo{locationPhotos.length !== 1 ? 's' : ''}
                </Typography>
                {selectedLocation && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedLocation}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={() => setSidebarOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Photo Grid - same format as Gallery */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)'
              },
              gap: { xs: 0.5, sm: 0.75, md: 1 }
            }}
          >
            {locationPhotos.map((photo) => (
              <Box
                key={photo.id}
                sx={{
                  width: '100%',
                  height: { xs: '200px', sm: '220px', md: '240px' },
                  overflow: 'hidden'
                }}
              >
                <PhotoCard
                  photo={photo}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onClick={handlePhotoClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  onToggleSelectionMode={() => {
                    // Optional: can add selection mode if needed
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Drawer>

      {/* Main Map Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', ml: sidebarOpen && !isMobile ? '450px' : 0, transition: 'margin-left 0.3s' }}>
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
              minZoom: 2, // Prevent zooming out too far
              maxZoom: 18, // Allow zooming in when clicking markers
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
                  onClick={() => handleMarkerClick(photo)}
                  title={photo.fileName}
                  icon={{
                    url: '/icons/PHOTOPIN LOGO.png',
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 40)
                  }}
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
                    {selectedPhoto.displayName || selectedPhoto.fileName}
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

      {/* Edit Photo Dialog */}
      <EditPhotoDialog
        open={editDialogOpen}
        photo={editingPhoto}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingPhoto(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Photo Viewer */}
      <PhotoViewer
        open={viewerOpen}
        photo={viewingPhoto}
        photos={locationPhotos.length > 0 ? locationPhotos : filteredPhotos}
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