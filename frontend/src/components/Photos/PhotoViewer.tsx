import React, { useEffect, useState } from 'react';
import { Box, IconButton, Dialog, Typography, Chip, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
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
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [location, setLocation] = useState({
    address: '',
    city: '',
    country: ''
  });
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

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
      setDisplayName(currentPhoto.displayName || '');
      setTags(currentPhoto.tags || []);
      setLocation({
        address: currentPhoto.location?.address || '',
        city: currentPhoto.location?.city || '',
        country: currentPhoto.location?.country || ''
      });
      setDescription(currentPhoto.metadata?.description || '');
      setEditMode(false); // Exit edit mode when photo changes
    }
  }, [currentPhoto]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle navigation keys when in edit mode
      if (editMode) {
        if (e.key === 'Escape') {
          handleCancel();
        }
        return;
      }

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
  }, [open, currentIndex, photos.length, editMode]);

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

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!currentPhoto) return;

    setSaving(true);
    try {
      const updates: any = {
        tags: tags,
        displayName: displayName.trim() || undefined,
        metadata: {
          ...currentPhoto.metadata,
          description: description || undefined
        }
      };

      // Build location object
      const locationData: any = {};
      if (location.address) locationData.address = location.address;
      if (location.city) locationData.city = location.city;
      if (location.country) locationData.country = location.country;
      
      if (Object.keys(locationData).length > 0) {
        updates.location = locationData;
      }

      const response = await api.updatePhoto(currentPhoto.id, updates);

      if (response.success && response.photo) {
        setCurrentPhoto(response.photo);
        setEditMode(false);
        onEdit?.(response.photo);
      } else {
        console.error('Failed to update photo');
        alert('Failed to update photo');
      }
    } catch (err) {
      console.error('Error updating photo:', err);
      alert('Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentPhoto) {
      setDisplayName(currentPhoto.displayName || '');
      setTags(currentPhoto.tags || []);
      setLocation({
        address: currentPhoto.location?.address || '',
        city: currentPhoto.location?.city || '',
        country: currentPhoto.location?.country || ''
      });
      setDescription(currentPhoto.metadata?.description || '');
    }
    setEditMode(false);
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
            {editMode ? (
              <TextField
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={currentPhoto.fileName}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 140, 90, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 140, 90, 0.8)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff8c5a',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  width: '300px'
                }}
              />
            ) : (
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                {currentPhoto.displayName || currentPhoto.fileName}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleToggleFavorite}
              sx={{
                backgroundColor: isFavorite
                  ? 'rgba(255, 23, 68, 0.6)'
                  : 'rgba(255, 78, 0, 0.6)',
                color: '#ffffff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': {
                  backgroundColor: isFavorite
                    ? 'rgba(255, 23, 68, 0.8)'
                    : 'rgba(255, 78, 0, 0.8)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            {editMode ? (
              <>
                <IconButton
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.9)',
                    color: '#ffffff',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 1)',
                      transform: 'scale(1.1)'
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(76, 175, 80, 0.5)',
                    }
                  }}
                >
                  <CheckIcon />
                </IconButton>
                <IconButton
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{
                    backgroundColor: 'rgba(158, 158, 158, 0.9)',
                    color: '#ffffff',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(158, 158, 158, 1)',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={() => setEditMode(true)}
                sx={{
                  backgroundColor: 'rgba(255, 78, 0, 0.6)',
                  color: '#ffffff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 78, 0, 0.8)',
                    transform: 'scale(1.1)'
                  }
                }}
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
                sx={{
                  backgroundColor: 'rgba(211, 47, 47, 0.6)',
                  color: '#ffffff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.8)',
                    transform: 'scale(1.1)'
                  }
                }}
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
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
            maxHeight: editMode ? '50vh' : 'auto',
            overflowY: editMode ? 'auto' : 'visible'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editMode ? (
              <>
                {/* Editable Tags */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#ff8c5a', mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    {tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(tag)}
                        sx={{
                          backgroundColor: 'rgba(255, 140, 90, 0.3)',
                          color: 'white',
                          border: '1px solid rgba(255, 140, 90, 0.5)',
                          '& .MuiChip-deleteIcon': {
                            color: 'white'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      sx={{
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 140, 90, 0.5)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 140, 90, 0.8)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff8c5a',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      sx={{
                        backgroundColor: 'rgba(255, 140, 90, 0.9)',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 140, 90, 1)',
                        },
                        '&:disabled': {
                          backgroundColor: 'rgba(255, 140, 90, 0.3)',
                        }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Editable Location */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#ff8c5a', mb: 1 }}>
                    Location
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Address"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 140, 90, 0.5)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 140, 90, 0.8)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff8c5a',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="City"
                        value={location.city}
                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 140, 90, 0.5)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 140, 90, 0.8)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff8c5a',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          },
                        }}
                      />
                      <TextField
                        size="small"
                        placeholder="Country"
                        value={location.country}
                        onChange={(e) => setLocation({ ...location, country: e.target.value })}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 140, 90, 0.5)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 140, 90, 0.8)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff8c5a',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Editable Description */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#ff8c5a', mb: 1 }}>
                    Description
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    placeholder="Add a description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 140, 90, 0.5)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 140, 90, 0.8)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ff8c5a',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                    }}
                  />
                </Box>
              </>
            ) : (
              <>
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

                {/* Description */}
                {currentPhoto.metadata?.description && (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {currentPhoto.metadata.description}
                  </Typography>
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
                          backgroundColor: 'rgba(255, 140, 90, 0.3)',
                          color: 'white',
                          border: '1px solid rgba(255, 140, 90, 0.5)'
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
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

