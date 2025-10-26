export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  photoIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  photoIds: string[];
  locationName: string;
  photoCount: number;
}