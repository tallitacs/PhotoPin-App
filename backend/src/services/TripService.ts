import { db } from '../config/firebaseAdmin';
import { Trip, TripInput, TripResult, TripsResult, ClusterOptions, TripLocation } from '../@types/Trip';
import { Photo } from '../@types/Photo';
import { PhotoMetadataUtil } from '../utils/photoMetadata';
import { geocodingService } from './GeocodingService';
import { v4 as uuidv4 } from 'uuid';

export class TripService {
  private tripsCollection = db.collection('trips');
  private photosCollection = db.collection('photos');

  // Create a new trip
  async createTrip(userId: string, tripData: TripInput): Promise<TripResult> {
    try {
      const tripId = uuidv4();

      // Validate and fetch photos (if any provided)
      let validPhotos: Photo[] = [];
      let location: TripLocation | undefined;
      let coverPhotoUrl: string | undefined;

      if (tripData.photoIds && tripData.photoIds.length > 0) {
        const photoRefs = await Promise.all(
          tripData.photoIds.map(id => this.photosCollection.doc(id).get())
        );

        validPhotos = photoRefs
          .filter(ref => ref.exists && ref.data()?.userId === userId)
          .map(ref => ref.data() as Photo);

        // Calculate trip location from photo GPS data
        const photosWithLocation = validPhotos.filter(p => p.metadata?.gps);
        if (photosWithLocation.length > 0) {
          location = this.calculateTripLocation(photosWithLocation);
        }

        // Get cover photo (first photo or specified)
        if (validPhotos.length > 0) {
          coverPhotoUrl = validPhotos[0].thumbnailUrl || validPhotos[0].url;
        }
      }

      const trip: Trip = {
        id: tripId,
        userId,
        name: tripData.name,
        description: tripData.description,
        photoIds: validPhotos.map(p => p.id),
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        coverPhotoUrl,
        location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save trip
      await this.tripsCollection.doc(tripId).set(trip);

      // Update photos with tripId (if any)
      if (validPhotos.length > 0) {
        const batch = db.batch();
        validPhotos.forEach(photo => {
          const photoRef = this.photosCollection.doc(photo.id);
          batch.update(photoRef, {
            tripId,
            updatedAt: new Date().toISOString()
          });
        });
        await batch.commit();
      }

      return { trip };
    } catch (error: any) {
      console.error('Create trip error:', error);
      return { error: error.message || 'Failed to create trip' };
    }
  }

  // Get all trips for a user
  async getUserTrips(userId: string): Promise<TripsResult> {
    try {
      // Query without orderBy to avoid index requirement (will sort client-side)
      const snapshot = await this.tripsCollection
        .where('userId', '==', userId)
        .get();

      const trips: Trip[] = [];
      snapshot.forEach(doc => {
        trips.push(doc.data() as Trip);
      });

      // Sort by startDate descending (newest first) client-side
      // Handle trips without startDate by putting them at the end
      trips.sort((a, b) => {
        // Handle undefined or empty startDate
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return 1; // a goes to end
        if (!b.startDate) return -1; // b goes to end

        // Both have startDate, parse them
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        // Handle invalid dates
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateB - dateA; // Descending order (newest first)
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
      if (updates.startDate !== undefined) allowedUpdates.startDate = updates.startDate || null;
      if (updates.endDate !== undefined) allowedUpdates.endDate = updates.endDate || null;
      if (updates.coverPhotoUrl) allowedUpdates.coverPhotoUrl = updates.coverPhotoUrl;
      if (updates.locationName !== undefined) allowedUpdates.locationName = updates.locationName || null;

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

  // Smart Albums: Auto-cluster photos into trips based on different strategies
  async autoClusterPhotos(
    userId: string,
    options: ClusterOptions = {
      maxDistance: 50,
      maxTimeGap: 24,
      minPhotos: 3,
      strategy: 'location-time',
      dateRangeDays: 7,
      tagSimilarity: 2
    }
  ): Promise<TripsResult> {
    try {
      const strategy = options.strategy || 'location-time';
      const minPhotos = options.minPhotos || 3;

      // Get all photos not already in trips
      const snapshot = await this.photosCollection
        .where('userId', '==', userId)
        .get();

      const photos: Photo[] = [];
      snapshot.forEach(doc => {
        const photo = doc.data() as Photo;
        // Must have takenAt date and not be in a trip
        if (photo.metadata?.takenAt && !photo.tripId) {
          photos.push(photo);
        }
      });

      if (photos.length < minPhotos) {
        console.log(`Not enough photos (${photos.length} < ${minPhotos}) to create clusters`);
        return { trips: [] };
      }

      let clusters: Photo[][];

      // Apply different clustering strategies
      switch (strategy) {
        case 'location-time':
          clusters = this.clusterByLocationAndTime(photos, options);
          break;
        case 'date-range':
          clusters = this.clusterByDateRange(photos, options);
          break;
        case 'location':
          clusters = this.clusterByLocation(photos, options);
          break;
        case 'camera':
          clusters = this.clusterByCamera(photos, options);
          break;
        case 'tags':
          clusters = this.clusterByTags(photos, options);
          break;
        default:
          clusters = this.clusterByLocationAndTime(photos, options);
      }

      // Filter clusters by minimum photos
      const validClusters = clusters.filter(cluster => cluster.length >= minPhotos);

      console.log(`Created ${validClusters.length} clusters from ${photos.length} photos using strategy: ${strategy}`);

      // Create trips from clusters
      const createdTrips: Trip[] = [];

      for (const cluster of validClusters) {
        const startDate = cluster[0].metadata.takenAt!;
        const endDate = cluster[cluster.length - 1].metadata.takenAt!;

        const tripName = await this.generateTripName(cluster);

        const result = await this.createTrip(userId, {
          name: tripName,
          description: `Smart album: ${cluster.length} photos (${strategy} clustering)`,
          photoIds: cluster.map(p => p.id),
          startDate,
          endDate
        });

        if (result.trip) {
          createdTrips.push(result.trip);
          console.log(`Created smart album: ${result.trip.name} with ${cluster.length} photos`);
        } else {
          console.warn(`Failed to create trip for cluster: ${result.error}`);
        }
      }

      console.log(`Successfully created ${createdTrips.length} smart albums`);
      return { trips: createdTrips };
    } catch (error: any) {
      console.error('Smart albums clustering error:', error);
      return { error: error.message || 'Failed to create smart albums' };
    }
  }

  // Cluster by location and time (original strategy)
  private clusterByLocationAndTime(photos: Photo[], options: ClusterOptions): Photo[][] {
    const maxDistance = options.maxDistance || 50;
    const maxTimeGap = options.maxTimeGap || 24;
    const minPhotos = options.minPhotos || 3;

    // Sort by takenAt date ascending
    const sortedPhotos = [...photos].sort((a, b) => {
      const dateA = a.metadata?.takenAt ? new Date(a.metadata.takenAt).getTime() : 0;
      const dateB = b.metadata?.takenAt ? new Date(b.metadata.takenAt).getTime() : 0;
      return dateA - dateB;
    });

    const clusters: Photo[][] = [];
    let currentCluster: Photo[] = [sortedPhotos[0]];

    for (let i = 1; i < sortedPhotos.length; i++) {
      const prevPhoto = sortedPhotos[i - 1];
      const currPhoto = sortedPhotos[i];

      if (!prevPhoto.metadata?.takenAt || !currPhoto.metadata?.takenAt) {
        continue;
      }

      const timeGap = (new Date(currPhoto.metadata.takenAt).getTime() -
        new Date(prevPhoto.metadata.takenAt).getTime()) / (1000 * 60 * 60);

      let sameLocation = false;

      if (prevPhoto.metadata?.gps && currPhoto.metadata?.gps) {
        const distance = PhotoMetadataUtil.calculateDistance(
          prevPhoto.metadata.gps.latitude,
          prevPhoto.metadata.gps.longitude,
          currPhoto.metadata.gps.latitude,
          currPhoto.metadata.gps.longitude
        );
        sameLocation = distance <= maxDistance;
      } else {
        const prevCity = prevPhoto.location?.city?.toLowerCase();
        const currCity = currPhoto.location?.city?.toLowerCase();
        const prevCountry = prevPhoto.location?.country?.toLowerCase();
        const currCountry = currPhoto.location?.country?.toLowerCase();

        if (prevCity && currCity) {
          sameLocation = prevCity === currCity;
        } else if (prevCountry && currCountry && !prevCity && !currCity) {
          sameLocation = prevCountry === currCountry;
        }
      }

      if (sameLocation && timeGap <= maxTimeGap) {
        currentCluster.push(currPhoto);
      } else {
        if (currentCluster.length >= minPhotos) {
          clusters.push(currentCluster);
        }
        currentCluster = [currPhoto];
      }
    }

    if (currentCluster.length >= minPhotos) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  // Cluster by date range (events - same day/week)
  private clusterByDateRange(photos: Photo[], options: ClusterOptions): Photo[][] {
    const dateRangeDays = options.dateRangeDays || 7;
    const minPhotos = options.minPhotos || 3;

    // Sort by takenAt date
    const sortedPhotos = [...photos].filter(p => p.metadata?.takenAt).sort((a, b) => {
      const dateA = new Date(a.metadata!.takenAt!).getTime();
      const dateB = new Date(b.metadata!.takenAt!).getTime();
      return dateA - dateB;
    });

    const clusters: Photo[][] = [];
    let currentCluster: Photo[] = [sortedPhotos[0]];

    for (let i = 1; i < sortedPhotos.length; i++) {
      const prevPhoto = sortedPhotos[i - 1];
      const currPhoto = sortedPhotos[i];

      const prevDate = new Date(prevPhoto.metadata!.takenAt!);
      const currDate = new Date(currPhoto.metadata!.takenAt!);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= dateRangeDays) {
        currentCluster.push(currPhoto);
      } else {
        if (currentCluster.length >= minPhotos) {
          clusters.push(currentCluster);
        }
        currentCluster = [currPhoto];
      }
    }

    if (currentCluster.length >= minPhotos) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  // Cluster by location only
  private clusterByLocation(photos: Photo[], options: ClusterOptions): Photo[][] {
    const maxDistance = options.maxDistance || 50;
    const minPhotos = options.minPhotos || 3;

    // Group photos by location
    const locationGroups = new Map<string, Photo[]>();

    photos.forEach(photo => {
      if (!photo.metadata?.gps && !photo.location) return;

      let locationKey = '';

      if (photo.metadata?.gps) {
        // Round coordinates to group nearby photos
        const roundedLat = Math.round(photo.metadata.gps.latitude * 100) / 100;
        const roundedLng = Math.round(photo.metadata.gps.longitude * 100) / 100;
        locationKey = `gps:${roundedLat},${roundedLng}`;
      } else if (photo.location) {
        locationKey = `loc:${photo.location.city || photo.location.country || 'unknown'}`.toLowerCase();
      }

      if (locationKey) {
        if (!locationGroups.has(locationKey)) {
          locationGroups.set(locationKey, []);
        }
        locationGroups.get(locationKey)!.push(photo);
      }
    });

    // Convert groups to clusters
    const clusters: Photo[][] = [];
    locationGroups.forEach((groupPhotos) => {
      if (groupPhotos.length >= minPhotos) {
        // Sort by date
        groupPhotos.sort((a, b) => {
          const dateA = a.metadata?.takenAt ? new Date(a.metadata.takenAt).getTime() : 0;
          const dateB = b.metadata?.takenAt ? new Date(b.metadata.takenAt).getTime() : 0;
          return dateA - dateB;
        });
        clusters.push(groupPhotos);
      }
    });

    return clusters;
  }

  // Cluster by camera (same camera make/model)
  private clusterByCamera(photos: Photo[], options: ClusterOptions): Photo[][] {
    const minPhotos = options.minPhotos || 3;

    // Group photos by camera
    const cameraGroups = new Map<string, Photo[]>();

    photos.forEach(photo => {
      const cameraMake = photo.metadata?.cameraMake || 'Unknown';
      const cameraModel = photo.metadata?.cameraModel || 'Unknown';
      const cameraKey = `${cameraMake}|${cameraModel}`.toLowerCase();

      if (!cameraGroups.has(cameraKey)) {
        cameraGroups.set(cameraKey, []);
      }
      cameraGroups.get(cameraKey)!.push(photo);
    });

    // Convert groups to clusters
    const clusters: Photo[][] = [];
    cameraGroups.forEach((groupPhotos) => {
      if (groupPhotos.length >= minPhotos) {
        // Sort by date
        groupPhotos.sort((a, b) => {
          const dateA = a.metadata?.takenAt ? new Date(a.metadata.takenAt).getTime() : 0;
          const dateB = b.metadata?.takenAt ? new Date(b.metadata.takenAt).getTime() : 0;
          return dateA - dateB;
        });
        clusters.push(groupPhotos);
      }
    });

    return clusters;
  }

  // Cluster by tags (photos with similar tags)
  private clusterByTags(photos: Photo[], options: ClusterOptions): Photo[][] {
    const tagSimilarity = options.tagSimilarity || 2;
    const minPhotos = options.minPhotos || 3;

    const clusters: Photo[][] = [];
    const processed = new Set<string>();

    photos.forEach(photo => {
      if (processed.has(photo.id) || !photo.tags || photo.tags.length === 0) return;

      const cluster: Photo[] = [photo];
      processed.add(photo.id);

      photos.forEach(otherPhoto => {
        if (processed.has(otherPhoto.id) || !otherPhoto.tags || otherPhoto.tags.length === 0) return;

        // Count common tags
        const commonTags = photo.tags.filter(tag => otherPhoto.tags.includes(tag));

        if (commonTags.length >= tagSimilarity) {
          cluster.push(otherPhoto);
          processed.add(otherPhoto.id);
        }
      });

      if (cluster.length >= minPhotos) {
        // Sort by date
        cluster.sort((a, b) => {
          const dateA = a.metadata?.takenAt ? new Date(a.metadata.takenAt).getTime() : 0;
          const dateB = b.metadata?.takenAt ? new Date(b.metadata.takenAt).getTime() : 0;
          return dateA - dateB;
        });
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  // Calculate trip location from photos
  private calculateTripLocation(photos: Photo[]): TripLocation {
    const lats = photos.map(p => p.metadata?.gps?.latitude).filter((lat): lat is number => lat !== undefined);
    const lngs = photos.map(p => p.metadata?.gps?.longitude).filter((lng): lng is number => lng !== undefined);

    if (lats.length === 0 || lngs.length === 0) {
      throw new Error('No valid GPS coordinates found in photos');
    }

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

  // Generate a human-readable trip name like "Weekend in Galway" or "Trip - November 2017"
  private async generateTripName(photos: Photo[]): Promise<string> {
    const firstPhoto = photos[0];
    const startDate = new Date(firstPhoto.metadata!.takenAt!);
    const endDate = new Date(photos[photos.length - 1].metadata!.takenAt!);

    // Calculate duration in days
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get location name
    let locationName = 'Unknown Location';

    // Try to get location from photo's location field first
    if (firstPhoto.location?.city) {
      locationName = firstPhoto.location.city;
    } else if (firstPhoto.location?.country) {
      locationName = firstPhoto.location.country;
    } else if (firstPhoto.metadata?.gps) {
      // Try reverse geocoding if we have GPS
      try {
        const geocodeResult = await geocodingService.reverseGeocode(
          firstPhoto.metadata.gps.latitude,
          firstPhoto.metadata.gps.longitude
        );
        if (geocodeResult?.city) {
          locationName = geocodeResult.city;
        } else if (geocodeResult?.country) {
          locationName = geocodeResult.country;
        }
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
      }
    }

    // Format date
    const isSameMonth = startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    let dateStr = '';
    if (isSameMonth) {
      // Same month: "November 2017"
      dateStr = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      // Different months: "November 2017" or "Nov 1 - Nov 5, 2017"
      if (startDate.getFullYear() === endDate.getFullYear()) {
        dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }

    // Generate name based on duration
    if (daysDiff <= 3) {
      // Short trip: "Weekend in Galway" or "Day in Dublin"
      const dayLabel = daysDiff === 1 ? 'Day' : daysDiff === 2 ? 'Weekend' : 'Weekend';
      return `${dayLabel} in ${locationName}`;
    } else if (daysDiff <= 7) {
      // Week trip: "Week in Paris"
      return `Week in ${locationName}`;
    } else {
      // Longer trip: "Trip - November 2017" or "Trip to Galway - November 2017"
      return `Trip to ${locationName} - ${dateStr}`;
    }
  }

  // Get approximate location name (kept for backward compatibility)
  private getApproximateLocation(photo: Photo): string {
    if (photo.location?.city) {
      return photo.location.city;
    }
    if (photo.location?.country) {
      return photo.location.country;
    }
    if (photo.metadata?.gps) {
      return `${photo.metadata.gps.latitude.toFixed(2)}, ${photo.metadata.gps.longitude.toFixed(2)}`;
    }
    return 'Unknown Location';
  }
}

export const tripService = new TripService();