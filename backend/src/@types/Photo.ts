export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  city?: string;
  country?: string;
  address?: string;
}

export interface PhotoMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  takenAt?: string; // ISO date string
  gps?: GPSCoordinates;
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
  description?: string;
  rotation?: number; // Rotation angle in degrees (0, 90, 180, 270)
}

export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  displayName?: string;  // User-editable display name (shown instead of fileName if set)
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  metadata: PhotoMetadata;
  tags: string[];
  tripId?: string;
  isFavorite?: boolean; // Favorite/starred status
  location?: PhotoLocation; // Reverse geocoded location info
  uploadedAt: string;
  updatedAt: string;
}

export interface PhotoUploadResult {
  photo?: Photo;
  error?: string;
}

export interface PhotosQueryResult {
  photos?: Photo[];
  total?: number;
  error?: string;
}

export interface PhotoQueryResult {
  photo?: Photo;
  error?: string;
}

export interface PhotoDeleteResult {
  success: boolean;
  error?: string;
}

export interface PhotoFilters {
  limit?: number;
  offset?: number;
  year?: number;
  month?: number;
  tripId?: string;
  hasLocation?: boolean;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}