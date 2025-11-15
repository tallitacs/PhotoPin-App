import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Box, CircularProgress, Alert } from '@mui/material';
import { PhotoMetadata } from '../../types/photo.types';
import * as api from '../../services/api.service';

const containerStyle = {
  width: '100%',
  height: '80vh', // Adjust height as needed
};

// Default center (e.g., world map)
const center = {
  lat: 20,
  lng: 0,
};

export const MapView: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
  });

  const [pins, setPins] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const data = await api.getMapPins();
        if (data.success) {
          // Filter out any photos that might not have location data
          setPins(data.photos.filter(p => p.location));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPins();
  }, []);

  if (loadError) {
    return <Alert severity="error">Error loading Google Maps</Alert>;
  }

  if (!isLoaded || loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={2}
    >
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={{
            lat: pin.location!.latitude,
            lng: pin.location!.longitude,
          }}
          // You can add an InfoWindow onClick later
        />
      ))}
    </GoogleMap>
  );
};