import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import LabelIcon from '@mui/icons-material/Label';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Props for BulkActionsDialog component
interface BulkActionsDialogProps {
  open: boolean; // Whether the dialog is open
  onClose: () => void; // Callback to close the dialog
  selectedCount: number; // Number of photos currently selected
  onBulkUpdateTags: (tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>; // Handler for bulk tag updates
  onBulkUpdateLocation?: (location: { city?: string, country?: string, address?: string } | null) => Promise<void>; // Optional handler for bulk location updates
  onBulkDelete: () => Promise<void>; // Handler for bulk photo deletion
  existingTags?: string[]; // All existing tags from all photos (for autocomplete suggestions)
  selectedPhotosTags?: string[]; // Tags that exist on the currently selected photos (for removal)
}

// BulkActionsDialog: Dialog for bulk actions on selected photos (tags, location, delete)
// Multi-step flow: Initial view → Action form → Submission
export const BulkActionsDialog: React.FC<BulkActionsDialogProps> = ({
  open,
  onClose,
  selectedCount,
  onBulkUpdateTags,
  onBulkUpdateLocation,
  onBulkDelete,
  existingTags = [],
  selectedPhotosTags = []
}) => {
  const [action, setAction] = useState<'tags' | 'location' | 'delete' | null>(null); // Current action being performed
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]); // Tags to be added to selected photos
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]); // Tags to be removed from selected photos
  const [newTagInput, setNewTagInput] = useState(''); // Input field for new tag
  const [locationCity, setLocationCity] = useState(''); // City field for location update
  const [locationCountry, setLocationCountry] = useState(''); // Country field for location update
  const [locationAddress, setLocationAddress] = useState(''); // Address field for location update
  const [loading, setLoading] = useState(false); // Loading state during API calls
  const [error, setError] = useState<string | null>(null); // Error message display

  const uniqueTags = Array.from(new Set(existingTags)); // Unique existing tags for autocomplete
  const uniqueSelectedTags = Array.from(new Set(selectedPhotosTags)); // Unique tags from selected photos

  // Reset all form state when dialog closes
  useEffect(() => {
    if (!open) {
      setAction(null);
      setTagsToAdd([]);
      setTagsToRemove([]);
      setNewTagInput('');
      setLocationCity('');
      setLocationCountry('');
      setLocationAddress('');
      setError(null);
    }
  }, [open]);

  // Add a new tag to the tagsToAdd list (validates non-empty and unique)
  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tagsToAdd.includes(trimmedTag)) {
      setTagsToAdd([...tagsToAdd, trimmedTag]);
      setNewTagInput('');
    }
  };

  // Remove a tag from the tagsToAdd list
  const handleRemoveTag = (tagToRemove: string) => {
    setTagsToAdd(tagsToAdd.filter(tag => tag !== tagToRemove));
  };

  // Handle bulk tag update: validates at least one operation, then calls parent handler
  const handleBulkUpdateTags = async () => {
    if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
      setError('Please add or remove at least one tag');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onBulkUpdateTags(tagsToAdd, tagsToRemove);
      setAction(null);
      setTagsToAdd([]);
      setTagsToRemove([]);
      setNewTagInput('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk location update: builds location object from form fields (null if all empty)
  const handleBulkUpdateLocation = async () => {
    if (!onBulkUpdateLocation) {
      setError('Location update is not available');
      return;
    }

    // Build location object: null if all fields empty, otherwise include only non-empty fields
    const location: { city?: string, country?: string, address?: string } | null = 
      (locationCity.trim() || locationCountry.trim() || locationAddress.trim())
        ? {
            ...(locationCity.trim() && { city: locationCity.trim() }),
            ...(locationCountry.trim() && { country: locationCountry.trim() }),
            ...(locationAddress.trim() && { address: locationAddress.trim() })
          }
        : null;

    setLoading(true);
    setError(null);

    try {
      await onBulkUpdateLocation(location);
      setAction(null);
      setLocationCity('');
      setLocationCountry('');
      setLocationAddress('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk photo deletion: shows confirmation dialog before proceeding
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCount} photo(s)? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onBulkDelete();
      setAction(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete photos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Bulk Actions ({selectedCount} photo{selectedCount !== 1 ? 's' : ''} selected)
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!action && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LabelIcon />}
              onClick={() => setAction('tags')}
              fullWidth
              sx={{ 
                py: 1.5,
                color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff5f0',
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffe8d9'
                },
                '& .MuiSvgIcon-root': {
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a'
                }
              }}
            >
              Add Tags to Selected Photos
            </Button>
            {onBulkUpdateLocation && (
              <Button
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={() => setAction('location')}
                fullWidth
                sx={{ 
                  py: 1.5,
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff5f0',
                  borderColor: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffe8d9'
                  },
                  '& .MuiSvgIcon-root': {
                    color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a'
                  }
                }}
              >
                Update Location for Selected Photos
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setAction('delete')}
              fullWidth
              sx={{ 
                py: 1.5,
                color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff5f0',
                borderColor: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffe8d9'
                },
                '& .MuiSvgIcon-root': {
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a'
                }
              }}
            >
              Delete Selected Photos
            </Button>
          </Box>
        )}

        {action === 'tags' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Manage tags for {selectedCount} selected photo{selectedCount !== 1 ? 's' : ''}
            </Typography>

            {/* Existing tags on selected photos */}
            {uniqueSelectedTags.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Tags on selected photos (click to remove):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {uniqueSelectedTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => {
                        if (tagsToRemove.includes(tag)) {
                          setTagsToRemove(tagsToRemove.filter(t => t !== tag));
                        } else {
                          setTagsToRemove([...tagsToRemove, tag]);
                        }
                      }}
                      color={tagsToRemove.includes(tag) ? 'error' : 'default'}
                      variant={tagsToRemove.includes(tag) ? 'filled' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: tagsToRemove.includes(tag) ? 'error.dark' : 'action.hover'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Add new tags section */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Add new tags:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  freeSolo
                  options={uniqueTags.filter(tag => !tagsToAdd.includes(tag))}
                  value={newTagInput}
                  onInputChange={(_, newValue) => setNewTagInput(newValue)}
                  inputValue={newTagInput}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add tag"
                      placeholder="Type and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      fullWidth
                      InputLabelProps={{
                        sx: {
                          marginTop: '4px',
                        }
                      }}
                      sx={{
                        mt: 0,
                        mb: 0,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : 'transparent',
                          color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                          '&.Mui-focused': {
                            '& fieldset': {
                              borderColor: '#ff7a33',
                            },
                            backgroundColor: (theme) => theme.palette.mode === 'dark' 
                              ? '#1e1e1e' 
                              : 'rgba(255, 122, 51, 0.08)',
                          },
                          '& input': {
                            color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                          },
                          // Override browser autofill styles
                          '& input:-webkit-autofill': {
                            WebkitBoxShadow: (theme) => theme.palette.mode === 'dark'
                              ? '0 0 0 100px #1e1e1e inset !important'
                              : '0 0 0 100px #fff5f0 inset !important',
                            WebkitTextFillColor: (theme) => theme.palette.mode === 'dark'
                              ? '#ffffff !important'
                              : '#ff8c5a !important',
                            caretColor: (theme) => theme.palette.mode === 'dark'
                              ? '#ffffff !important'
                              : '#ff8c5a !important',
                            transition: 'background-color 5000s ease-in-out 0s',
                          },
                          '& input:-webkit-autofill:hover': {
                            WebkitBoxShadow: (theme) => theme.palette.mode === 'dark'
                              ? '0 0 0 100px #1e1e1e inset !important'
                              : '0 0 0 100px #fff5f0 inset !important',
                          },
                          '& input:-webkit-autofill:focus': {
                            WebkitBoxShadow: (theme) => theme.palette.mode === 'dark'
                              ? '0 0 0 100px #1e1e1e inset !important'
                              : '0 0 0 100px #fff5f0 inset !important',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                          '&.Mui-focused': {
                            color: '#ff7a33',
                          },
                        },
                      }}
                    />
                  )}
                />
                <Button
                  variant="contained"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* Tags to add */}
            {tagsToAdd.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tags to add:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tagsToAdd.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Tags to remove */}
            {tagsToRemove.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tags to remove:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tagsToRemove.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => setTagsToRemove(tagsToRemove.filter(t => t !== tag))}
                      color="error"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {action === 'location' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Update location for {selectedCount} selected photo{selectedCount !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
              Leave fields empty to clear location
            </Typography>

            <TextField
              label="City"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              fullWidth
              InputLabelProps={{
                sx: {
                  marginTop: '4px',
                }
              }}
              sx={{
                mt: 0,
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : 'transparent',
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    '& fieldset': {
                      borderColor: '#ff7a33',
                    },
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                      ? '#1e1e1e' 
                      : 'rgba(255, 122, 51, 0.08)',
                  },
                  '& input': {
                    color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 0 0 100px #1e1e1e inset !important'
                      : '0 0 0 100px #fff5f0 inset !important',
                    WebkitTextFillColor: (theme) => theme.palette.mode === 'dark'
                      ? '#ffffff !important'
                      : '#ff8c5a !important',
                    caretColor: (theme) => theme.palette.mode === 'dark'
                      ? '#ffffff !important'
                      : '#ff8c5a !important',
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    color: '#ff7a33',
                  },
                },
              }}
            />

            <TextField
              label="Country"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              fullWidth
              InputLabelProps={{
                sx: {
                  marginTop: '4px',
                }
              }}
              sx={{
                mt: 0,
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : 'transparent',
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    '& fieldset': {
                      borderColor: '#ff7a33',
                    },
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                      ? '#1e1e1e' 
                      : 'rgba(255, 122, 51, 0.08)',
                  },
                  '& input': {
                    color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 0 0 100px #1e1e1e inset !important'
                      : '0 0 0 100px #fff5f0 inset !important',
                    WebkitTextFillColor: (theme) => theme.palette.mode === 'dark'
                      ? '#ffffff !important'
                      : '#ff8c5a !important',
                    caretColor: (theme) => theme.palette.mode === 'dark'
                      ? '#ffffff !important'
                      : '#ff8c5a !important',
                    transition: 'background-color 5000s ease-in-out 0s',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    color: '#ff7a33',
                  },
                },
              }}
            />

            <TextField
              label="Address"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              fullWidth
              multiline
              rows={2}
              InputLabelProps={{
                sx: {
                  marginTop: '4px',
                }
              }}
              sx={{
                mt: 0,
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : 'transparent',
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    '& fieldset': {
                      borderColor: '#ff7a33',
                    },
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                      ? '#1e1e1e' 
                      : 'rgba(255, 122, 51, 0.08)',
                  },
                  '& textarea': {
                    color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : '#ff8c5a',
                  '&.Mui-focused': {
                    color: '#ff7a33',
                  },
                },
              }}
            />
          </Box>
        )}

        {action === 'delete' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="warning">
              You are about to delete {selectedCount} photo{selectedCount !== 1 ? 's' : ''}. This action cannot be undone.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              All selected photos and their associated files will be permanently deleted.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            if (action) {
              setAction(null);
              setError(null);
            } else {
              onClose();
            }
          }} 
          disabled={loading}
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
          {action ? 'Back' : 'Cancel'}
        </Button>
        {action === 'tags' && (
          <Button
            variant="contained"
            onClick={handleBulkUpdateTags}
            disabled={loading || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Tags'}
          </Button>
        )}
        {action === 'location' && (
          <Button
            variant="contained"
            onClick={handleBulkUpdateLocation}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Location'}
          </Button>
        )}
        {action === 'delete' && (
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete Photos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

