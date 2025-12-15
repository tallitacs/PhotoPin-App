import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, TextField, InputAdornment, IconButton, Drawer, Grid, Card, CardMedia } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Photo } from '../../types/photo.types';
import { PhotoViewer } from '../Photos/PhotoViewer';
import * as api from '../../services/api.service';

// Map container dimensions - full height for world view
const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)', // Full viewport height minus navbar and padding
};

// Default map center (world view - centered on equator)
const defaultCenter = {
  lat: 0,
  lng: 0,
};

// Libraries for Google Maps API 
const mapLibraries: ("marker")[] = ["marker"];

export const HomePage: React.FC = () => {
  // Load Google Maps JavaScript API with marker library
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries, // Enable AdvancedMarkerElement library
  });

  // Map state
  const [mapPhotos, setMapPhotos] = useState<Photo[]>([]); // All photos with location data
  const [filteredMapPhotos, setFilteredMapPhotos] = useState<Photo[]>([]); // Photos filtered by search
  const [mapLoading, setMapLoading] = useState(true); // Loading state for map data
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; photos: Photo[] } | null>(null); // Selected marker location for InfoWindow
  const [searchTerm, setSearchTerm] = useState(''); // Search input value
  const [mapCenter, setMapCenter] = useState(defaultCenter); // Map center coordinates
  const [mapZoom, setMapZoom] = useState(2.5); // Start at a slightly zoomed-in world view (zoom level 2.5)
  const [geocodedPhotos, setGeocodedPhotos] = useState<Map<string, { lat: number; lng: number }>>(new Map()); // Cache of geocoded addresses
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null); // Photo currently viewed in full screen
  const [viewerOpen, setViewerOpen] = useState(false); // Full screen photo viewer open state
  const [viewerPhotos, setViewerPhotos] = useState<Photo[]>([]); // Photos to show in viewer (from selected location)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null); // Google Maps instance reference
  const [advancedMarkers, setAdvancedMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]); // AdvancedMarkerElement markers on map

  // Geocode address to get coordinates
  // Uses Google Maps Geocoding API to convert address/city/country to coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!isLoaded || !window.google?.maps) {
      console.warn('Google Maps not loaded yet, cannot geocode');
      return null;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      return new Promise((resolve) => {
        geocoder.geocode(
          {
            address,
            // Use componentRestrictions to improve accuracy
            // This helps when geocoding city+country to get the city, not country center
          },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              const resultType = results[0].types?.[0] || 'unknown';
              console.log(`Geocoded "${address}" -> (${location.lat()}, ${location.lng()}) [${resultType}]`);
              resolve({
                lat: location.lat(),
                lng: location.lng()
              });
            } else {
              console.warn('Geocoding failed for address:', address, 'Status:', status);
              resolve(null);
            }
          }
        );
      });
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  // Fetch photos with location data for the map
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted to prevent state updates after unmount

    const fetchMapPins = async () => {
      try {
        setMapLoading(true);
        const data = await api.getMapPins(); // Fetch all photos with location data
        console.log('Map pins API response:', data);
        if (!isMounted) return;

        if (data.success && data.photos) {
          console.log('Total photos received from API:', data.photos.length);
          console.log('Sample photo data:', data.photos[0]);
          // Process photos: those with GPS and those needing geocoding
          const photosWithGPS: Photo[] = []; // Photos that already have GPS coordinates
          const photosNeedingGeocoding: Photo[] = []; // Photos with address/city/country but no GPS

          data.photos.forEach((p: Photo) => {
            const hasGPS = !!(p.metadata?.gps?.latitude && p.metadata?.gps?.longitude);
            const hasLocation = !!(p.location && (p.location.address || p.location.city || p.location.country));

            console.log(`Photo ${p.id} (${p.fileName}):`, {
              hasGPS,
              hasLocation,
              gps: p.metadata?.gps,
              location: p.location
            });

            if (hasGPS) {
              photosWithGPS.push(p); // Already has coordinates, can show immediately
            } else if (hasLocation && p.location) {
              console.log('Photo needs geocoding:', p.id, p.fileName, {
                city: p.location.city,
                country: p.location.country,
                address: p.location.address
              });
              photosNeedingGeocoding.push(p); // Needs address-to-coordinates conversion
            } else {
              console.warn('Photo has no location data:', p.id, p.fileName);
            }
          });

          console.log('Photos with GPS:', photosWithGPS.length);
          console.log('Photos needing geocoding:', photosNeedingGeocoding.length);
          console.log('Sample photo with GPS:', photosWithGPS[0]);

          // Set photos with GPS immediately
          setMapPhotos(photosWithGPS);
          setFilteredMapPhotos(photosWithGPS);

          // Auto-center and zoom map to show all photos
          if (photosWithGPS.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            photosWithGPS.forEach(photo => {
              const gps = photo.metadata?.gps;
              if (gps?.latitude && gps?.longitude) {
                bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
              }
            });
            // Fit bounds will be handled after geocoding completes
          }

          console.log('Set mapPhotos to:', photosWithGPS.length, 'photos');

          // Geocode addresses for photos without GPS
          if (photosNeedingGeocoding.length > 0 && isLoaded && window.google?.maps) {
            console.log('Starting geocoding for', photosNeedingGeocoding.length, 'photos');
            const geocoded: Photo[] = []; // Photos successfully geocoded
            const geocodeMap = new Map<string, { lat: number; lng: number }>(); // Cache to avoid duplicate geocoding

            for (const photo of photosNeedingGeocoding) {
              // Build address string prioritizing precision:
              // 1. City + Country (most precise for city location)
              // 2. Just Country -> use capital city
              // 3. Full address (most precise overall)
              const addressParts: string[] = [];

              // Priority 1: Add city first (most specific location)
              if (photo.location?.city) {
                addressParts.push(photo.location.city);
              }
              // Priority 2: Add country (required for context, especially for city)
              if (photo.location?.country) {
                addressParts.push(photo.location.country);
              }
              // Priority 3: Add specific address if available (most precise)
              if (photo.location?.address && !addressParts.includes(photo.location.address)) {
                // Prepend address for most specific location
                addressParts.unshift(photo.location.address);
              }

              // Special handling: If only country (no city), geocode to capital city
              let geocodeQuery = '';
              if (addressParts.length > 0) {
                if (photo.location?.country && !photo.location?.city && !photo.location?.address) {
                  // Only country provided - geocode to capital city
                  geocodeQuery = `capital of ${photo.location.country}`;
                  console.log('Only country provided, geocoding to capital:', geocodeQuery);
                } else {
                  // City+Country or full address - use as is
                  geocodeQuery = addressParts.join(', ');
                }
              }

              // Geocode with what we have:
              // - City + Country = precise city location
              // - Just Country = capital city (better than country center)
              // - Address + City + Country = most precise
              if (geocodeQuery) {
                const cacheKey = geocodeQuery.toLowerCase(); // Use lowercase for cache key

                console.log('Geocoding address for photo:', photo.id, geocodeQuery);

                // Check cache first to avoid duplicate API calls
                let coords = geocodeMap.get(cacheKey);
                if (!coords) {
                  const geocodedResult = await geocodeAddress(geocodeQuery);
                  if (geocodedResult) {
                    coords = geocodedResult;
                    geocodeMap.set(cacheKey, coords); // Cache the result
                    console.log('Geocoded successfully:', geocodeQuery, '->', coords);
                  } else {
                    console.warn('Geocoding failed for:', geocodeQuery);
                  }
                } else {
                  console.log('Using cached coordinates for:', geocodeQuery);
                }

                if (coords) {
                  // Save geocoded coordinates to the database so they persist
                  try {
                    await api.updatePhoto(photo.id, {
                      metadata: {
                        ...photo.metadata,
                        gps: {
                          latitude: coords.lat,
                          longitude: coords.lng,
                          altitude: photo.metadata?.gps?.altitude
                        }
                      }
                    });
                    console.log('Saved geocoded coordinates for photo:', photo.id, coords);
                  } catch (err) {
                    console.error('Failed to save geocoded coordinates:', err);
                    // Continue anyway - we'll still show the pin for this session
                  }

                  // Add GPS coordinates to photo for display
                  const photoWithGPS = {
                    ...photo,
                    metadata: {
                      ...photo.metadata,
                      gps: {
                        latitude: coords.lat,
                        longitude: coords.lng,
                        altitude: photo.metadata?.gps?.altitude
                      }
                    }
                  };
                  geocoded.push(photoWithGPS);
                  console.log('Added geocoded photo to map:', photo.id, 'with GPS:', photoWithGPS.metadata.gps);
                } else {
                  console.warn('No coordinates for photo:', photo.id, photo.fileName);
                }
              } else {
                console.warn('No address parts for photo:', photo.id, photo.location);
              }
            }

            // Add geocoded photos to the map
            console.log('Geocoding complete. Geocoded photos:', geocoded.length);
            if (geocoded.length > 0) {
              console.log('Sample geocoded photo:', geocoded[0]);
              setMapPhotos(prev => {
                const updated = [...prev, ...geocoded];
                console.log('Total photos on map after geocoding:', updated.length);
                console.log('Sample photo GPS:', updated[0]?.metadata?.gps);
                return updated;
              });
              setFilteredMapPhotos(prev => {
                const updated = [...prev, ...geocoded];
                console.log('Total filtered photos on map after geocoding:', updated.length);
                return updated;
              });
              setGeocodedPhotos(geocodeMap);
            } else {
              console.log('No photos were geocoded successfully');
            }

            // After all photos are loaded (with GPS or geocoded), fit map to bounds
            const allPhotos = [...photosWithGPS, ...geocoded];
            if (allPhotos.length > 0 && isLoaded && window.google?.maps) {
              const bounds = new window.google.maps.LatLngBounds();
              allPhotos.forEach(photo => {
                const gps = photo.metadata?.gps;
                if (gps?.latitude && gps?.longitude) {
                  bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
                }
              });
              // Store bounds to use in map component
              setTimeout(() => {
                // Trigger map bounds update
                if (bounds.getNorthEast().lat() !== bounds.getSouthWest().lat() ||
                  bounds.getNorthEast().lng() !== bounds.getSouthWest().lng()) {
                  const center = bounds.getCenter();
                  setMapCenter({ lat: center.lat(), lng: center.lng() });
                  // Calculate appropriate zoom level
                  const ne = bounds.getNorthEast();
                  const sw = bounds.getSouthWest();
                  const latDiff = ne.lat() - sw.lat();
                  const lngDiff = ne.lng() - sw.lng();
                  const maxDiff = Math.max(latDiff, lngDiff);
                  let zoom = 2.5;
                  if (maxDiff < 0.1) zoom = 10;
                  else if (maxDiff < 0.5) zoom = 8;
                  else if (maxDiff < 1) zoom = 6;
                  else if (maxDiff < 5) zoom = 4;
                  else zoom = 3;
                  setMapZoom(zoom);
                  console.log('Map centered and zoomed to show all photos:', { center: { lat: center.lat(), lng: center.lng() }, zoom });
                }
              }, 100);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching map pins:', err);
      } finally {
        setMapLoading(false);
      }
    };

    if (isLoaded) {
      fetchMapPins();
    }

    // Also refetch when window regains focus (user might have updated photos in another tab)
    const handleFocus = () => {
      if (isLoaded && isMounted) {
        fetchMapPins();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Also listen for storage events (when photos are updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'photo-updated' && isLoaded && isMounted) {
        console.log('Photo updated detected, refreshing map...');
        fetchMapPins();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 60 seconds (much less frequent to avoid rate limiting)
    const pollInterval = setInterval(() => {
      if (isLoaded && isMounted) {
        fetchMapPins();
      }
    }, 60000); // Changed from 5000ms to 60000ms (1 minute)

    // Cleanup: remove event listeners and clear interval on unmount
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [isLoaded]);

  // Filter photos based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMapPhotos(mapPhotos); // Show all photos when search is empty
      return;
    }

    // Build searchable text from filename, tags, camera info, and location
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = mapPhotos.filter((photo) => {
      const searchableText = [
        photo.fileName,
        photo.displayName || '',
        ...photo.tags,
        photo.metadata?.cameraMake || '',
        photo.metadata?.cameraModel || '',
        // Location fields
        photo.location?.address || '',
        photo.location?.city || '',
        photo.location?.country || '',
      ].filter(Boolean).join(' ').toLowerCase(); // Filter out empty strings

      // Check if search term matches any part of searchable text
      return searchableText.includes(lowerSearch);
    });

    // Update filtered photos
    setFilteredMapPhotos(filtered);

    // Auto-center map on search results (show wider view to see city name)
    if (filtered.length > 0 && isLoaded && window.google?.maps) {
      // Calculate bounds for all results
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidBounds = false;

      filtered.forEach(photo => {
        const gps = photo.metadata?.gps;
        if (gps?.latitude && gps?.longitude) {
          bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
          hasValidBounds = true;
        }
      });

      if (hasValidBounds) {
        // Calculate center
        const center = bounds.getCenter();
        setMapCenter({ lat: center.lat(), lng: center.lng() });

        // Always use zoom level 7 for search results to show city name
        const targetZoom = 7;
        setMapZoom(targetZoom);

        // If map instance is available, also set zoom directly on the map
        if (mapInstance) {
          setTimeout(() => {
            // Set zoom first
            mapInstance.setZoom(targetZoom);
            // Then center on the bounds center
            mapInstance.setCenter(center);
          }, 100);
        }
      }
    } else if (!searchTerm.trim()) {
      // Reset to world view when search is cleared
      setMapCenter(defaultCenter);
      setMapZoom(2.5);
    }
  }, [searchTerm, mapPhotos, mapInstance, isLoaded]);

  // Fit map bounds when photos are loaded (fallback if AdvancedMarkerElement bounds fit doesn't work)
  useEffect(() => {
    console.log('Bounds fit effect triggered:', {
      hasMapInstance: !!mapInstance,
      photoCount: filteredMapPhotos.length,
      isLoaded
    });

    if (mapInstance && filteredMapPhotos.length > 0 && isLoaded && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidBounds = false;

      // Build bounds from all photos with GPS coordinates
      filteredMapPhotos.forEach(photo => {
        const gps = photo.metadata?.gps;
        if (gps?.latitude !== undefined && gps?.longitude !== undefined) {
          bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
          hasValidBounds = true;
          console.log('Added to bounds:', gps.latitude, gps.longitude);
        }
      });

      if (hasValidBounds) {
        try {
          // Add padding so markers aren't at the edge
          mapInstance.fitBounds(bounds, 50);
          console.log('Map bounds fitted to show all photos:', filteredMapPhotos.length, 'photos');
          console.log('Bounds:', {
            ne: bounds.getNorthEast().toJSON(),
            sw: bounds.getSouthWest().toJSON()
          });
        } catch (err) {
          console.error('Error fitting bounds:', err);
        }
      } else {
        console.log('No valid bounds to fit');
      }
    }
  }, [mapInstance, filteredMapPhotos, isLoaded]);


  // Create AdvancedMarkerElement markers when map and photos are ready
  useEffect(() => {
    if (!mapInstance || !isLoaded || filteredMapPhotos.length === 0 || !window.google?.maps) {
      return; // Wait for map and photos to be ready
    }

    const createAdvancedMarkers = async () => {
      try {
        console.log('Creating AdvancedMarkerElement markers for', filteredMapPhotos.length, 'photos');

        // Import the marker library (required for AdvancedMarkerElement)
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

        // Clear existing markers before creating new ones
        advancedMarkers.forEach(marker => {
          marker.map = null;
        });
        setAdvancedMarkers([]);

        // Group photos by location (round coordinates to group nearby photos)
        const locationGroups = new Map<string, Photo[]>();

        filteredMapPhotos.forEach((photo) => {
          const gps = photo.metadata?.gps;
          if (!gps || gps.latitude === undefined || gps.longitude === undefined) return;

          // Round to 4 decimal places (~11 meters precision) to group nearby photos
          const roundedLat = Math.round(gps.latitude * 10000) / 10000;
          const roundedLng = Math.round(gps.longitude * 10000) / 10000;
          const locationKey = `${roundedLat},${roundedLng}`;

          if (!locationGroups.has(locationKey)) {
            locationGroups.set(locationKey, []);
          }
          locationGroups.get(locationKey)!.push(photo);
        });

        console.log('Location groups for AdvancedMarkerElement:', locationGroups.size);

        // Create markers for each location group
        const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
        const bounds = new window.google.maps.LatLngBounds();

        locationGroups.forEach((photos, locationKey) => {
          const firstPhoto = photos[0];
          const gps = firstPhoto.metadata?.gps!;
          const position = { lat: gps.latitude, lng: gps.longitude };

          // Create content for marker using custom orange teardrop pin icon
          const content = document.createElement('div');
          content.style.cssText = `
            width: 32px;
            height: 40px;
            position: relative;
            cursor: pointer;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          `;

          // Create SVG for teardrop pin icon
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '32');
          svg.setAttribute('height', '40');
          svg.setAttribute('viewBox', '0 0 32 40');
          svg.style.cssText = 'position: absolute; top: 0; left: 0;';

          // Teardrop shape (path)
          const pinPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pinPath.setAttribute('d', 'M16 0C10.477 0 6 4.477 6 10c0 6 10 18 10 18s10-12 10-18c0-5.523-4.477-10-10-10z');
          pinPath.setAttribute('fill', '#ff4e00');
          svg.appendChild(pinPath);

          // White circle in center
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '16');
          circle.setAttribute('cy', '12');
          circle.setAttribute('r', '6');
          circle.setAttribute('fill', 'white');
          svg.appendChild(circle);

          // Add count text if multiple photos
          if (photos.length > 1) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '16');
            text.setAttribute('y', '15');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#ff4e00');
            text.textContent = photos.length.toString();
            svg.appendChild(text);
          }

          content.appendChild(svg);

          const marker = new AdvancedMarkerElement({
            map: mapInstance,
            position: position,
            content: content,
            title: photos.length === 1
              ? (photos[0].displayName || photos[0].fileName)
              : `${photos.length} photos at this location`
          });

          // Add click listener to toggle side panel with photos
          marker.addListener('click', () => {
            console.log('Advanced marker clicked:', locationKey, photos.length, 'photos');

            // Check if this location is already selected
            if (selectedLocation &&
              Math.abs(selectedLocation.lat - position.lat) < 0.0001 &&
              Math.abs(selectedLocation.lng - position.lng) < 0.0001) {
              // Same location clicked - close the panel
              setSelectedLocation(null);
            } else {
              // Different location or no location selected - open the panel
              setSelectedLocation({ ...position, photos });
            }
          });

          newMarkers.push(marker);
          bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
          console.log('Created AdvancedMarkerElement at:', position, 'for', photos.length, 'photos');
        });

        setAdvancedMarkers(newMarkers);
        console.log('Total AdvancedMarkerElement markers created:', newMarkers.length);

        // Fit bounds to show all markers
        if (locationGroups.size > 0) {
          mapInstance.fitBounds(bounds, 50);
          console.log('Map bounds fitted to show all advanced markers');
        }
      } catch (err) {
        console.error('Error creating advanced markers:', err);
      }
    };

    createAdvancedMarkers();

    // Cleanup: remove markers when component unmounts or dependencies change
    return () => {
      advancedMarkers.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
    };
  }, [mapInstance, filteredMapPhotos, isLoaded]);


  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom>
          Photo Locations
        </Typography>

        {/* Search bar */}
        <Box sx={{ mb: 2 }}>
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
              Found {filteredMapPhotos.length} photo{filteredMapPhotos.length !== 1 ? 's' : ''}
            </Box>
          )}
        </Box>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading Google Maps. Please check your API key.
          </Alert>
        )}

        {(!isLoaded || mapLoading) ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '500px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flex: 1, minHeight: '500px', gap: 2 }}>
            {/* Side panel for photos */}
            <Drawer
              anchor="left"
              open={!!selectedLocation}
              onClose={() => setSelectedLocation(null)}
              variant="persistent"
              sx={{
                width: selectedLocation ? 400 : 0,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: 400,
                  boxSizing: 'border-box',
                  position: 'relative',
                  height: '100%',
                  border: 'none',
                  boxShadow: 3,
                  backgroundColor: 'background.paper',
                },
              }}
            >
              {selectedLocation && (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'background.paper' }}>
                  {/* Header */}
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedLocation.photos.length} Photo{selectedLocation.photos.length !== 1 ? 's' : ''}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedLocation(null)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    {selectedLocation.photos[0].location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <LocationOnIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {[
                            selectedLocation.photos[0].location?.address,
                            selectedLocation.photos[0].location?.city,
                            selectedLocation.photos[0].location?.country
                          ].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Photos grid */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: 'background.paper' }}>
                    <Grid container spacing={2}>
                      {selectedLocation.photos.map((photo) => (
                        <Grid item xs={6} key={photo.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              backgroundColor: 'background.paper',
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: 4,
                              },
                            }}
                            onClick={() => {
                              setViewingPhoto(photo);
                              setViewerPhotos(selectedLocation.photos);
                              setViewerOpen(true);
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={photo.thumbnailUrl || photo.url}
                              alt={photo.displayName || photo.fileName}
                              sx={{
                                aspectRatio: '1',
                                objectFit: 'cover',
                              }}
                            />
                            <Box sx={{ p: 1 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                {photo.displayName || photo.fileName}
                              </Typography>
                              {photo.metadata?.takenAt && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(photo.metadata.takenAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              )}
            </Drawer>

            {/* Map */}
            <Box sx={{ flex: 1, position: 'relative', minHeight: '500px', transition: 'margin-left 0.3s' }}>
              <GoogleMap
                mapContainerStyle={{
                  ...mapContainerStyle,
                  marginLeft: selectedLocation ? '0' : '0',
                }}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={(map) => {
                  setMapInstance(map); // Save map instance for programmatic control
                  console.log('Map loaded, instance saved');

                  // Immediately try to fit bounds if we have photos (before AdvancedMarkerElement markers are created)
                  if (filteredMapPhotos.length > 0) {
                    setTimeout(() => {
                      const bounds = new window.google.maps.LatLngBounds();
                      let hasValidBounds = false;

                      filteredMapPhotos.forEach(photo => {
                        const gps = photo.metadata?.gps;
                        if (gps?.latitude !== undefined && gps?.longitude !== undefined) {
                          bounds.extend(new window.google.maps.LatLng(gps.latitude, gps.longitude));
                          hasValidBounds = true;
                        }
                      });

                      if (hasValidBounds) {
                        map.fitBounds(bounds, 50);
                        console.log('Map bounds fitted on load:', filteredMapPhotos.length, 'photos');
                      }
                    }, 500); // Small delay to ensure map is fully rendered
                  }
                }}
                options={{
                  mapId: 'PHOTOPIN_MAP_ID', // Required for AdvancedMarkerElement
                  mapTypeControl: true,
                  streetViewControl: true,
                  fullscreenControl: true,
                  minZoom: 2, // Prevent zooming out beyond world view
                  maxZoom: 20, // Allow zooming in close
                  restriction: {
                    latLngBounds: {
                      north: 85,
                      south: -85,
                      east: 180,
                      west: -180,
                    },
                    strictBounds: false, // Allow slight overflow for better UX
                  },
                }}
              >
                {/* Markers are created using AdvancedMarkerElement in useEffect - no JSX markers needed */}
              </GoogleMap>
            </Box>
          </Box>
        )}

        {mapPhotos.length === 0 && !mapLoading && (
          <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No photos with location data yet. Upload photos with GPS information to see them on the map.
            </Typography>
          </Box>
        )}
        {mapPhotos.length > 0 && !mapLoading && (
          <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              Showing {filteredMapPhotos.length} photo{filteredMapPhotos.length !== 1 ? 's' : ''} on the map
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Full screen photo viewer */}
      <PhotoViewer
        open={viewerOpen}
        photo={viewingPhoto}
        photos={viewerPhotos.length > 0 ? viewerPhotos : filteredMapPhotos} // Show location photos if available, otherwise all photos
        onClose={() => {
          setViewerOpen(false);
          setViewingPhoto(null);
          setViewerPhotos([]);
        }}
        onFavoriteToggle={(updatedPhoto) => {
          // Update photo in all relevant state lists when favorite status changes
          setMapPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
          setFilteredMapPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
          setViewerPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
          if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
            setViewingPhoto(updatedPhoto);
          }
        }}
      />
    </Box>
  );
};

