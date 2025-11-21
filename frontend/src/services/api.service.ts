import axios from 'axios';
import { auth } from '../config/firebase';
import { Photo, PhotoMetadata } from '../types/photo.types';
import { Trip } from '../types/trip.types';

// Create axios instance with base API URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add Firebase auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Photo API Endpoints
// ==========================================

// Upload multiple photos using FormData
export const uploadPhotos = async (files: File[]) => {
  // Build FormData with all files
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file); // Field name must match backend upload.array('photos')
  });

  const { data } = await api.post('/photos/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data; // Returns: { success: true, uploaded: [...], errors: [...] }
};

// Get user's photos with optional filters (year, tags, tripId, etc.)
export const getPhotos = async (filters: { [key: string]: any } = {}) => {
  const { data } = await api.get<{
    success: boolean,
    photos: PhotoMetadata[],
    total: number
  }>('/photos', { params: filters });
  return data;
};

// Get photos with GPS coordinates for map display
export const getMapPins = async () => {
  const { data } = await api.get<{
    success: boolean,
    photos: Photo[],
    total: number
  }>('/photos/map-pins');
  return data;
};

// Get photos grouped by date for timeline view
export const getTimeline = async () => {
  const { data } = await api.get<{
    success: boolean,
    timeline: { date: string, photos: PhotoMetadata[] }[]
  }>('/photos/timeline');
  return data;
};

// Update photo metadata (tags, tripId, etc.)
export const updatePhoto = async (photoId: string, updates: Partial<PhotoMetadata>) => {
  const { data } = await api.put(`/photos/${photoId}`, updates);
  return data;
};

// Delete a photo
export const deletePhoto = async (photoId: string) => {
  const { data } = await api.delete(`/photos/${photoId}`);
  return data;
};

// ==========================================
// Trip API Endpoints
// ==========================================

// Get all trips for current user
export const getUserTrips = async () => {
  const { data } = await api.get<{
    success: boolean,
    trips: Trip[]
  }>('/trips');
  return data;
};

export const createTrip = async (tripData: { name: string, photoIds: string[], startDate: string, endDate: string }) => {
  const { data } = await api.post('/trips', tripData);
  return data;
}

// ==========================================
// Google Photos API Endpoints
// ==========================================

// Get OAuth2 authorization URL for Google Photos
export const getGoogleAuthUrl = async () => {
  const { data } = await api.get('/google-photos/auth-url');
  return data; // Returns: { success: true, authUrl: "..." }
};

// Exchange authorization code for access tokens
export const sendGoogleAuthCode = async (code: string) => {
  const { data } = await api.post('/google-photos/callback', { code });
  return data; // Returns: { success: true, tokens: { ... } }
};

// Import photos from Google Photos library
export const importGooglePhotos = async (accessToken: string, limit: number = 25) => {
  const { data } = await api.post('/google-photos/import', { accessToken, limit });
  return data; // { success: true, imported: [...], errors: [...] }
};