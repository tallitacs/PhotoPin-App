// Photo types
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

// Photo metadata structure
export interface PhotoMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  takenAt?: string;      // When photo was taken
  gps?: PhotoGPS;        // GPS coordinates
  cameraMake?: string;   // Camera manufacturer
  cameraModel?: string;  // Camera model
  iso?: number;          // ISO setting
  aperture?: string;     // Aperture
  shutterSpeed?: string; // Shutter speed
  focalLength?: string;  // Focal length
  description?: string;  // User-added description
  rotation?: number;     // Rotation angle in degrees (0, 90, 180, 270)
}

// Main photo interface
export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  displayName?: string;  // User-editable display name (shown instead of fileName if set)
  storagePath: string;
  url: string;
  thumbnailUrl?: string;

  // Metadata object
  metadata: PhotoMetadata;

  // User-editable
  tags: string[];
  tripId?: string;
  isFavorite?: boolean; // Favorite/starred status

  // Reverse geocoded location
  location?: PhotoLocation;

  // Timestamps
  uploadedAt: string;    // When uploaded
  updatedAt: string;     // When last modified
}

// Helper type for backward compatibility
export interface PhotoFlat extends Omit<Photo, 'metadata'> {
  // Flattened metadata
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

// Flatten photo for display
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

// Photo upload data
export interface PhotoUploadData {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
  tripId?: string;
}

// Photo upload response
export interface PhotoUploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// Multiple photo upload response
export interface MultiplePhotoUploadResponse {
  success: boolean;
  message?: string;
  uploaded: Photo[];
  errors: Array<{ filename: string; error: string }>;
}

// Photo update data
export interface PhotoUpdateData {
  tags?: string[];
  tripId?: string;
  metadata?: Partial<PhotoMetadata>;
}

// Photo query parameters
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

// Photos response
export interface PhotosResponse {
  success: boolean;
  photos: Photo[];
  total: number;
  error?: string;
}

// Single photo response
export interface PhotoResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// Timeline group
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