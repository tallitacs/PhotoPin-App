import React, { useEffect, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { Box, CircularProgress } from '@mui/material';
import { MapMarker } from './MapMarker';
import { PhotoMetadata } from '../../types/photo.types';
import apiService from '../../services/api.service';

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

interface MapViewProps {
  onPhotoClick?: (photo: PhotoMetadata) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onPhotoClick }) => {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    loadMapPins();
  }, []);

  const loadMapPins = async () => {
    try {
      const response = await apiService.getMapPins();
      setPhotos(response.data);
    } catch (err) {
      console.error('Failed to load map pins:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="600px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={10}
      center={defaultCenter}
    >
      {photos.map((photo) => (
        photo.location && (
          <MapMarker
            key={photo.id}
            photo={photo}
            onClick={onPhotoClick}
          />
        )
      ))}
    </GoogleMap>
  );