export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
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
}

export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  metadata: PhotoMetadata;
  tags: string[];
  tripId?: string;
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