import { Photo } from '../types/Photo';

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

// Mock data for now - replace with actual Firestore operations
let mockTrips: Trip[] = [];

export class TripService {
  static async autoGroupPhotos(userId: string, photos: Photo[]): Promise<{ success: boolean; trips?: Trip[]; error?: string }> {
    try {
      if (!photos || photos.length === 0) {
        return { success: true, trips: [] };
      }

      // Simple grouping logic - group photos taken on the same day
      const grouped: { [key: string]: Photo[] } = {};
      
      photos.forEach(photo => {
        const date = new Date(photo.metadata.timestamp).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(photo);
      });

      const trips: Trip[] = [];
      
      Object.keys(grouped).forEach(date => {
        if (grouped[date].length >= 2) { // Only create trips with 2+ photos
          const tripPhotos = grouped[date];
          const startDate = new Date(date);
          const endDate = new Date(date);
          
          // Calculate center location
          const locations = tripPhotos.filter(p => p.metadata.latitude && p.metadata.longitude);
          const centerLocation = locations.length > 0 
            ? this.calculateCenterLocation(locations)
            : { latitude: 0, longitude: 0, name: 'Unknown Location' };

          const trip: Trip = {
            id: Date.now().toString() + Math.random(),
            userId,
            name: `Trip on ${date}`,
            description: `Automatically created trip with ${tripPhotos.length} photos`,
            startDate,
            endDate,
            location: centerLocation,
            photoIds: tripPhotos.map(p => p.id),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          trips.push(trip);
          mockTrips.push(trip);
        }
      });

      return { success: true, trips };
    } catch (error: any) {
      console.error('Auto group photos error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserTrips(userId: string, options: { limit?: number; page?: number } = {}): Promise<{ success: boolean; trips?: Trip[]; total?: number; error?: string }> {
    try {
      const userTrips = mockTrips.filter(trip => trip.userId === userId);
      
      const limit = options.limit || 50;
      const page = options.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedTrips = userTrips.slice(startIndex, endIndex);

      return { 
        success: true, 
        trips: paginatedTrips,
        total: userTrips.length
      };
    } catch (error: any) {
      console.error('Get user trips error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createTrip(userId: string, tripData: any): Promise<{ success: boolean; trip?: Trip; error?: string }> {
    try {
      const trip: Trip = {
        id: Date.now().toString(),
        userId,
        ...tripData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTrips.push(trip);
      return { success: true, trip };
    } catch (error: any) {
      console.error('Create trip error:', error);
      return { success: false, error: error.message };
    }
  }

  private static calculateCenterLocation(photos: Photo[]): { latitude: number; longitude: number; name: string } {
    const locations = photos.filter(p => p.metadata.latitude && p.metadata.longitude);
    
    if (locations.length === 0) {
      return { latitude: 0, longitude: 0, name: 'Unknown Location' };
    }

    const avgLat = locations.reduce((sum, p) => sum + p.metadata.latitude!, 0) / locations.length;
    const avgLon = locations.reduce((sum, p) => sum + p.metadata.longitude!, 0) / locations.length;
    
    return {
      latitude: avgLat,
      longitude: avgLon,
      name: 'Multiple Locations'
    };
  }
}