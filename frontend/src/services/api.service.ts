import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from '../config/firebase';

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            const user = auth.currentUser;
            if (user) {
              const token = await user.getIdToken(true); // Force refresh
              error.config.headers.Authorization = `Bearer ${token}`;
              return this.api.request(error.config);
            }
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Photo endpoints
  async uploadPhoto(file: File, metadata?: any) {
    const formData = new FormData();
    formData.append('photo', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    
    return this.api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  
  async getPhotos(filters?: any) {
    return this.api.get('/photos', { params: filters });
  }
  
  async getPhoto(photoId: string) {
    return this.api.get(`/photos/${photoId}`);
  }
  
  async deletePhoto(photoId: string) {
    return this.api.delete(`/photos/${photoId}`);
  }
  
  async updatePhoto(photoId: string, updates: any) {
    return this.api.put(`/photos/${photoId}`, updates);
  }
  
  async getMapPins() {
    return this.api.get('/photos/map/pins');
  }
  
  async getTimeline(year?: number) {
    return this.api.get('/photos/timeline', { params: { year } });
  }
  
  async searchPhotos(query: string, filters?: any) {
    return this.api.get('/photos/search/photos', { 
      params: { q: query, ...filters } 
    });
  }
  
  // Trip endpoints
  async createTrip(tripData: any) {
    return this.api.post('/trips', tripData);
  }
  
  async getTrips() {
    return this.api.get('/trips');
  }
  
  async autoClusterPhotos(config?: any) {
    return this.api.post('/trips/auto-cluster', config);
  }
}

export const apiService = new ApiService();
export default apiService;