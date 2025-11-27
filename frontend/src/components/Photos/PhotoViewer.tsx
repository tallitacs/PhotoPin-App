import React, { useEffect, useState } from 'react';
import { Box, IconButton, Dialog, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Photo } from '../../types/photo.types';
import { format } from 'date-fns';
import * as api from '../../services/api.service';

interface PhotoViewerProps {
  open: boolean;
  photo: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onEdit?: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
  onFavoriteToggle?: (photo: Photo) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  open,
  photo,
  photos,
  onClose,
  onEdit,
  onDelete,
  onFavoriteToggle
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(photo);
  const [isFavorite, setIsFavorite] = useState(false);

  // Update current photo when prop changes
  useEffect(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id);
      setCurrentIndex(index >= 0 ? index : 0);
      setCurrentPhoto(photos[index >= 0 ? index : 0] || photo);
      setIsFavorite(photo.isFavorite || false);
    }
  }, [photo, photos]);

  // Update favorite status when current photo changes
  useEffect(() => {
    if (currentPhoto) {
      setIsFavorite(currentPhoto.isFavorite || false);
    }
  }, [currentPhoto]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, photos.length]);

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentPhoto(photos[newIndex]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentPhoto(photos[newIndex]);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentPhoto) return;

    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    try {
      const response = await api.updatePhoto(currentPhoto.id, {
        isFavorite: newFavoriteStatus
      });

      if (response.success && response.photo) {
        setCurrentPhoto(response.photo);
        onFavoriteToggle?.(response.photo);
      } else {
        // Revert on error
        setIsFavorite(!newFavoriteStatus);
        console.error('Failed to update favorite status');
      }
    } catch (err) {
      // Revert on error
      setIsFavorite(!newFavoriteStatus);
      console.error('Error toggling favorite:', err);
    }
  };

  if (!currentPhoto) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          m: 0,
          p: 0
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header with controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
              {currentPhoto.displayName || currentPhoto.fileName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleToggleFavorite}
              sx={{
                color: isFavorite ? '#ff1744' : 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            {onEdit && (
              <IconButton
                onClick={() => onEdit(currentPhoto)}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <EditIcon />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                onClick={() => {
                  if (window.confirm('Delete this photo?')) {
                    onDelete(currentPhoto.id);
                    if (currentIndex === photos.length - 1 && currentIndex > 0) {
                      handlePrevious();
                    } else if (photos.length > 1) {
                      handleNext();
                    } else {
                      onClose();
                    }
                  }
                }}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Main photo display */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Previous button */}
          {currentIndex > 0 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                zIndex: 10,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
              }}
            >
              <ArrowBackIosIcon />
            </IconButton>
          )}

          {/* Photo */}
          <Box
            component="img"
            src={currentPhoto.url}
            alt={currentPhoto.displayName || currentPhoto.fileName}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: currentPhoto.metadata?.rotation
                ? `rotate(${currentPhoto.metadata.rotation}deg)`
                : 'none'
            }}
          />

          {/* Next button */}
          {currentIndex < photos.length - 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                zIndex: 10,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}
        </Box>

        {/* Footer with metadata */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            p: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Date */}
            {currentPhoto.metadata?.takenAt && (
              <Typography variant="body2" sx={{ color: 'white' }}>
                {format(new Date(currentPhoto.metadata.takenAt), 'MMM d, yyyy')}
              </Typography>
            )}

            {/* Location */}
            {currentPhoto.location && (currentPhoto.location.city || currentPhoto.location.address || currentPhoto.location.country) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: '1rem', color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {currentPhoto.location.city || currentPhoto.location.address || currentPhoto.location.country}
                  {currentPhoto.location.city && currentPhoto.location.country && `, ${currentPhoto.location.country}`}
                </Typography>
              </Box>
            )}

            {/* Tags */}
            {currentPhoto.tags && currentPhoto.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {currentPhoto.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Photo counter */}
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {currentIndex + 1} of {photos.length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

