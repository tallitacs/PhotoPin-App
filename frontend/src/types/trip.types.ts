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
  startDate?: string; // ISO string (optional to handle existing trips)
  endDate?: string; // ISO string (optional to handle existing trips)
  photoIds: string[];
  coverPhotoUrl?: string;
  location?: TripLocation; // GPS coordinates for map
  locationName?: string; // Display location name (e.g., "Paris, France")
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}