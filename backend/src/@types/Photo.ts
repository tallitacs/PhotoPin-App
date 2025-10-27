export interface PhotoMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  takenAt?: string;
  cameraMake?: string;
  cameraModel?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  downloadURL: string;
  thumbnailURL?: string;
  metadata: PhotoMetadata;
  location?: GeoPoint;
  createdAt: string;
  updatedAt: string;
  tripId?: string;
  tags: string[];
  isPublic: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface PhotoUploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

export interface PhotoQueryFilters {
  year?: number;
  month?: number;
  tripId?: string;
  hasLocation?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}