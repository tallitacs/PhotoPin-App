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
  startDate?: string; // Made optional to handle existing trips
  endDate?: string; // Made optional to handle existing trips
  photoIds: string[];
  coverPhotoUrl?: string;
  location?: TripLocation; // GPS coordinates for map
  locationName?: string; // Display location name (e.g., "Paris, France")
  createdAt: string;
  updatedAt: string;
}

export interface TripInput {
  name: string;
  description?: string;
  photoIds: string[];
  startDate?: string; // Made optional to match Trip interface
  endDate?: string; // Made optional to match Trip interface
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