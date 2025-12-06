import axios from 'axios';
import { auth } from '../config/firebase';
import { Photo, PhotoMetadata, PhotosResponse, TimelineResponse } from '../types/photo.types';
import { Trip } from '../types/trip.types';

// Create axios instance with base API URL
// Default to http://localhost:5000/api if REACT_APP_API_URL is not set
const apiBaseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (!process.env.REACT_APP_API_URL) {
  console.warn('REACT_APP_API_URL not set, using default:', apiBaseURL);
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add Firebase auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (tokenError: any) {
        console.error('Error getting Firebase token:', tokenError);
        // If token refresh fails, try to get a fresh token
        if (tokenError.code === 'auth/network-request-failed') {
          console.warn('Token refresh network error - this may be a Firebase API key issue');
        }
        throw tokenError;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      baseURL: error.config?.baseURL
    });

    // Log full error response for easier debugging
    if (error.response?.data) {
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }

    // Handle network errors specifically
    if (error.message === 'Network Error' || !error.response) {
      console.error('Network Error - Backend may not be running or CORS issue');
      console.error('API Base URL:', apiBaseURL);
      console.error('Expected API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api (default)');
      error.message = 'Cannot connect to server. Make sure the backend is running on port 5000.';
    }

    return Promise.reject(error);
  }
);

// ==========================================
// Photo API Endpoints
// ==========================================

// Upload multiple photos using FormData
export const uploadPhotos = async (files: File[], tripId?: string) => {
  // Build FormData with all files
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file); // Field name must match backend upload.array('photos')
  });

  // Add tripId as query parameter if provided
  const url = tripId
    ? `/photos/upload-multiple?tripId=${tripId}`
    : '/photos/upload-multiple';

  const { data } = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data; // Returns: { success: true, uploaded: [...], errors: [...] }
};

// Get user's photos with optional filters (year, tags, tripId, etc.)
export const getPhotos = async (filters: { [key: string]: any } = {}): Promise<PhotosResponse> => {
  const { data } = await api.get<PhotosResponse>('/photos', { params: filters });
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
export const getTimeline = async (): Promise<TimelineResponse> => {
  const { data } = await api.get<TimelineResponse>('/photos/timeline');
  return data;
};

// Update photo metadata (tags, tripId, metadata, etc.)
export const updatePhoto = async (photoId: string, updates: {
  tags?: string[],
  metadata?: Partial<PhotoMetadata>,
  tripId?: string,
  displayName?: string,
  isFavorite?: boolean,
  location?: { latitude?: number, longitude?: number, city?: string, country?: string, address?: string } | null
}) => {
  const { data } = await api.put(`/photos/${photoId}`, updates);
  return data;
};

// Delete a photo
export const deletePhoto = async (photoId: string) => {
  const { data } = await api.delete(`/photos/${photoId}`);
  return data;
};

// Rotate a photo
export const rotatePhoto = async (photoId: string, angle: number) => {
  const { data } = await api.post<{
    success: boolean,
    photo?: Photo,
    error?: string
  }>(`/photos/${photoId}/rotate`, { angle });
  return data;
};

// Bulk update photos: updates multiple photos with tags (add/remove) and/or location (set/clear)
// Returns: { success, updated, errors?, error? }
export const bulkUpdatePhotos = async (photoIds: string[], updates: {
  tagsToAdd?: string[],
  tagsToRemove?: string[],
  location?: { latitude?: number, longitude?: number, city?: string, country?: string, address?: string } | null
}) => {
  const { data } = await api.post<{
    success: boolean,
    updated?: number,
    errors?: Array<{ photoId: string, error: string }>,
    error?: string
  }>('/photos/bulk-update', { photoIds, ...updates });
  return data;
};

// Bulk delete photos
export const bulkDeletePhotos = async (photoIds: string[]) => {
  const { data } = await api.post<{
    success: boolean,
    deleted?: number,
    errors?: Array<{ photoId: string, error: string }>,
    error?: string
  }>('/photos/bulk-delete', { photoIds });
  return data;
};

// ==========================================
// Trip API Endpoints
// ==========================================

// Get all trips for current user
export const getUserTrips = async () => {
  const { data } = await api.get<{
    success: boolean,
    trips: Trip[],
    error?: string
  }>('/trips');
  return data;
};

export const createTrip = async (tripData: { name: string, description?: string, photoIds: string[], startDate?: string, endDate?: string }) => {
  const { data } = await api.post('/trips', tripData);
  return data;
};

// Get a single trip by ID
export const getTrip = async (tripId: string) => {
  const { data } = await api.get<{
    success: boolean,
    trip?: Trip,
    error?: string
  }>(`/trips/${tripId}`);
  return data;
};

// Add photos to a trip
export const addPhotosToTrip = async (tripId: string, photoIds: string[]) => {
  const { data } = await api.post(`/trips/${tripId}/photos`, { photoIds });
  return data;
};

// Update a trip
export const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
  const { data } = await api.put(`/trips/${tripId}`, updates);
  return data;
};

// Delete a trip
export const deleteTrip = async (tripId: string) => {
  const { data } = await api.delete(`/trips/${tripId}`);
  return data;
};

// Smart Albums: Auto-cluster photos into trips/albums
export const autoClusterPhotos = async (options?: {
  strategy?: 'location-time' | 'date-range' | 'location' | 'camera' | 'tags',
  maxDistance?: number,
  maxTimeGap?: number,
  minPhotos?: number,
  dateRangeDays?: number,
  tagSimilarity?: number
}) => {
  const { data } = await api.post<{
    success: boolean,
    message?: string,
    trips?: Trip[],
    error?: string
  }>('/trips/auto-cluster', options || {});
  return data;
};

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

// List photos from Google Photos (for selection)
export const listGooglePhotos = async (accessToken: string, limit: number = 100, pageToken?: string) => {
  const { data } = await api.post('/google-photos/list', { accessToken, limit, pageToken });
  return data; // { success: true, photos: [...], nextPageToken: "..." }
};

// Import selected photos by IDs
export const importSelectedGooglePhotos = async (accessToken: string, photoIds: string[]) => {
  const { data } = await api.post('/google-photos/import-selected', { accessToken, photoIds });
  return data; // { success: true, imported: [...], errors: [...] }
};

// Import photos from Google Photos library (legacy - kept for backwards compatibility)
export const importGooglePhotos = async (accessToken: string, limit: number = 25) => {
  const { data } = await api.post('/google-photos/import', { accessToken, limit });
  return data; // { success: true, imported: [...], errors: [...] }
};