import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, Paper, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as api from '../../services/api.service';

export const PhotoUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ uploaded: any[], errors: any[] } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [],
      'image/heic': [],
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const data = await api.uploadPhotos(files);
      if (data.success) {
        setUploadResult({ uploaded: data.uploaded, errors: data.errors });
        setFiles([]); // Clear queue on success
      } else {
        setError(data.error || 'Upload failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred.');
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
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography>
          {isDragActive
            ? 'Drop the files here...'
            : "Drag 'n' drop some files here, or click to select files"}
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Files to upload:</Typography>
          <List dense>
            {files.map((file, i) => (
              <ListItem key={i}>
                <ListItemText primary={file.name} secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={files.length === 0 || loading}
        startIcon={loading ? <CircularProgress size={20} /> : <UploadFileIcon />}
      >
        {loading ? 'Uploading...' : `Upload ${files.length} File(s)`}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {uploadResult && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Successfully uploaded {uploadResult.uploaded.length} photos.
          {uploadResult.errors.length > 0 && ` Failed to upload ${uploadResult.errors.length}.`}
        </Alert>
      )}
    </Paper>
  );
};