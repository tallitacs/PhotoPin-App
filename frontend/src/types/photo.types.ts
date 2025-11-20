// frontend/src/types/photo.types.ts
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

// Photo metadata structure (matches backend PhotoMetadata)
export interface PhotoMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  takenAt?: string;      // ISO string - when photo was taken (from EXIF)
  gps?: PhotoGPS;        // GPS coordinates from EXIF
  cameraMake?: string;   // Camera manufacturer
  cameraModel?: string;  // Camera model
  iso?: number;          // ISO setting
  aperture?: string;     // Aperture (e.g., "f/2.8")
  shutterSpeed?: string; // Shutter speed (e.g., "1/500")
  focalLength?: string;  // Focal length (e.g., "50mm")
}

// Main photo interface - matches what backend returns
export interface Photo {
  id: string;
  userId: string;
  fileName: string;  
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  
  // Nested metadata object (matches backend structure)
  metadata: PhotoMetadata;
  
  // User-editable fields
  tags: string[];
  tripId?: string;
  
  // Reverse geocoded location (if available)
  location?: PhotoLocation;
  
  // Timestamps
  uploadedAt: string;    // ISO string - when uploaded to our system
  updatedAt: string;     // ISO string - when last modified
}

// Helper type for backward compatibility with components
// that might expect flat structure
export interface PhotoFlat extends Omit<Photo, 'metadata'> {
  // Flatten metadata properties
  width: number;
  height: number;
  size: number;
  format: string;
  takenAt?: string;
  gps?: PhotoGPS;
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
}

// Utility function to flatten photo for display (if needed)
export const flattenPhoto = (photo: Photo): PhotoFlat => {
  return {
    ...photo,
    width: photo.metadata.width,
    height: photo.metadata.height,
    size: photo.metadata.size,
    format: photo.metadata.format,
    takenAt: photo.metadata.takenAt,
    gps: photo.metadata.gps,
    cameraMake: photo.metadata.cameraMake,
    cameraModel: photo.metadata.cameraModel,
    iso: photo.metadata.iso,
    aperture: photo.metadata.aperture,
    shutterSpeed: photo.metadata.shutterSpeed,
    focalLength: photo.metadata.focalLength,
  };
};

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

// Response from backend when uploading multiple photos
export interface MultiplePhotoUploadResponse {
  success: boolean;
  message?: string;
  uploaded: Photo[];
  errors: Array<{ filename: string; error: string }>;
}

// For updating photo details
export interface PhotoUpdateData {
  tags?: string[];
  tripId?: string;
  metadata?: Partial<PhotoMetadata>;
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
  page?: number;
  year?: number;
  month?: number;
  sortBy?: 'takenAt' | 'uploadedAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Response from backend when fetching photos
export interface PhotosResponse {
  success: boolean;
  photos: Photo[];
  total: number;
  error?: string;
}

// Response from backend for single photo
export interface PhotoResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// Timeline grouped photos
export interface TimelineGroup {
  date: string;
  photos: Photo[];
}

// Timeline response
export interface TimelineResponse {
  success: boolean;
  timeline: TimelineGroup[];
  total?: number;
  error?: string;
}

// Map pins response
export interface MapPinsResponse {
  success: boolean;
  photos: Photo[];
  total: number;
  error?: string;
}

// Photo deletion response
export interface PhotoDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}