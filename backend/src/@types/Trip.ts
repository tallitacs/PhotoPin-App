export interface TripLocation {
  centerLat: number;
  centerLng: number;
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  photoIds: string[];
  coverPhotoUrl?: string;
  location?: TripLocation;
  createdAt: string;
  updatedAt: string;
}

export interface TripInput {
  name: string;
  description?: string;
  photoIds: string[];
  startDate: string;
  endDate: string;
}

export interface TripResult {
  trip?: Trip;
  error?: string;
}

export interface TripsResult {
  trips?: Trip[];
  error?: string;
}

export interface ClusterOptions {
  maxDistance: number;
  maxTimeGap: number;
  minPhotos: number;
}