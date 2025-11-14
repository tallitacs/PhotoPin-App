import React from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Typography, Box } from '@mui/material';
import { PhotoMetadata } from '../../types/photo.types';

interface MapMarkerProps {
  photo: PhotoMetadata;
  onClick?: (photo: PhotoMetadata) => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ photo, onClick }) => {
  const [showInfo, setShowInfo] = React.useState(false);

  if (!photo.location) return null;

  return (
    <Marker
      position={{
        lat: photo.location.latitude,
        lng: photo.location.longitude
      }}
      onClick={() => setShowInfo(true)}
    >
      {showInfo && (
        <InfoWindow onCloseClick={() => setShowInfo(false)}>
          <Box sx={{ maxWidth: 200 }}>
            <img 
              src={photo.thumbnailUrl || photo.url} 
              alt={photo.title || photo.filename}
              style={{ width: '100%', height: 'auto', marginBottom: 8 }}
            />
            <Typography variant="subtitle2">
              {photo.title || photo.filename}
            </Typography>
            {photo.location.city && (
              <Typography variant="caption" color="text.secondary">
                {photo.location.city}
              </Typography>
            )}
          </Box>
        </InfoWindow>
      )}
    </Marker>
  );
};