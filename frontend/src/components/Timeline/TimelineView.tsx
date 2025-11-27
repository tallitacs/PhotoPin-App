import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';
import { PhotoCard } from '../Photos/PhotoCard';
import { EditPhotoDialog } from '../Photos/EditPhotoDialog';
import { PhotoViewer } from '../Photos/PhotoViewer';
import { Photo } from '../../types/photo.types';
import * as api from '../../services/api.service';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const TimelineView: React.FC = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Get responsive height based on breakpoint (same as gallery)
  const getPhotoHeight = () => {
    if (isXl) return 280;
    if (isLg) return 260;
    if (isMd) return 240;
    if (isSm) return 220;
    return 200; // xs
  };
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching photos from:', process.env.REACT_APP_API_URL);
        const data = await api.getPhotos();
        console.log('Photos response:', data);
        if (data.success) {
          const photosList = data.photos || [];
          console.log('Setting photos:', photosList.length, 'photos');
          console.log('Sample photo:', photosList[0]);
          setPhotos(photosList);
        } else {
          setError(data.error || 'Failed to fetch photos.');
        }
      } catch (err: any) {
        console.error('Photo fetch error:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText
        });
        const errorMessage = err.response?.data?.error || err.message || 'An error occurred while fetching photos.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  // Group photos by date and location
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    
    console.log('Grouping photos:', photos.length, 'photos');
    
    photos.forEach(photo => {
      // Use takenAt if available, otherwise use uploadedAt
      const dateStr = photo.metadata?.takenAt || photo.uploadedAt;
      if (!dateStr) {
        console.warn('Photo missing date:', photo.id, photo.fileName);
        return;
      }
      
      const date = new Date(dateStr);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      // Create location string
      let locationStr = '';
      if (photo.location?.city) {
        locationStr = photo.location.city;
        if (photo.location.country && photo.location.country !== photo.location.city) {
          locationStr += `, ${photo.location.country}`;
        }
      } else if (photo.location?.country) {
        locationStr = photo.location.country;
      } else if (photo.location?.address) {
        locationStr = photo.location.address;
      }
      
      // Create group key: date + location
      const groupKey = locationStr ? `${dateKey}|${locationStr}` : dateKey;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(photo);
    });
    
      // Convert to array and sort by date (newest first)
      const result = Object.entries(groups)
        .map(([key, photos]) => {
          const [dateKey, location] = key.split('|');
          return {
            date: dateKey,
            location: location || '',
            photos: photos.sort((a, b) => {
              const dateA = a.metadata?.takenAt || a.uploadedAt;
              const dateB = b.metadata?.takenAt || b.uploadedAt;
              return new Date(dateB).getTime() - new Date(dateA).getTime(); // Newest first
            })
          };
        })
        .sort((a, b) => {
          // Sort groups by date (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      
      console.log('Grouped photos result:', result.length, 'groups');
      result.forEach((group, idx) => {
        console.log(`Group ${idx}: ${group.date} - ${group.location} - ${group.photos.length} photos`);
      });
      
      return result;
  }, [photos]);

  const formatDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisYear(date)) {
      return format(date, 'EEE, MMM d');
    } else {
      return format(date, 'EEE, MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const handleEdit = (photo: Photo) => {
    setCurrentPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setEditDialogOpen(false);
    setCurrentPhoto(null);
    // Update viewing photo if it's the same one
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setViewingPhoto(photo);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const data = await api.deletePhoto(photoId);
      if (data.success) {
        setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      } else {
        alert('Failed to delete photo.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentPhoto(null);
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {photos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No photos found to build a timeline.
          </Typography>
        </Box>
      ) : (
        <Box>
          {groupedPhotos.map((group, groupIndex) => (
            <Box key={`${group.date}-${group.location}-${groupIndex}`} sx={{ mb: 4 }}>
              {/* Date and Location Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  position: 'sticky',
                  top: 64,
                  zIndex: 1,
                  backgroundColor: 'background.default',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    fontSize: '1rem',
                    color: 'text.primary'
                  }}
                >
                  {formatDateHeader(group.date)}
                </Typography>
                {group.location && (
                  <>
                    <Typography sx={{ color: 'text.secondary', mx: 0.5 }}>•</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      >
                        {group.location}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              {/* Horizontal Scrolling Photo Row */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 1,
                  alignItems: 'flex-start',
                  '&::-webkit-scrollbar': {
                    height: 8
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 4
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 4,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }
                  }
                }}
              >
                {group.photos.length > 0 ? (
                  group.photos.map((photo) => {
                    const width = photo.metadata?.width || 1;
                    const height = photo.metadata?.height || 1;
                    const aspectRatio = width / height;
                    
                    // Use same responsive heights as gallery
                    const photoHeight = getPhotoHeight();
                    const photoWidth = photoHeight * aspectRatio;
                    
                    return (
                      <Box
                        key={photo.id}
                        sx={{
                          flexShrink: 0,
                          width: `${photoWidth}px`,
                          height: `${photoHeight}px`,
                          overflow: 'hidden'
                        }}
                      >
                          <PhotoCard
                            photo={photo}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onClick={handlePhotoClick}
                          />
                      </Box>
                    );
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No photos in this group
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <EditPhotoDialog
        open={editDialogOpen}
        photo={currentPhoto}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEdit}
      />

      <PhotoViewer
        open={viewerOpen}
        photo={viewingPhoto}
        photos={photos}
        onClose={() => {
          setViewerOpen(false);
          setViewingPhoto(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </Box>
  );
};