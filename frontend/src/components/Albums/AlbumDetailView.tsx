import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress, Alert, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, InputAdornment, List, ListItem, ListItemText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PhotoCard } from '../Photos/PhotoCard';
import { EditPhotoDialog } from '../Photos/EditPhotoDialog';
import { PhotoViewer } from '../Photos/PhotoViewer';
import { Photo } from '../../types/photo.types';
import { Trip } from '../../types/trip.types';
import * as api from '../../services/api.service';
import { format } from 'date-fns';

// Album Photo Item Component (simplified, no Card wrapper)
interface AlbumPhotoItemProps {
  photo: Photo;
  width: number;
  height: number;
  onEdit?: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
}

const AlbumPhotoItem: React.FC<AlbumPhotoItemProps> = ({ photo, width, height, onEdit, onDelete }) => {
  const [showOverlay, setShowOverlay] = React.useState(false);

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 1,
        display: 'block',
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
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <Box
        component="img"
        src={photo.thumbnailUrl || photo.url}
        alt={photo.displayName || photo.fileName}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: photo.metadata?.rotation 
            ? `rotate(${photo.metadata.rotation}deg)` 
            : 'none'
        }}
      />
      
      {/* Overlay with label and metadata */}
      <Box
        className="photo-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
          padding: 1.5,
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'white', 
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5
          }}
        >
          {photo.displayName || photo.fileName}
        </Typography>

        {photo.metadata?.takenAt && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              display: 'block',
              mb: 0.5
            }}
          >
            {format(new Date(photo.metadata.takenAt), 'MMM d, yyyy')}
          </Typography>
        )}

        {photo.location && (photo.location.city || photo.location.address) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', mr: 0.5 }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {photo.location.city || photo.location.address}
              {photo.location.country && `, ${photo.location.country}`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
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
  );
};

// Justified Gallery Component
interface JustifiedGalleryProps {
  photos: Photo[];
  onEdit?: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
}

const JustifiedGallery: React.FC<JustifiedGalleryProps> = ({ photos, onEdit, onDelete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() => {
    // Initialize with window width minus padding
    if (typeof window !== 'undefined') {
      return window.innerWidth - 64;
    }
    return 1200;
  });
  const rowHeight = 250; // Fixed height for each row
  const gap = 8; // Gap between photos in pixels

  // Update container width on resize and after mount
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setContainerWidth(prev => {
            if (prev !== width) {
              console.log('Container width updated:', width);
              return width;
            }
            return prev;
          });
        }
      }
    };

    // Initial measurement after render
    const timeoutId = setTimeout(updateWidth, 100);
    
    // Use ResizeObserver for more accurate measurements
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateWidth);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Group photos into rows
  const rows = useMemo(() => {
    if (photos.length === 0 || containerWidth <= 0) return [];

    const result: Photo[][] = [];
    let currentRow: Photo[] = [];
    let currentRowWidth = 0;

    photos.forEach((photo) => {
      const width = photo.metadata?.width || 1;
      const height = photo.metadata?.height || 1;
      const aspectRatio = width / height;
      
      // Calculate photo width at row height
      const photoWidth = rowHeight * aspectRatio;
      const photoWidthWithGap = photoWidth + gap;

      // If adding this photo would exceed container width, start a new row
      if (currentRow.length > 0 && currentRowWidth + photoWidthWithGap > containerWidth) {
        result.push(currentRow);
        currentRow = [photo];
        currentRowWidth = photoWidthWithGap;
      } else {
        currentRow.push(photo);
        currentRowWidth += photoWidthWithGap;
      }
    });

    // Add the last row
    if (currentRow.length > 0) {
      result.push(currentRow);
    }

    return result;
  }, [photos, rowHeight, gap, containerWidth]);

  return (
    <Box 
      ref={containerRef}
      sx={{ width: '100%' }}
    >
      {rows.map((row, rowIndex) => {
        // Calculate total width of photos in this row
        const totalPhotoWidth = row.reduce((sum, photo) => {
          const width = photo.metadata?.width || 1;
          const height = photo.metadata?.height || 1;
          const aspectRatio = width / height;
          return sum + (rowHeight * aspectRatio);
        }, 0);

        // Calculate scale factor to fill container width
        const availableWidth = containerWidth - (row.length - 1) * gap;
        const scale = totalPhotoWidth > 0 ? availableWidth / totalPhotoWidth : 1;
        const scaledRowHeight = rowHeight * scale;

        console.log(`Row ${rowIndex}: containerWidth=${containerWidth}, totalPhotoWidth=${totalPhotoWidth}, scale=${scale}, scaledRowHeight=${scaledRowHeight}`);

        return (
          <Box
            key={rowIndex}
            sx={{
              display: 'flex',
              gap: `${gap}px`,
              mb: `${gap}px`,
              width: '100%',
              overflow: 'hidden',
              alignItems: 'flex-start',
              height: `${scaledRowHeight}px`,
              minHeight: `${scaledRowHeight}px`,
              maxHeight: `${scaledRowHeight}px`
            }}
          >
            {row.map((photo) => {
              const width = photo.metadata?.width || 1;
              const height = photo.metadata?.height || 1;
              const aspectRatio = width / height;
              const photoWidth = scaledRowHeight * aspectRatio;

              console.log(`  Photo ${photo.id}: width=${photoWidth}px, height=${scaledRowHeight}px, aspectRatio=${aspectRatio}`);

              return (
                <AlbumPhotoItem
                  key={photo.id}
                  photo={photo}
                  width={photoWidth}
                  height={scaledRowHeight}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export const AlbumDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addPhotosDialogOpen, setAddPhotosDialogOpen] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumLocation, setAlbumLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [],
      'image/heic': [],
    },
    noClick: false,
    noKeyboard: false
  });

  useEffect(() => {
    if (id) {
      fetchAlbumDetails();
      fetchAllPhotos();
    }
  }, [id]);

  const fetchAlbumDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTrip(id);
      if (data.success && data.trip) {
        setAlbum(data.trip);
        setAlbumName(data.trip.name);
        setAlbumLocation(data.trip.locationName || '');
        // Fetch photos for this album
        if (data.trip.photoIds.length > 0) {
          const photosData = await api.getPhotos();
          if (photosData.success) {
            const albumPhotos = photosData.photos.filter(p => data.trip!.photoIds.includes(p.id));
            setPhotos(albumPhotos);
          }
        } else {
          setPhotos([]);
        }
      } else {
        setError('Album not found');
      }
    } catch (err: any) {
      console.error('Album fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch album.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPhotos = async () => {
    try {
      const data = await api.getPhotos();
      if (data.success) {
        setAllPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Error fetching all photos:', err);
    }
  };

  const handleAddPhotos = async () => {
    if (!id || selectedPhotoIds.size === 0) return;

    try {
      const photoIdsArray = Array.from(selectedPhotoIds);
      const data = await api.addPhotosToTrip(id, photoIdsArray);
      
      if (data.success) {
        // If album has no cover photo, set the first added photo as cover
        if (!album?.coverPhotoUrl && photoIdsArray.length > 0) {
          const firstPhoto = allPhotos.find(p => p.id === photoIdsArray[0]);
          if (firstPhoto) {
            await api.updateTrip(id, { 
              coverPhotoUrl: firstPhoto.thumbnailUrl || firstPhoto.url 
            });
          }
        }
        // Refresh album
        await fetchAlbumDetails();
        setAddPhotosDialogOpen(false);
        setSelectedPhotoIds(new Set());
      } else {
        alert(data.error || 'Failed to add photos to album.');
      }
    } catch (err: any) {
      console.error('Error adding photos:', err);
      alert(err.response?.data?.error || 'Failed to add photos to album.');
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!id || !album) return;

    if (!window.confirm('Remove this photo from the album?')) {
      return;
    }

    try {
      // Remove tripId from photo
      await api.updatePhoto(photoId, { tripId: undefined });
      // Update local state immediately
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      setAlbum({
        ...album,
        photoIds: album.photoIds.filter(pid => pid !== photoId)
      });
    } catch (err: any) {
      console.error('Error removing photo:', err);
      alert(err.response?.data?.error || 'Failed to remove photo from album.');
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    setPhotos(prevPhotos =>
      prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
    );
    setEditDialogOpen(false);
    setEditingPhoto(null);
    // Update viewing photo if it's the same one
    if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
      setViewingPhoto(updatedPhoto);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setViewingPhoto(photo);
    setViewerOpen(true);
  };

  const handleFavoriteToggle = async (photo: Photo) => {
    try {
      const response = await api.updatePhoto(photo.id, {
        isFavorite: !photo.isFavorite
      });
      if (response.success && response.photo) {
        const updatedPhoto = response.photo;
        setPhotos(prevPhotos =>
          prevPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
        );
        if (viewingPhoto && viewingPhoto.id === updatedPhoto.id) {
          setViewingPhoto(updatedPhoto);
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  const handleDelete = async (photoId: string) => {
    // In album view, delete means remove from album, not delete the photo
    handleRemovePhoto(photoId);
  };

  const handleSetCover = async (photo: Photo) => {
    if (!id || !album) return;

    try {
      const coverUrl = photo.thumbnailUrl || photo.url;
      const data = await api.updateTrip(id, { coverPhotoUrl: coverUrl });
      
      if (data.success && data.trip) {
        setAlbum(data.trip);
      } else {
        alert(data.error || 'Failed to set cover photo.');
      }
    } catch (err: any) {
      console.error('Error setting cover photo:', err);
      alert(err.response?.data?.error || 'Failed to set cover photo.');
    }
  };

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        return new Promise((resolve) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              console.log(`Geocoded "${address}" -> (${location.lat()}, ${location.lng()})`);
              resolve({
                lat: location.lat(),
                lng: location.lng()
              });
            } else {
              console.warn('Geocoding failed for address:', address, 'Status:', status);
              resolve(null);
            }
          });
        });
      } catch (err) {
        console.error('Geocoding error:', err);
        return null;
      }
    }
    
    // Google Maps not loaded - try to load it
    return new Promise((resolve) => {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          setTimeout(() => geocodeAddress(address).then(resolve), 100);
        });
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.google?.maps?.Geocoder) {
            geocodeAddress(address).then(resolve);
          } else {
            resolve(null);
          }
        }, 500);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  };

  const handleSaveAlbum = async () => {
    if (!id || !album) return;
    
    setSaving(true);
    try {
      const updates: Partial<Trip> = {
        name: albumName.trim() || 'Untitled Album',
        locationName: albumLocation.trim() || undefined
      };
      
      const data = await api.updateTrip(id, updates);
      if (data.success && data.trip) {
        setAlbum(data.trip);
        
        // If location was added, geocode it and apply to all photos in album
        if (albumLocation.trim()) {
          console.log('Geocoding album location:', albumLocation);
          const coords = await geocodeAddress(albumLocation.trim());
          
          if (coords) {
            console.log('Geocoded album location to:', coords);
            // Parse location string to extract city/country if possible
            const locationParts = albumLocation.trim().split(',').map(s => s.trim());
            const city = locationParts.length > 1 ? locationParts[0] : undefined;
            const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : locationParts[0];
            
            // Update all photos in the album that don't have location data
            const photosToUpdate = photos.filter(p => 
              !p.metadata?.gps && (!p.location || (!p.location.city && !p.location.country))
            );
            
            console.log(`Updating ${photosToUpdate.length} photos with album location`);
            
            if (photosToUpdate.length > 0) {
              let updatedCount = 0;
              for (const photo of photosToUpdate) {
                try {
                  await api.updatePhoto(photo.id, {
                    location: {
                      city: city,
                      country: country
                    },
                    metadata: {
                      ...photo.metadata,
                      gps: {
                        latitude: coords.lat,
                        longitude: coords.lng
                      }
                    }
                  });
                  updatedCount++;
                  console.log(`Updated photo ${photo.id} with location`);
                } catch (err) {
                  console.error(`Failed to update photo ${photo.id}:`, err);
                }
              }
              
              // Notify user
              if (updatedCount > 0) {
                alert(`Location applied to ${updatedCount} photo${updatedCount !== 1 ? 's' : ''} in this album. They will now appear on the map.`);
              }
              
              // Trigger map refresh
              try {
                localStorage.setItem('photo-updated', Date.now().toString());
                setTimeout(() => localStorage.removeItem('photo-updated'), 100);
              } catch (e) {
                // Storage might not be available
              }
            }
            
            // Refresh photos to show updated locations
            await fetchAlbumDetails();
          } else {
            console.warn('Failed to geocode album location');
            alert('Could not find the location. Please check the spelling and try again.');
          }
        }
        
        setIsEditMode(false);
      } else {
        alert(data.error || 'Failed to update album');
      }
    } catch (err: any) {
      console.error('Error updating album:', err);
      alert(err.response?.data?.error || 'Failed to update album');
    } finally {
      setSaving(false);
    }
  };

  const formatDateRange = (): string => {
    if (!album || photos.length === 0) {
      // Use album dates if no photos
      if (album?.startDate && album?.endDate) {
        const start = new Date(album.startDate);
        const end = new Date(album.endDate);
        if (start.toDateString() === end.toDateString()) {
          return format(start, 'MMM d, yyyy');
        }
        return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
      } else if (album?.startDate) {
        return format(new Date(album.startDate), 'MMM d, yyyy');
      }
      return '';
    }
    
    // Calculate date range from photos
    const dates = photos
      .map(p => p.metadata?.takenAt)
      .filter((date): date is string => !!date)
      .map(date => new Date(date).getTime())
      .sort((a, b) => a - b);
    
    if (dates.length === 0) return '';
    
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, 'MMM d, yyyy');
    }
    return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !album) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/albums')} sx={{ mb: 2 }}>
          Back to Albums
        </Button>
        <Alert severity="error">{error || 'Album not found'}</Alert>
      </Box>
    );
  }

  const availablePhotos = allPhotos.filter(p => !album.photoIds.includes(p.id));

  return (
    <Box>
      {/* Header with Edit Mode */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/albums')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditMode ? (
              <>
                <IconButton
                  size="small"
                  onClick={handleSaveAlbum}
                  disabled={saving}
                  title="Save"
                >
                  <CheckIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsEditMode(false);
                    setAlbumName(album?.name || '');
                    setAlbumLocation(album?.locationName || '');
                  }}
                  disabled={saving}
                  title="Cancel"
                >
                  <ArrowBackIcon />
                </IconButton>
              </>
            ) : (
              <IconButton
                size="small"
                onClick={() => setIsEditMode(true)}
                title="Edit album"
              >
                <EditIcon />
              </IconButton>
            )}
            {isEditMode && (
              <Typography variant="body2" color="text.secondary">
                Edit album
              </Typography>
            )}
          </Box>
        </Box>

        {/* Editable Title */}
        {isEditMode ? (
          <TextField
            fullWidth
            variant="standard"
            placeholder="Add a title"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            sx={{
              mb: 1,
              '& .MuiInput-underline:before': {
                borderBottom: '1px solid',
                borderColor: 'divider'
              },
              '& .MuiInput-underline:hover:before': {
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              },
              '& .MuiInput-underline:after': {
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              }
            }}
            InputProps={{
              style: { fontSize: '1.5rem', fontWeight: 400 }
            }}
          />
        ) : (
          <Typography
            variant="h4"
            sx={{
              mb: 1,
              fontWeight: 400,
              color: albumName ? 'text.primary' : 'text.secondary',
              fontStyle: !albumName ? 'italic' : 'normal'
            }}
          >
            {albumName || 'Add a title'}
          </Typography>
        )}

        {/* Date Range */}
        {formatDateRange() && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {formatDateRange()}
          </Typography>
        )}

        {/* Location Field */}
        {isEditMode ? (
          <TextField
            fullWidth
            variant="standard"
            placeholder="Add location"
            value={albumLocation}
            onChange={(e) => setAlbumLocation(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            onKeyDown={(e) => {
              // Save on Enter key
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveAlbum();
              }
              // Cancel on Escape key
              if (e.key === 'Escape') {
                setIsEditMode(false);
                setAlbumLocation(album?.locationName || '');
              }
            }}
            sx={{
              mb: 2,
              '& .MuiInput-underline:before': {
                borderBottom: '1px solid',
                borderColor: 'divider'
              },
              '& .MuiInput-underline:hover:before': {
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              },
              '& .MuiInput-underline:after': {
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              }
            }}
            autoFocus
          />
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.7
              }
            }}
            onClick={() => setIsEditMode(true)}
          >
            <LocationOnIcon fontSize="small" sx={{ color: albumLocation ? 'text.secondary' : 'text.disabled' }} />
            <Typography 
              variant="body2" 
              color={albumLocation ? 'text.secondary' : 'text.disabled'}
              sx={{ fontStyle: albumLocation ? 'normal' : 'italic' }}
            >
              {albumLocation || 'Add location'}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={() => setUploadDialogOpen(true)}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
            title="Upload photos"
          >
            <UploadFileIcon />
          </IconButton>
          <IconButton
            onClick={() => setAddPhotosDialogOpen(true)}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
            title="Add existing photos"
          >
            <AddPhotoIcon />
          </IconButton>
          {!isEditMode && (
            <>
              <IconButton
                onClick={() => {
                  setIsEditMode(true);
                  // Focus on title field after a brief delay
                  setTimeout(() => {
                    const titleInput = document.querySelector('input[placeholder="Add a title"]') as HTMLInputElement;
                    if (titleInput) {
                      titleInput.focus();
                    }
                  }, 100);
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
                title="Edit album"
              >
                <TextFieldsIcon />
              </IconButton>
              <IconButton
                onClick={() => {
                  setIsEditMode(true);
                  // Focus on location field after a brief delay to ensure it's rendered
                  setTimeout(() => {
                    const locationInput = document.querySelector('input[placeholder="Add location"]') as HTMLInputElement;
                    if (locationInput) {
                      locationInput.focus();
                    }
                  }, 150);
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
                title="Add location"
              >
                <LocationOnIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {photos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            This album is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add photos to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddPhotoIcon />}
            onClick={() => setAddPhotosDialogOpen(true)}
          >
            Add Photos
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)'
            },
            gap: { xs: 0.5, sm: 0.75, md: 1 } // Smaller gaps
          }}
        >
          {photos.map((photo) => (
            <Box
              key={photo.id}
              sx={{
                width: '100%',
                height: { xs: '200px', sm: '220px', md: '240px', lg: '260px', xl: '280px' }, // Fixed height for all photos
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <PhotoCard 
                photo={photo} 
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSetCover={handleSetCover}
                isCover={album?.coverPhotoUrl === (photo.thumbnailUrl || photo.url)}
                onClick={handlePhotoClick}
                onFavoriteToggle={handleFavoriteToggle}
                onToggleSelectionMode={() => {
                  // Optional: can add selection mode to albums if needed
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Add Photos Dialog */}
      <Dialog open={addPhotosDialogOpen} onClose={() => setAddPhotosDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Photos to Album</DialogTitle>
        <DialogContent>
          {availablePhotos.length === 0 ? (
            <Typography color="text.secondary">All photos are already in this album.</Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2,
                maxHeight: '60vh',
                overflow: 'auto',
                p: 1
              }}
            >
              {availablePhotos.map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.id);
                return (
                  <Box
                    key={photo.id}
                    onClick={() => {
                      setSelectedPhotoIds(prev => {
                        const newSet = new Set(prev);
                        if (isSelected) {
                          newSet.delete(photo.id);
                        } else {
                          newSet.add(photo.id);
                        }
                        return newSet;
                      });
                    }}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      opacity: isSelected ? 0.7 : 1,
                      border: isSelected ? '3px solid' : '3px solid transparent',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.fileName}
                      sx={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    {isSelected && (
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
                          color: 'white'
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPhotosDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPhotos}
            variant="contained"
            disabled={selectedPhotoIds.size === 0}
          >
            Add {selectedPhotoIds.size > 0 ? `${selectedPhotoIds.size} ` : ''}Photo{selectedPhotoIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      <EditPhotoDialog
        open={editDialogOpen}
        photo={editingPhoto}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingPhoto(null);
        }}
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

      {/* Upload Photos Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photos to Album</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${isDragActive ? 'primary.main' : 'grey.500'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              mb: 2
            }}
          >
            <input {...getInputProps()} />
            <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              {isDragActive
                ? 'Drop the files here...'
                : "Drag 'n' drop some files here, or click to select files"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: JPEG, PNG, WebP, GIF, HEIC
            </Typography>
          </Box>

          {uploadFiles.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>Files to upload:</Typography>
              <List dense>
                {uploadFiles.map((file, i) => (
                  <ListItem 
                    key={i}
                    secondaryAction={
                      <IconButton
                        size="small"
                        onClick={() => {
                          setUploadFiles(prev => prev.filter((_, index) => index !== i));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setUploadFiles([]);
            setUploadError(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (uploadFiles.length === 0 || !id) return;
              
              setUploading(true);
              setUploadError(null);
              
              try {
                const data = await api.uploadPhotos(uploadFiles, id);
                
                if (data.success && data.uploaded && data.uploaded.length > 0) {
                  // If album has no cover photo, set the first uploaded photo as cover
                  if (!album?.coverPhotoUrl && data.uploaded.length > 0) {
                    const firstPhoto = data.uploaded[0];
                    if (firstPhoto) {
                      await api.updateTrip(id, { 
                        coverPhotoUrl: firstPhoto.thumbnailUrl || firstPhoto.url 
                      });
                    }
                  }
                  // Refresh album and photos
                  await fetchAlbumDetails();
                  await fetchAllPhotos();
                  setUploadDialogOpen(false);
                  setUploadFiles([]);
                } else {
                  const errorMessages = data.errors?.map((e: any) => 
                    `${e.filename || 'Unknown file'}: ${e.error || 'Upload failed'}`
                  ).join(', ') || data.message || 'Upload failed';
                  setUploadError(errorMessages);
                }
              } catch (err: any) {
                console.error('Upload error:', err);
                setUploadError(err.response?.data?.error || err.message || 'Failed to upload photos');
              } finally {
                setUploading(false);
              }
            }}
            variant="contained"
            disabled={uploadFiles.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
          >
            {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length === 1 ? '' : 's'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

