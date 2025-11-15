import axios from 'axios';
import { auth } from '../config/firebase'; // Import client-side auth
import { PhotoMetadata } from '../types/photo.types';
import { Trip } from '../types/trip.types';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the Firebase auth token to every request
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

// --- Photo Endpoints ---

// Upload *multiple* photos (using FormData)
export const uploadPhotos = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file); // 'photos' must match backend upload.array('photos')
  });

  const { data } = await api.post('/photos/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data; // { success: true, uploaded: [...], errors: [...] }
};

// Get all photos with filters
export const getPhotos = async (filters: { [key: string]: any } = {}) => {
  const { data } = await api.get<{
    success: boolean,
    photos: PhotoMetadata[],
    total: number
  }>('/photos', { params: filters });
  return data;
};

// Get photos for the map
export const getMapPins = async () => {
  const { data } = await api.get<{
    success: boolean,
    photos: PhotoMetadata[],
    total: number
  }>('/photos/map-pins');
  return data;
};

// Get photos for the timeline
export const getTimeline = async () => {
  const { data } = await api.get<{
    success: boolean,
    timeline: { date: string, photos: PhotoMetadata[] }[]
  }>('/photos/timeline');
  return data;
};

// Update a photo's details
export const updatePhoto = async (photoId: string, updates: Partial<PhotoMetadata>) => {
  const { data } = await api.put(`/photos/${photoId}`, updates);
  return data;
};

// Delete a photo
export const deletePhoto = async (photoId: string) => {
  const { data } = await api.delete(`/photos/${photoId}`);
  return data;
};


// --- Trip Endpoints ---

export const getUserTrips = async () => {
  const { data } = await api.get<{
    success: boolean,
    trips: Trip[]
  }>('/trips');
  return data;
};

// ... you can add the rest of the trip API calls here (create, update, delete)
// Example:
export const createTrip = async (tripData: { name: string, photoIds: string[], startDate: string, endDate: string }) => {
  const { data } = await api.post('/trips', tripData);
  return data;
}