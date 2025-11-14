export interface PhotoMetadata {
  id: string;
  userId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  
  // Location data
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  
  // EXIF data
  exif?: {
    make?: string;
    model?: string;
    dateTime?: string;
    orientation?: number;
    exposureTime?: string;
    fNumber?: string;
    iso?: number;
    focalLength?: string;
  };
  
  // User additions
  title?: string;
  description?: string;
  tags?: string[];
  tripId?: string;
  
  // Timestamps
  takenAt?: Date;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface PhotoFilters {
  startDate?: Date;
  endDate?: Date;
  location?: string;
  tags?: string[];
  tripId?: string;
}