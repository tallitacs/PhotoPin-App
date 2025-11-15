// This is based on the backend /@types/Trip.ts you provided
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
  startDate: string; // ISO string
  endDate: string; // ISO string
  photoIds: string[];
  coverPhotoUrl?: string;
  location?: TripLocation;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}