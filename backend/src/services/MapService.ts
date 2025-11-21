import { Photo } from '../@types/Photo';
import { Trip } from '../@types/Trip';

export class MapService {
  private static instance: MapService;

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  // Generate map markers from photos
  generatePhotoMarkers(photos: Photo[]): any[] {
    return photos
      .filter(photo => photo.metadata.gps)
      .map(photo => ({
        id: photo.id,
        position: {
          lat: photo.metadata.gps!.latitude,
          lng: photo.metadata.gps!.longitude
        },
        title: photo.fileName,
        photoURL: photo.thumbnailUrl || photo.url,
        date: photo.metadata.takenAt || photo.uploadedAt
      }));
  }

  // Generate trip boundaries for map
  generateTripBoundaries(trips: Trip[]): any[] {
    return trips
      .filter(trip => trip.location)
      .map(trip => ({
        id: trip.id,
        name: trip.name,
        bounds: trip.location!.boundingBox,
        center: {
          lat: trip.location!.centerLat,
          lng: trip.location!.centerLng
        },
        photoCount: trip.photoIds.length
      }));
  }

  // Cluster nearby markers
  clusterMarkers(markers: any[], clusterRadius: number = 50): any[] {
    const clusters: any[] = [];
    const processed = new Set();

    markers.forEach(marker => {
      if (processed.has(marker.id)) return;

      const nearby = markers.filter(other =>
        !processed.has(other.id) &&
        this.calculateDistance(marker.position, other.position) <= clusterRadius
      );

      if (nearby.length === 1) {
        clusters.push(marker);
      } else {
        clusters.push(this.createCluster(nearby));
      }

      nearby.forEach(m => processed.add(m.id));
    });

    return clusters;
  }

  private createCluster(markers: any[]): any {
    const center = {
      lat: markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length,
      lng: markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length
    };

    return {
      id: `cluster-${markers[0].id}`,
      position: center,
      isCluster: true,
      count: markers.length,
      markers: markers
    };
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(pos2.lat - pos1.lat);
    const dLon = this.deg2rad(pos2.lng - pos1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(pos1.lat)) * Math.cos(this.deg2rad(pos2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const mapService = MapService.getInstance();