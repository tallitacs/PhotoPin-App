import React from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { Typography, Box } from '@mui/material';
import { Photo } from '../../types/photo.types';

interface MapMarkerProps {
  photo: Photo;
  onClick?: (photo: Photo) => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ photo, onClick }) => {
  const [showInfo, setShowInfo] = React.useState(false);

  // Check if photo has GPS coordinates
  if (!photo.metadata?.gps) return null;

  return (
    <Marker
      position={{
        lat: photo.metadata.gps.latitude,
        lng: photo.metadata.gps.longitude
      }}
      onClick={() => setShowInfo(true)}
    >
      {showInfo && (
        <InfoWindow onCloseClick={() => setShowInfo(false)}>
          <Box sx={{ maxWidth: 200 }}>
            <img 
              src={photo.thumbnailUrl || photo.url} 
              alt={photo.fileName}
              style={{ width: '100%', height: 'auto', marginBottom: 8 }}
            />
            <Typography variant="subtitle2">
              {photo.displayName || photo.fileName}
            </Typography>
            {photo.location?.city && (
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