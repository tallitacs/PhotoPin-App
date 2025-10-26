import { auth } from '../firebase/config';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getToken();
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      // Remove Content-Type for FormData to let browser set it
      if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token might be expired, try to refresh
        const newToken = await this.getToken(true);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${this.baseURL}${endpoint}`, config);
        return await this.handleResponse(retryResponse);
      }

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  }

  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async getToken(forceRefresh = false) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user. Please sign in.');
    }

    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  // Photo methods
  async uploadPhoto(file, metadata = {}) {
    const formData = new FormData();
    formData.append('photo', file);
    
    // Add metadata fields
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== undefined && metadata[key] !== null) {
        if (Array.isArray(metadata[key])) {
          formData.append(key, JSON.stringify(metadata[key]));
        } else {
          formData.append(key, metadata[key].toString());
        }
      }
    });

    return this.request('/photos/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadMultiplePhotos(files, metadata = {}) {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('photos', file);
    });

    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== undefined && metadata[key] !== null) {
        formData.append(key, metadata[key].toString());
      }
    });

    return this.request('/photos/multiple', {
      method: 'POST',
      body: formData,
    });
  }

  async getPhotos(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    return this.request(`/photos?${params}`);
  }

  async getPhoto(photoId) {
    return this.request(`/photos/${photoId}`);
  }

  async deletePhoto(photoId) {
    return this.request(`/photos/${photoId}`, { method: 'DELETE' });
  }

  async updatePhotoMetadata(photoId, updates) {
    return this.request(`/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Trip methods
  async autoGroupPhotos() {
    return this.request('/trips/auto-group', { method: 'POST' });
  }

  async getTrips(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/trips?${params}`);
  }

  async createTrip(tripData) {
    return this.request('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  // Map methods
  async getMapPins() {
    return this.request('/map/pins');
  }

  // Timeline methods
  async getTimeline(groupBy = 'month') {
    return this.request(`/timeline?groupBy=${groupBy}`);
  }

  // Search methods
  async searchPhotos(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/search/photos?${params}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Server info
  async getServerInfo() {
    return this.request('/info');
  }
}

export const apiService = new ApiService();