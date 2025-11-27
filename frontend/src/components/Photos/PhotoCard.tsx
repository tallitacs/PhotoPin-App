import React from 'react';
import {
  Card,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import { Photo } from '../../types/photo.types';
import { format } from 'date-fns';

interface PhotoCardProps {
  photo: Photo;
  onDelete?: (photoId: string) => void;
  onClick?: (photo: Photo) => void;
  onEdit?: (photo: Photo) => void;
  onSetCover?: (photo: Photo) => void;
  isCover?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photo, 
  onDelete, 
  onClick,
  onEdit,
  onSetCover,
  isCover
}) => {
  const [showOverlay, setShowOverlay] = React.useState(false);
  
  // Calculate aspect ratio
  const width = photo.metadata?.width || 1;
  const height = photo.metadata?.height || 1;
  const aspectRatio = width / height;

  return (
    <Card 
      sx={{ 
        width: '100%',
        height: '100%', // Fill parent container
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 1,
        padding: 0,
        margin: 0,
        minHeight: 0, // Important: allow shrinking below content size
        maxHeight: '100%', // Don't exceed parent height
        flex: '1 1 0', // Fill available space
        '& .MuiCardContent-root': {
          padding: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        },
        '&:hover': {
          boxShadow: 4,
          '& .photo-overlay': {
            opacity: 1
          },
          '& .photo-actions': {
            opacity: 1
          }
        }
      }}
      onClick={() => {
        onClick?.(photo);
      }}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <Box
        onClick={() => onClick?.(photo)}
        sx={{
          width: '100%',
          height: '100%', // Fill parent container height
          position: 'relative',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <Box
          component="img"
          className="photo-image"
          src={photo.thumbnailUrl || photo.url}
          alt={photo.displayName || photo.fileName}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: photo.metadata?.rotation 
              ? `rotate(${photo.metadata.rotation}deg)` 
              : 'none',
            transition: 'transform 0.3s ease',
            pointerEvents: 'none'
          }}
        />
        
        {/* Favorite indicator */}
        {photo.isFavorite && (
          <FavoriteIcon
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#ff1744',
              fontSize: '1.2rem',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Overlay with metadata - always visible, bottom */}
        <Box
          className="photo-overlay"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 1.5,
            pointerEvents: 'none',
            zIndex: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Date */}
            {photo.metadata?.takenAt && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
                  display: 'block',
                  fontSize: '0.75rem'
                }}
              >
                {format(new Date(photo.metadata.takenAt), 'MMM d, yyyy')}
              </Typography>
            )}

            {/* Location */}
            {photo.location && (photo.location.city || photo.location.address || photo.location.country) && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon sx={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  mr: 0.5,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
                    fontSize: '0.75rem'
                  }}
                >
                  {photo.location.city || photo.location.address || photo.location.country}
                  {photo.location.city && photo.location.country && `, ${photo.location.country}`}
                </Typography>
              </Box>
            )}

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                {photo.tags.slice(0, 2).map((tag: string, idx: number) => (
                  <Chip
                    key={idx}
                    label={tag}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      color: 'rgba(0, 0, 0, 0.7)',
                      fontWeight: 500,
                      border: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      '& .MuiChip-label': {
                        padding: '0 8px'
                      }
                    }}
                  />
                ))}
                {photo.tags.length > 2 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      alignSelf: 'center',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      fontSize: '0.7rem'
                    }}
                  >
                    +{photo.tags.length - 2}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Action buttons - show on hover */}
        {(onEdit || onDelete || onSetCover) && (
          <Box
            className="photo-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              opacity: showOverlay ? 1 : 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'auto'
            }}
          >
            {onSetCover && (
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover(photo);
                }}
                sx={{
                  backgroundColor: isCover ? 'primary.main' : 'rgba(255, 255, 255, 0.9)',
                  color: isCover ? 'white' : 'inherit',
                  '&:hover': {
                    backgroundColor: isCover ? 'primary.dark' : 'rgba(255, 255, 255, 1)'
                  }
                }}
                title={isCover ? 'Cover photo' : 'Set as cover'}
              >
                <StarIcon fontSize="small" />
              </IconButton>
            )}
            {onEdit && (
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo);
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
};
