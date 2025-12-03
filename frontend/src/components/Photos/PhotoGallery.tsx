import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Typography, Box, CircularProgress, Alert, AppBar, Toolbar, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { PhotoCard } from './PhotoCard';
import { EditPhotoDialog } from './EditPhotoDialog';
import { PhotoViewer } from './PhotoViewer';
import { BulkActionsDialog } from './BulkActionsDialog';
import { Photo } from '../../types/photo.types';
import * as api from '../../services/api.service';

export const PhotoGallery: React.FC = () => {
  const location = useLocation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ uploaded: any[], errors: any[] } | null>(null);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching photos from:', process.env.REACT_APP_API_URL);
        const data = await api.getPhotos(); // Using our API service
        console.log('Photos response:', data);
        if (data.success) {
          setPhotos(data.photos || []);
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
  }, [location.pathname]); // Refetch when navigating to this page

  const handleDelete = async (photoId: string) => {
    try {
      const data = await api.deletePhoto(photoId);
      if (data.success) {
        // Remove photo from state
        setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      } else {
        alert('Failed to delete photo.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedPhoto: Photo) => {
    // Update photo in the list
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

  // Toggle selection state for a single photo
  const handleToggleSelection = (photoId: string, selected: boolean) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(photoId);
      } else {
        newSet.delete(photoId);
      }
      return newSet;
    });
  };

  // Select or deselect all photos (toggles based on current state)
  const handleSelectAll = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map(p => p.id)));
    }
  };

  // Exit selection mode and clear all selections
  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPhotoIds(new Set());
  };

  // Handle bulk tag update: refreshes photo list and exits selection mode on success
  const handleBulkUpdateTags = async (tagsToAdd: string[], tagsToRemove: string[]) => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      const updates: { tagsToAdd?: string[], tagsToRemove?: string[] } = {};
      if (tagsToAdd.length > 0) updates.tagsToAdd = tagsToAdd;
      if (tagsToRemove.length > 0) updates.tagsToRemove = tagsToRemove;
      
      await api.bulkUpdatePhotos(photoIds, updates);
      
      const data = await api.getPhotos();
      if (data.success) {
        setPhotos(data.photos || []);
      }
      
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update tags');
    }
  };

  // Handle bulk location update: refreshes photo list and exits selection mode on success
  const handleBulkUpdateLocation = async (location: { city?: string, country?: string, address?: string } | null) => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      await api.bulkUpdatePhotos(photoIds, { location });
      
      const data = await api.getPhotos();
      if (data.success) {
        setPhotos(data.photos || []);
      }
      
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to update location');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const photoIds = Array.from(selectedPhotoIds);
      await api.bulkDeletePhotos(photoIds);
      
      // Remove deleted photos from state
      setPhotos(prevPhotos => prevPhotos.filter(p => !selectedPhotoIds.has(p.id)));
      
      // Exit selection mode
      handleExitSelectionMode();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete photos');
    }
  };

  // Get all unique tags from photos for autocomplete
  const allTags = Array.from(new Set(photos.flatMap(p => p.tags || [])));
  
  // Get tags from selected photos
  const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
  const selectedPhotosTags = Array.from(new Set(selectedPhotos.flatMap(p => p.tags || [])));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Selection mode toolbar */}
      {selectionMode && (
        <AppBar
          position="sticky"
          sx={{
            top: 0,
            zIndex: 1100,
            backgroundColor: 'primary.main'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleExitSelectionMode}
              sx={{ mr: 2 }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedPhotoIds.size} selected
            </Typography>
            <Button
              color="inherit"
              onClick={handleSelectAll}
              startIcon={selectedPhotoIds.size === photos.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              sx={{ mr: 1 }}
            >
              {selectedPhotoIds.size === photos.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setBulkActionsOpen(true)}
              disabled={selectedPhotoIds.size === 0}
            >
              Actions
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Action buttons - Upload and Select */}
      {!selectionMode && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.1)'
              }
            }}
            title="Add photos"
          >
            <AddIcon fontSize="small" />
          </IconButton>
          {photos.length > 0 && (
            <IconButton
              onClick={() => setSelectionMode(true)}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.1)'
                }
              }}
              title="Select photos"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {photos.length === 0 ? (
        <Typography>No photos found. Try uploading some!</Typography>
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
                overflow: 'hidden'
              }}
            >
              <PhotoCard 
                photo={photo} 
                onDelete={handleDelete}
                onEdit={handleEdit}
                onClick={selectionMode ? undefined : handlePhotoClick}
                isSelected={selectedPhotoIds.has(photo.id)}
                onSelect={handleToggleSelection}
                selectionMode={selectionMode}
                onFavoriteToggle={handleFavoriteToggle}
                onToggleSelectionMode={() => {
                  if (!selectionMode) {
                    setSelectionMode(true);
                    handleToggleSelection(photo.id, true);
                  }
                }}
              />
            </Box>
          ))}
        </Box>
      )}

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

      <BulkActionsDialog
        open={bulkActionsOpen}
        onClose={() => setBulkActionsOpen(false)}
        selectedCount={selectedPhotoIds.size}
        onBulkUpdateTags={handleBulkUpdateTags}
        onBulkUpdateLocation={handleBulkUpdateLocation}
        onBulkDelete={handleBulkDelete}
        existingTags={allTags}
        selectedPhotosTags={selectedPhotosTags}
      />

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploadLoading) {
            setUploadDialogOpen(false);
            setUploadFiles([]);
            setUploadError(null);
            setUploadResult(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Photos</DialogTitle>
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
              <Typography variant="h6">Files to upload:</Typography>
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
                        disabled={uploadLoading}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
          {uploadResult && uploadResult.uploaded.length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully uploaded {uploadResult.uploaded.length} photo{uploadResult.uploaded.length === 1 ? '' : 's'}.
              {uploadResult.errors.length > 0 && (
                <Box component="span" sx={{ display: 'block', mt: 1 }}>
                  Failed to upload {uploadResult.errors.length} photo{uploadResult.errors.length === 1 ? '' : 's'}:
                  <List dense sx={{ mt: 0.5 }}>
                    {uploadResult.errors.map((err: any, idx: number) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={err.filename || 'Unknown file'} 
                          secondary={err.error || 'Upload failed'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={open}
            disabled={uploadLoading}
            startIcon={<UploadFileIcon />}
            variant="contained"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'action.disabledBackground',
                color: 'action.disabled',
              }
            }}
          >
            Browse Files
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setUploadFiles([]);
              setUploadError(null);
              setUploadResult(null);
            }}
            disabled={uploadLoading}
            variant="contained"
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'action.disabledBackground',
                color: 'action.disabled',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (uploadFiles.length === 0) return;
              
              setUploadLoading(true);
              setUploadError(null);
              setUploadResult(null);

              try {
                const data = await api.uploadPhotos(uploadFiles);
                
                if (data.success && data.uploaded && data.uploaded.length > 0) {
                  setUploadResult({ uploaded: data.uploaded || [], errors: data.errors || [] });
                  setUploadFiles([]);
                  
                  // Refresh photos list
                  const refreshData = await api.getPhotos();
                  if (refreshData.success) {
                    setPhotos(refreshData.photos || []);
                  }
                  
                  // Close dialog after a short delay to show success message
                  setTimeout(() => {
                    setUploadDialogOpen(false);
                    setUploadResult(null);
                  }, 1500);
                } else {
                  const errorMessages = data.errors?.map((e: any) => 
                    `${e.filename || 'Unknown file'}: ${e.error || 'Upload failed'}`
                  ).join(', ') || data.message || 'Upload failed';
                  setUploadError(errorMessages);
                }
              } catch (err: any) {
                let errorMessage = 'An error occurred during upload.';
                if (err.response?.data) {
                  if (err.response.data.errors && err.response.data.errors.length > 0) {
                    const errorDetails = err.response.data.errors.map((e: any) => 
                      `${e.filename || 'Unknown file'}: ${e.error || 'Upload failed'}`
                    ).join('\n');
                    errorMessage = errorDetails;
                  } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                  } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                  }
                } else if (err.message) {
                  errorMessage = err.message;
                }
                setUploadError(errorMessage);
              } finally {
                setUploadLoading(false);
              }
            }}
            disabled={uploadFiles.length === 0 || uploadLoading}
            startIcon={uploadLoading ? <CircularProgress size={20} /> : <UploadFileIcon />}
          >
            {uploadLoading 
              ? 'Uploading...' 
              : `Upload ${uploadFiles.length} File${uploadFiles.length === 1 ? '' : 's'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};