import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, Paper, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as api from '../../services/api.service';

export const PhotoUpload: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ uploaded: any[], errors: any[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
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

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      console.log('Uploading files:', files.map(f => f.name));
      const data = await api.uploadPhotos(files);
      console.log('Upload response:', data);
      
      if (data.success && data.uploaded && data.uploaded.length > 0) {
        // At least some photos uploaded successfully
        setUploadResult({ uploaded: data.uploaded || [], errors: data.errors || [] });
        setFiles([]); // Clear queue on success
        
        // Navigate to gallery after successful upload
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500); // Wait 1.5 seconds to show success message
      } else {
        // All uploads failed or no photos uploaded
        const errorMessages = data.errors?.map((e: any) => 
          `${e.filename || 'Unknown file'}: ${e.error || 'Upload failed'}`
        ).join(', ') || data.message || 'Upload failed';
        setError(errorMessages);
        setUploadResult(null);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Extract error message from response
      let errorMessage = 'An error occurred during upload.';
      if (err.response?.data) {
        if (err.response.data.errors && err.response.data.errors.length > 0) {
          // Show errors from the errors array
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
      
      setError(errorMessage);
      setUploadResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Upload Photos
      </Typography>
      
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

      {files.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Files to upload:</Typography>
          <List dense>
            {files.map((file, i) => (
              <ListItem 
                key={i}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => {
                      setFiles(prev => prev.filter((_, index) => index !== i));
                    }}
                  >
                    Remove
                  </Button>
                }
              >
                <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          onClick={open}
          startIcon={<UploadFileIcon />}
          sx={{ flex: 1 }}
        >
          Browse Files
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <UploadFileIcon />}
          sx={{ flex: 1 }}
        >
          {loading 
            ? 'Uploading...' 
            : `Upload ${files.length} File${files.length === 1 ? '' : 's'}`}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
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
    </Paper>
  );
};