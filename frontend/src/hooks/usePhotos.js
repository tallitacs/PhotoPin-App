import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const usePhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadPhoto = useCallback(async (file, metadata = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.uploadPhoto(file, metadata);
      if (result.success) {
        setPhotos(prev => [result.photo, ...prev]);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPhotos = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getPhotos(filters);
      if (result.success) {
        setPhotos(result.photos || []);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePhoto = useCallback(async (photoId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.deletePhoto(photoId);
      if (result.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    photos,
    loading,
    error,
    uploadPhoto,
    getPhotos,
    deletePhoto,
    clearError: () => setError(null)
  };
};