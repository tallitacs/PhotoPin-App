import * as exifr from 'exifr';
import { PhotoMetadata } from '../@types/Photo';

export class PhotoMetadataUtil {
  /**
   * Extract metadata from photo buffer
   */
  static async extractMetadata(buffer: Buffer, originalName: string): Promise<PhotoMetadata> {
    try {
      const metadata: PhotoMetadata = {
        width: 0,
        height: 0,
        size: buffer.length,
        format: originalName.split('.').pop()?.toUpperCase() || 'UNKNOWN'
      };

      // Try to extract EXIF data
      const exifData = await exifr.parse(buffer);
      
      if (exifData) {
        // Extract dimensions
        if (exifImageWidth && exifImageHeight) {
          metadata.width = exifData.ImageWidth || exifData.ExifImageWidth;
          metadata.height = exifData.ImageHeight || exifData.ExifImageHeight;
        }

        // Extract GPS data
        if (exifData.latitude && exifData.longitude) {
          metadata.gps = {
            latitude: exifData.latitude,
            longitude: exifData.longitude,
            altitude: exifData.altitude
          };
        }

        // Extract date taken
        if (exifData.DateTimeOriginal || exifData.CreateDate) {
          metadata.takenAt = new Date(exifData.DateTimeOriginal || exifData.CreateDate).toISOString();
        }

        // Extract camera info
        if (exifData.Make) metadata.cameraMake = exifData.Make;
        if (exifData.Model) metadata.cameraModel = exifData.Model;
      }

      // If no EXIF dimensions, we'll need to get them from image processing
      // This would be implemented with Sharp or similar library

      return metadata;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Return basic metadata if extraction fails
      return {
        width: 0,
        height: 0,
        size: buffer.length,
        format: originalName.split('.').pop()?.toUpperCase() || 'UNKNOWN'
      };
    }
  }

  /**
   * Generate tags based on metadata
   */
  static generateTags(metadata: PhotoMetadata, fileName: string): string[] {
    const tags: string[] = [];
    
    // Add year and month tags
    if (metadata.takenAt) {
      const date = new Date(metadata.takenAt);
      tags.push(`year-${date.getFullYear()}`);
      tags.push(`month-${date.getMonth() + 1}`);
    }

    // Add camera tags
    if (metadata.cameraMake) {
      tags.push(`make-${metadata.cameraMake.toLowerCase().replace(/\s+/g, '-')}`);
    }
    if (metadata.cameraModel) {
      tags.push(`model-${metadata.cameraModel.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Add location tag
    if (metadata.gps) {
      tags.push('has-location');
    }

    // Add format tag
    tags.push(`format-${metadata.format.toLowerCase()}`);

    return tags;
  }

  /**
   * Validate image file
   */
  static isValidImageFile(mimetype: string, originalName: string): boolean {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'];
    
    const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
    
    return validMimeTypes.includes(mimetype) && validExtensions.includes(extension);
  }

  /**
   * Calculate distance between coordinates (Haversine formula)
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}