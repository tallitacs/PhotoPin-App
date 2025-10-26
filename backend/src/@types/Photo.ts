export interface Photo {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  downloadURL: string;
  metadata: PhotoMetadata;
  title?: string;
  description?: string;
  tags?: string[];
  albumIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  cameraMake?: string;
  cameraModel?: string;
  width?: number;
  height?: number;
  locationName?: string;
}