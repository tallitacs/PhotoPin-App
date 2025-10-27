import { db } from '../config/firebaseAdmin';
import { Trip, CreateTripRequest, AutoClusterConfig } from '../@types/Trip';
import { Photo } from '../@types/Photo';
import { PhotoMetadataUtil } from '../utils/photoMetadata';

export class TripService {
  private static instance: TripService;

  public static getInstance(): TripService {
    if (!TripService.instance) {
      TripService.instance = new TripService();
    }
    return TripService.instance;
  }

  /**
   * Create a new trip
   */
  async createTrip(
    userId: string, 
    tripData: CreateTripRequest
  ): Promise<{ trip: Trip | null; error?: string }> {
    try {
      // Validate photo ownership
      const photoValidation = await this.validatePhotoOwnership(userId, tripData.photoIds);
      if (!photoValidation.valid) {
        return { trip: null, error: photoValidation.error };
      }

      // Calculate trip bounds from photos
      const tripBounds = await this.calculateTripBounds(tripData.photoIds);
      
      const trip: Omit<Trip, 'id'> = {
        userId,
        name: tripData.name,
        description: tripData.description,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        location: tripBounds,
        photoIds: tripData.photoIds,
        coverPhotoId: tripData.photoIds[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: this.generateTripTags(tripData.name, tripBounds)
      };

      const docRef = await db.collection('trips').add(trip);

      // Update photos with trip ID
      await this.updatePhotosWithTripId(tripData.photoIds, docRef.id);

      return {
        trip: {
          id: docRef.id,
          ...trip
        }
      };
    } catch (error: any) {
      console.error('Error creating trip:', error);
      return { trip: null, error: 'Failed to create trip' };
    }
  }

  /**
   * Auto-cluster photos into trips
   */
  async autoClusterPhotos(
    userId: string, 
    config: AutoClusterConfig = {
      maxDistance: 50, // km
      maxTimeGap: 24, // hours
      minPhotos: 3
    }
  ): Promise<{ trips: Trip[]; error?: string }> {
    try {
      // Get all user photos with location and date
      const photosSnapshot = await db.collection('photos')
        .where('userId', '==', userId)
        .where('location', '!=', null)
        .where('metadata.takenAt', '!=', null)
        .orderBy('metadata.takenAt', 'asc')
        .get();

      const photos: Photo[] = [];
      photosSnapshot.forEach(doc => {
        photos.push({ id: doc.id, ...doc.data() } as Photo);
      });

      const clusters = this.clusterPhotos(photos, config);
      const createdTrips: Trip[] = [];

      // Create trips from clusters
      for (const cluster of clusters) {
        if (cluster.length >= config.minPhotos) {
          const tripResult = await this.createTripFromCluster(userId, cluster);
          if (tripResult.trip) {
            createdTrips.push(tripResult.trip);
          }
        }
      }

      return { trips: createdTrips };
    } catch (error: any) {
      console.error('Error auto-clustering photos:', error);
      return { trips: [], error: 'Failed to auto-cluster photos' };
    }
  }

  /**
   * Cluster photos based on time and location
   */
  private clusterPhotos(photos: Photo[], config: AutoClusterConfig): Photo[][] {
    const clusters: Photo[][] = [];
    let currentCluster: Photo[] = [];

    for (let i = 0; i < photos.length; i++) {
      const currentPhoto = photos[i];
      
      if (currentCluster.length === 0) {
        currentCluster.push(currentPhoto);
        continue;
      }

      const lastPhoto = currentCluster[currentCluster.length - 1];
      
      // Check if current photo belongs to current cluster
      if (this.shouldClusterWith(lastPhoto, currentPhoto, config)) {
        currentCluster.push(currentPhoto);
      } else {
        // Start new cluster
        if (currentCluster.length >= config.minPhotos) {
          clusters.push([...currentCluster]);
        }
        currentCluster = [currentPhoto];
      }
    }

    // Add the last cluster
    if (currentCluster.length >= config.minPhotos) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  /**
   * Determine if two photos should be clustered together
   */
  private shouldClusterWith(photo1: Photo, photo2: Photo, config: AutoClusterConfig): boolean {
    if (!photo1.location || !photo2.location || !photo1.metadata.takenAt || !photo2.metadata.takenAt) {
      return false;
    }

    const time1 = new Date(photo1.metadata.takenAt).getTime();
    const time2 = new Date(photo2.metadata.takenAt).getTime();
    const timeDiff = Math.abs(time1 - time2) / (1000 * 60 * 60); // hours

    const distance = PhotoMetadataUtil.calculateDistance(
      photo1.location.latitude,
      photo1.location.longitude,
      photo2.location.latitude,
      photo2.location.longitude
    );

    return timeDiff <= config.maxTimeGap && distance <= config.maxDistance;
  }

  /**
   * Create trip from photo cluster
   */
  private async createTripFromCluster(
    userId: string, 
    photos: Photo[]
  ): Promise<{ trip: Trip | null; error?: string }> {
    const sortedPhotos = photos.sort((a, b) => 
      new Date(a.metadata.takenAt || a.createdAt).getTime() - 
      new Date(b.metadata.takenAt || b.createdAt).getTime()
    );

    const startDate = sortedPhotos[0].metadata.takenAt || sortedPhotos[0].createdAt;
    const endDate = sortedPhotos[sortedPhotos.length - 1].metadata.takenAt || 
                   sortedPhotos[sortedPhotos.length - 1].createdAt;

    const tripName = await this.generateTripName(sortedPhotos);

    return this.createTrip(userId, {
      name: tripName,
      photoIds: sortedPhotos.map(p => p.id),
      startDate,
      endDate
    });
  }

  /**
   * Generate trip name based on location and date
   */
  private async generateTripName(photos: Photo[]): Promise<string> {
    // This would use reverse geocoding in a real implementation
    // For now, use a simple name based on date
    const firstPhoto = photos[0];
    const date = new Date(firstPhoto.metadata.takenAt || firstPhoto.createdAt);
    
    return `Trip - ${date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })}`;
  }

  /**
   * Validate that user owns all photos
   */
  private async validatePhotoOwnership(
    userId: string, 
    photoIds: string[]
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      for (const photoId of photoIds) {
        const photoDoc = await db.collection('photos').doc(photoId).get();
        if (!photoDoc.exists) {
          return { valid: false, error: `Photo ${photoId} not found` };
        }

        const photo = photoDoc.data() as Photo;
        if (photo.userId !== userId) {
          return { valid: false, error: `Access denied for photo ${photoId}` };
        }
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Error validating photo ownership' };
    }
  }

  /**
   * Calculate trip bounds from photos
   */
  private async calculateTripBounds(photoIds: string[]): Promise<Trip['location']> {
    const photos: Photo[] = [];
    
    for (const photoId of photoIds) {
      const photoDoc = await db.collection('photos').doc(photoId).get();
      if (photoDoc.exists) {
        photos.push({ id: photoDoc.id, ...photoDoc.data() } as Photo);
      }
    }

    const locations = photos.filter(p => p.location).map(p => p.location!);
    
    if (locations.length === 0) {
      // Default bounds if no locations
      return {
        center: { latitude: 0, longitude: 0 },
        boundingBox: { north: 0, south: 0, east: 0, west: 0 }
      };
    }

    const latitudes = locations.map(loc => loc.latitude);
    const longitudes = locations.map(loc => loc.longitude);

    return {
      center: {
        latitude: latitudes.reduce((a, b) => a + b) / latitudes.length,
        longitude: longitudes.reduce((a, b) => a + b) / longitudes.length
      },
      boundingBox: {
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        west: Math.min(...longitudes)
      }
    };
  }

  /**
   * Update photos with trip ID
   */
  private async updatePhotosWithTripId(photoIds: string[], tripId: string): Promise<void> {
    const batch = db.batch();

    for (const photoId of photoIds) {
      const photoRef = db.collection('photos').doc(photoId);
      batch.update(photoRef, { tripId });
    }

    await batch.commit();
  }

  /**
   * Generate tags for trip
   */
  private generateTripTags(name: string, location: Trip['location']): string[] {
    const tags: string[] = [];
    
    // Add location-based tags
    tags.push(`lat-${Math.round(location.center.latitude * 100)/100}`);
    tags.push(`lng-${Math.round(location.center.longitude * 100)/100}`);
    
    // Add name-based tags
    const nameWords = name.toLowerCase().split(' ');
    tags.push(...nameWords.filter(word => word.length > 2));

    return tags;
  }

  /**
   * Get user trips
   */
  async getUserTrips(userId: string): Promise<{ trips: Trip[]; error?: string }> {
    try {
      const snapshot = await db.collection('trips')
        .where('userId', '==', userId)
        .orderBy('startDate', 'desc')
        .get();

      const trips: Trip[] = [];
      snapshot.forEach(doc => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
      });

      return { trips };
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      return { trips: [], error: 'Failed to fetch trips' };
    }
  }
}

export const tripService = TripService.getInstance();