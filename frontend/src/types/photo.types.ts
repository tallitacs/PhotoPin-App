
export interface PhotoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  city?: string;
  country?: string;
  address?: string;
}

export interface PhotoGPS {
  latitude: number;
  longitude: number;
  altitude?: number;
}

// Main photo interface - matches what backend returns
export interface Photo {
  id: string;
  userId: string;
  fileName: string;  
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  
  // Image properties
  width: number;
  height: number;
  size: number;
  format: string;
  
  // Dates
  takenAt: string;      // ISO string - when photo was taken (from EXIF)
  createdAt: string;    // ISO string - when uploaded to our system
  updatedAt: string;    // ISO string - when last modified
  
  // User-editable fields
  title?: string;
  description?: string;
  tags: string[];
  
  // GPS data from EXIF
  gps?: PhotoGPS;
  
  // Reverse geocoded location (fetched separately)
  location?: PhotoLocation;
  
  // EXIF camera data
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
  
  // Trip association
  tripId?: string;
}

// For uploading photos
export interface PhotoUploadData {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
  tripId?: string;
}

// Response from backend when uploading
export interface PhotoUploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// For updating photo details
export interface PhotoUpdateData {
  title?: string;
  description?: string;
  tags?: string[];
  tripId?: string;
}

// Query parameters for fetching photos
export interface PhotoQueryParams {
  userId?: string;
  tripId?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  hasLocation?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'takenAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}