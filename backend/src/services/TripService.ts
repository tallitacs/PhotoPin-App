import { db } from '../config/firebaseAdmin';
import { Trip, TripInput, TripResult, TripsResult, ClusterOptions, TripLocation } from '../@types/Trip';
import { Photo } from '../@types/Photo';
import { PhotoMetadataUtil } from '../utils/photoMetadata';
import { v4 as uuidv4 } from 'uuid';

export class TripService {
  private tripsCollection = db.collection('trips');
  private photosCollection = db.collection('photos');

  // Create a new trip
  async createTrip(userId: string, tripData: TripInput): Promise<TripResult> {
    try {
      const tripId = uuidv4();

      // Validate and fetch photos
      const photoRefs = await Promise.all(
        tripData.photoIds.map(id => this.photosCollection.doc(id).get())
      );

      const validPhotos = photoRefs
        .filter(ref => ref.exists && ref.data()?.userId === userId)
        .map(ref => ref.data() as Photo);

      if (validPhotos.length === 0) {
        return { error: 'No valid photos found for this trip' };
      }

      // Calculate trip location from photo GPS data
      const photosWithLocation = validPhotos.filter(p => p.metadata.gps);
      let location: TripLocation | undefined;

      if (photosWithLocation.length > 0) {
        location = this.calculateTripLocation(photosWithLocation);
      }

      // Get cover photo (first photo or specified)
      const coverPhoto = validPhotos[0];

      const trip: Trip = {
        id: tripId,
        userId,
        name: tripData.name,
        description: tripData.description,
        photoIds: validPhotos.map(p => p.id),
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        coverPhotoUrl: coverPhoto.thumbnailUrl || coverPhoto.url,
        location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save trip
      await this.tripsCollection.doc(tripId).set(trip);

      // Update photos with tripId
      const batch = db.batch();
      validPhotos.forEach(photo => {
        const photoRef = this.photosCollection.doc(photo.id);
        batch.update(photoRef, {
          tripId,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();

      return { trip };
    } catch (error: any) {
      console.error('Create trip error:', error);
      return { error: error.message || 'Failed to create trip' };
    }
  }

  // Get all trips for a user
  async getUserTrips(userId: string): Promise<TripsResult> {
    try {
      const snapshot = await this.tripsCollection
        .where('userId', '==', userId)
        .orderBy('startDate', 'desc')
        .get();

      const trips: Trip[] = [];
      snapshot.forEach(doc => {
        trips.push(doc.data() as Trip);
      });

      return { trips };
    } catch (error: any) {
      console.error('Get trips error:', error);
      return { error: error.message || 'Failed to retrieve trips' };
    }
  }

  // Get single trip by ID
  async getTripById(tripId: string, userId: string): Promise<TripResult> {
    try {
      const doc = await this.tripsCollection.doc(tripId).get();

      if (!doc.exists) {
        return { error: 'Trip not found' };
      }

      const trip = doc.data() as Trip;

      if (trip.userId !== userId) {
        return { error: 'Access denied' };
      }

      return { trip };
    } catch (error: any) {
      console.error('Get trip error:', error);
      return { error: error.message || 'Failed to retrieve trip' };
    }
  }

  // Update trip
  async updateTrip(tripId: string, userId: string, updates: Partial<Trip>): Promise<TripResult> {
    try {
      const doc = await this.tripsCollection.doc(tripId).get();

      if (!doc.exists) {
        return { error: 'Trip not found' };
      }

      const trip = doc.data() as Trip;

      if (trip.userId !== userId) {
        return { error: 'Access denied' };
      }

      const allowedUpdates: any = {
        updatedAt: new Date().toISOString()
      };

      if (updates.name) allowedUpdates.name = updates.name;
      if (updates.description !== undefined) allowedUpdates.description = updates.description;
      if (updates.startDate) allowedUpdates.startDate = updates.startDate;
      if (updates.endDate) allowedUpdates.endDate = updates.endDate;
      if (updates.coverPhotoUrl) allowedUpdates.coverPhotoUrl = updates.coverPhotoUrl;

      await this.tripsCollection.doc(tripId).update(allowedUpdates);

      const updatedDoc = await this.tripsCollection.doc(tripId).get();
      return { trip: updatedDoc.data() as Trip };
    } catch (error: any) {
      console.error('Update trip error:', error);
      return { error: error.message || 'Failed to update trip' };
    }
  }

  // Delete trip
  async deleteTrip(tripId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const doc = await this.tripsCollection.doc(tripId).get();

      if (!doc.exists) {
        return { success: false, error: 'Trip not found' };
      }

      const trip = doc.data() as Trip;

      if (trip.userId !== userId) {
        return { success: false, error: 'Access denied' };
      }

      // Remove tripId from photos
      const batch = db.batch();
      trip.photoIds.forEach(photoId => {
        const photoRef = this.photosCollection.doc(photoId);
        batch.update(photoRef, {
          tripId: null,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();

      // Delete trip
      await this.tripsCollection.doc(tripId).delete();

      return { success: true };
    } catch (error: any) {
      console.error('Delete trip error:', error);
      return { success: false, error: error.message || 'Failed to delete trip' };
    }
  }

  // Add photos to trip
  async addPhotosToTrip(tripId: string, userId: string, photoIds: string[]): Promise<TripResult> {
    try {
      const doc = await this.tripsCollection.doc(tripId).get();

      if (!doc.exists) {
        return { error: 'Trip not found' };
      }

      const trip = doc.data() as Trip;

      if (trip.userId !== userId) {
        return { error: 'Access denied' };
      }

      // Validate photos
      const photoRefs = await Promise.all(
        photoIds.map(id => this.photosCollection.doc(id).get())
      );

      const validPhotoIds = photoRefs
        .filter(ref => ref.exists && ref.data()?.userId === userId)
        .map(ref => ref.id);

      // Update trip with new photos
      const updatedPhotoIds = [...new Set([...trip.photoIds, ...validPhotoIds])];

      await this.tripsCollection.doc(tripId).update({
        photoIds: updatedPhotoIds,
        updatedAt: new Date().toISOString()
      });

      // Update photos with tripId
      const batch = db.batch();
      validPhotoIds.forEach(photoId => {
        const photoRef = this.photosCollection.doc(photoId);
        batch.update(photoRef, {
          tripId,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();

      const updatedDoc = await this.tripsCollection.doc(tripId).get();
      return { trip: updatedDoc.data() as Trip };
    } catch (error: any) {
      console.error('Add photos to trip error:', error);
      return { error: error.message || 'Failed to add photos to trip' };
    }
  }

  // Auto-cluster photos into trips based on location and time proximity
  async autoClusterPhotos(
    userId: string,
    options: ClusterOptions = { maxDistance: 50, maxTimeGap: 24, minPhotos: 3 }
  ): Promise<TripsResult> {
    try {
      // Get photos with location not in trips
      const snapshot = await this.photosCollection
        .where('userId', '==', userId)
        .where('tags', 'array-contains', 'has-location')
        .orderBy('metadata.takenAt', 'asc')
        .get();

      const photos: Photo[] = [];
      snapshot.forEach(doc => {
        const photo = doc.data() as Photo;
        if (photo.metadata.gps && photo.metadata.takenAt && !photo.tripId) {
          photos.push(photo);
        }
      });

      if (photos.length < options.minPhotos) {
        return { trips: [] };
      }

      // Cluster photos
      const clusters: Photo[][] = [];
      let currentCluster: Photo[] = [photos[0]];

      for (let i = 1; i < photos.length; i++) {
        const prevPhoto = photos[i - 1];
        const currPhoto = photos[i];

        const distance = PhotoMetadataUtil.calculateDistance(
          prevPhoto.metadata.gps!.latitude,
          prevPhoto.metadata.gps!.longitude,
          currPhoto.metadata.gps!.latitude,
          currPhoto.metadata.gps!.longitude
        );

        const timeGap = (new Date(currPhoto.metadata.takenAt!).getTime() -
          new Date(prevPhoto.metadata.takenAt!).getTime()) / (1000 * 60 * 60);

        if (distance <= options.maxDistance && timeGap <= options.maxTimeGap) {
          currentCluster.push(currPhoto);
        } else {
          if (currentCluster.length >= options.minPhotos) {
            clusters.push(currentCluster);
          }
          currentCluster = [currPhoto];
        }
      }

      // Add final cluster
      if (currentCluster.length >= options.minPhotos) {
        clusters.push(currentCluster);
      }

      // Create trips
      const createdTrips: Trip[] = [];

      for (const cluster of clusters) {
        const startDate = cluster[0].metadata.takenAt!;
        const endDate = cluster[cluster.length - 1].metadata.takenAt!;

        const startDateObj = new Date(startDate);
        const tripName = `Trip to ${this.getApproximateLocation(cluster[0])} - ${startDateObj.toLocaleDateString()}`;

        const result = await this.createTrip(userId, {
          name: tripName,
          description: `Auto-generated trip with ${cluster.length} photos`,
          photoIds: cluster.map(p => p.id),
          startDate,
          endDate
        });

        if (result.trip) {
          createdTrips.push(result.trip);
        }
      }

      return { trips: createdTrips };
    } catch (error: any) {
      console.error('Auto-cluster error:', error);
      return { error: error.message || 'Failed to auto-cluster photos' };
    }
  }

  // Calculate trip location from photos
  private calculateTripLocation(photos: Photo[]): TripLocation {
    const lats = photos.map(p => p.metadata.gps!.latitude);
    const lngs = photos.map(p => p.metadata.gps!.longitude);

    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

    return {
      centerLat,
      centerLng,
      boundingBox: {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      }
    };
  }

  // Get approximate location name
  private getApproximateLocation(photo: Photo): string {
    // Return coordinates (use reverse geocoding in production)
    if (photo.metadata.gps) {
      return `${photo.metadata.gps.latitude.toFixed(2)}, ${photo.metadata.gps.longitude.toFixed(2)}`;
    }
    return 'Unknown Location';
  }
}

export const tripService = new TripService();