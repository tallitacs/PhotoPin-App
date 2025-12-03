import React from 'react';
import {
  Card,
  Typography,
  IconButton,
  Box,
  Chip,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { Photo } from '../../types/photo.types';
import { format } from 'date-fns';

// Props for PhotoCard component
interface PhotoCardProps {
  photo: Photo; // The photo data to display
  onDelete?: (photoId: string) => void; // Callback when photo is deleted
  onClick?: (photo: Photo) => void; // Callback when photo card is clicked (opens photo viewer)
  onEdit?: (photo: Photo) => void; // Callback when photo is edited
  onSetCover?: (photo: Photo) => void; // Callback to set photo as album cover
  isCover?: boolean; // Whether this photo is the album cover
  isSelected?: boolean; // Whether this photo is currently selected
  onSelect?: (photoId: string, selected: boolean) => void; // Callback when photo selection is toggled
  selectionMode?: boolean; // Whether selection mode is active
  onFavoriteToggle?: (photo: Photo) => void; // Callback when favorite status is toggled
  onToggleSelectionMode?: () => void; // Callback to enter selection mode (triggered by checkmark button)
}

// PhotoCard: Displays photo with action buttons (hover), selection checkbox, and metadata overlay
// Supports normal mode (click to view) and selection mode (click to select)
export const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photo, 
  onDelete, 
  onClick,
  onEdit,
  onSetCover,
  isCover,
  isSelected = false,
  onSelect,
  selectionMode = false,
  onFavoriteToggle,
  onToggleSelectionMode
}) => {
  const [showOverlay, setShowOverlay] = React.useState(false); // Controls visibility of action buttons (shown on hover)
  
  // Calculate aspect ratio for proper image display
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
        onClick={(e) => {
          if (selectionMode && onSelect) {
            e.stopPropagation();
            onSelect(photo.id, !isSelected);
          } else {
            onClick?.(photo);
          }
        }}
        sx={{
          width: '100%',
          height: '100%', // Fill parent container height
          position: 'relative',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          cursor: selectionMode ? 'pointer' : (onClick ? 'pointer' : 'default'),
          opacity: isSelected ? 0.7 : 1,
          border: isSelected ? '3px solid' : '3px solid transparent',
          borderColor: isSelected ? 'primary.main' : 'transparent',
          borderRadius: 1,
          zIndex: 1 // Ensure proper stacking context
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
        
        {/* Circular Action Buttons Row - positioned at top right */}
        {!selectionMode && (onToggleSelectionMode || onFavoriteToggle || onEdit || onDelete) && (
          <Box
            className="photo-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 1,
              opacity: showOverlay ? 1 : 0, // Only visible on hover
              transition: 'opacity 0.2s',
              pointerEvents: 'auto', // Always allow clicks
              zIndex: 20 // Higher z-index to ensure it's above other elements
            }}
          >
            {/* Select Button - circular with checkmark */}
            {onToggleSelectionMode && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleSelectionMode();
                }}
                sx={(theme) => ({
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 78, 0, 0.6)'
                    : 'rgba(255, 78, 0, 0.6)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  pointerEvents: 'auto', // Ensure button is always clickable
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 78, 0, 0.8)'
                      : 'rgba(255, 78, 0, 0.8)',
                    transform: 'scale(1.1)'
                  }
                })}
                title="Select photo"
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            )}

            {/* Favorite Button */}
            {onFavoriteToggle && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle(photo);
                }}
                sx={(theme) => ({
                  backgroundColor: photo.isFavorite
                    ? (theme.palette.mode === 'dark' ? 'rgba(255, 23, 68, 0.6)' : 'rgba(255, 23, 68, 0.6)')
                    : (theme.palette.mode === 'dark' ? 'rgba(255, 78, 0, 0.6)' : 'rgba(255, 78, 0, 0.6)'),
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: photo.isFavorite
                      ? (theme.palette.mode === 'dark' ? 'rgba(255, 23, 68, 0.8)' : 'rgba(255, 23, 68, 0.8)')
                      : (theme.palette.mode === 'dark' ? 'rgba(255, 78, 0, 0.8)' : 'rgba(255, 78, 0, 0.8)'),
                    transform: 'scale(1.1)'
                  }
                })}
                title={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {photo.isFavorite ? (
                  <FavoriteIcon fontSize="small" />
                ) : (
                  <FavoriteBorderIcon fontSize="small" />
                )}
              </IconButton>
            )}

            {/* Edit Button */}
            {onEdit && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo);
                }}
                sx={(theme) => ({
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 78, 0, 0.6)'
                    : 'rgba(255, 78, 0, 0.6)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 78, 0, 0.8)'
                      : 'rgba(255, 78, 0, 0.8)',
                    transform: 'scale(1.1)'
                  }
                })}
                title="Edit photo"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}

            {/* Delete Button */}
            {onDelete && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id);
                }}
                sx={(theme) => ({
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(211, 47, 47, 0.6)'
                    : 'rgba(211, 47, 47, 0.6)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(211, 47, 47, 0.8)'
                      : 'rgba(211, 47, 47, 0.8)',
                    transform: 'scale(1.1)'
                  }
                })}
                title="Delete photo"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}

        {/* Selection checkmark - shown in selection mode when selected */}
        {selectionMode && isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <CheckIcon sx={{ fontSize: '16px' }} />
          </Box>
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

        {/* Set Cover Button - shown in album views */}
        {onSetCover && !selectionMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 4,
              opacity: showOverlay ? 1 : 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'auto'
            }}
          >
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onSetCover(photo);
              }}
              sx={(theme) => ({
                backgroundColor: isCover
                  ? (theme.palette.mode === 'dark' ? '#ff8c5a' : 'rgba(255, 140, 90, 0.95)')
                  : (theme.palette.mode === 'dark' ? 'rgba(255, 140, 90, 0.9)' : 'rgba(255, 140, 90, 0.95)'),
                color: isCover ? '#121212' : (theme.palette.mode === 'dark' ? '#121212' : '#ffffff'),
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': {
                  backgroundColor: isCover
                    ? (theme.palette.mode === 'dark' ? '#ffa366' : 'rgba(255, 140, 90, 1)')
                    : (theme.palette.mode === 'dark' ? 'rgba(255, 140, 90, 1)' : 'rgba(255, 140, 90, 1)'),
                  transform: 'scale(1.1)'
                }
              })}
              title={isCover ? 'Cover photo' : 'Set as cover'}
            >
              <StarIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Card>
  );
};
