import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PhotoMetadata } from '../../types/photo.types';
import { format } from 'date-fns';

interface PhotoCardProps {
  photo: PhotoMetadata;
  onDelete?: (photoId: string) => void;
  onClick?: (photo: PhotoMetadata) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photo, 
  onDelete, 
  onClick 
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'scale(1.02)' } : {}
      }}
      onClick={() => onClick?.(photo)}
    >
      <CardMedia
        component="img"
        height="200"
        image={photo.thumbnailUrl || photo.url}
        alt={photo.title || photo.filename}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Typography variant="subtitle2" gutterBottom noWrap>
            {photo.title || photo.filename}
          </Typography>
          {onDelete && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {photo.takenAt && (
          <Typography variant="caption" color="text.secondary" display="block">
            {format(new Date(photo.takenAt), 'MMM d, yyyy')}
          </Typography>
        )}
        
        {photo.location && (
          <Box display="flex" alignItems="center" mt={1}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary" ml={0.5}>
              {photo.location.city || photo.location.address}
            </Typography>
          </Box>
        )}
        
        {photo.tags && photo.tags.length > 0 && (
          <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
            {photo.tags.slice(0, 3).map((tag, idx) => (
              <Chip key={idx} label={tag} size="small" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
