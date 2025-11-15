// Based on your PhotoCard.tsx and backend photoMetadata.ts
export interface PhotoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  city?: string;
  country?: string;
  address?: string;
}

export interface PhotoMetadata {
  id: string;
  userId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  format: string;
  width: number;
  height: number;
  takenAt: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  title?: string;
  description?: string;
  tags?: string[];
  
  // Location
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  location?: PhotoLocation;

  // EXIF
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
}