export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  photoIds: string[];
  coverPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripClusterConfig {
  timeThreshold?: number; // hours
  distanceThreshold?: number; // kilometers
  minPhotos?: number;
}