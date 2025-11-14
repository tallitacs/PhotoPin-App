import exifr from 'exifr';
import sharp from 'sharp';
import { PhotoMetadata } from '../@types/Photo';

export class PhotoMetadataUtil {
  /**
   * Extract comprehensive metadata from photo buffer
   */
  static async extractMetadata(buffer: Buffer, originalName: string): Promise<PhotoMetadata> {
    try {
      const metadata: PhotoMetadata = {
        width: 0,
        height: 0,
        size: buffer.length,
        format: originalName.split('.').pop()?.toUpperCase() || 'UNKNOWN'
      };

      // Use Sharp to get image dimensions and basic info
      try {
        const sharpMetadata = await sharp(buffer).metadata();
        metadata.width = sharpMetadata.width || 0;
        metadata.height = sharpMetadata.height || 0;
        metadata.format = sharpMetadata.format?.toUpperCase() || metadata.format;
      } catch (sharpError) {
        console.warn('Sharp metadata extraction failed:', sharpError);
      }

      // Extract EXIF data
      try {
        const exifData = await exifr.parse(buffer, {
          tiff: true,
          exif: true,
          gps: true,
          interop: true
        });
        
        if (exifData) {
          // Update dimensions from EXIF if available
          if (exifData.ImageWidth || exifData.ExifImageWidth) {
            metadata.width = exifData.ImageWidth || exifData.ExifImageWidth;
          }
          if (exifData.ImageHeight || exifData.ExifImageHeight) {
            metadata.height = exifData.ImageHeight || exifData.ExifImageHeight;
          }

          // Extract GPS data
          if (exifData.latitude && exifData.longitude) {
            metadata.gps = {
              latitude: exifData.latitude,
              longitude: exifData.longitude,
              altitude: typeof exifData.altitude === 'string' 
                ? parseFloat(exifData.altitude) 
                : exifData.altitude
            };
          }

          // Extract date taken
          if (exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime) {
            const dateStr = exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;
            try {
              metadata.takenAt = new Date(dateStr).toISOString();
            } catch (dateError) {
              console.warn('Date parsing failed:', dateError);
            }
          }

          // Extract camera info
          if (exifData.Make) metadata.cameraMake = String(exifData.Make).trim();
          if (exifData.Model) metadata.cameraModel = String(exifData.Model).trim();
          
          // Extract camera settings
          if (exifData.ISO) metadata.iso = Number(exifData.ISO);
          if (exifData.FNumber) metadata.aperture = `f/${exifData.FNumber}`;
          if (exifData.ExposureTime) {
            metadata.shutterSpeed = exifData.ExposureTime < 1 
              ? `1/${Math.round(1 / exifData.ExposureTime)}`
              : `${exifData.ExposureTime}s`;
          }
          if (exifData.FocalLength) metadata.focalLength = `${exifData.FocalLength}mm`;
        }
      } catch (exifError) {
        console.warn('EXIF extraction failed:', exifError);
      }

      // If no date from EXIF, use current date
      if (!metadata.takenAt) {
        metadata.takenAt = new Date().toISOString();
      }

      return metadata;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Return basic metadata if extraction fails
      return {
        width: 0,
        height: 0,
        size: buffer.length,
        format: originalName.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        takenAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate thumbnail from image buffer
   */
  static async generateThumbnail(buffer: Buffer, width: number = 300): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return buffer; // Return original if thumbnail fails
    }
  }

  /**
   * Generate tags based on metadata
   */
  static generateTags(metadata: PhotoMetadata, fileName: string): string[] {
    const tags: string[] = [];
    
    // Add year and month tags
    if (metadata.takenAt) {
      try {
        const date = new Date(metadata.takenAt);
        tags.push(`year-${date.getFullYear()}`);
        tags.push(`month-${date.getMonth() + 1}`);
        
        // Add season tag
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 5) tags.push('season-spring');
        else if (month >= 6 && month <= 8) tags.push('season-summer');
        else if (month >= 9 && month <= 11) tags.push('season-autumn');
        else tags.push('season-winter');
      } catch (error) {
        console.warn('Date tag generation failed:', error);
      }
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

    // Add orientation tag
    if (metadata.width && metadata.height) {
      if (metadata.width > metadata.height) {
        tags.push('orientation-landscape');
      } else if (metadata.height > metadata.width) {
        tags.push('orientation-portrait');
      } else {
        tags.push('orientation-square');
      }
    }

    return tags;
  }

  /**
   * Validate image file
   */
  static isValidImageFile(mimetype: string, originalName: string): boolean {
    const validMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
    
    const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
    
    return validMimeTypes.includes(mimetype.toLowerCase()) && validExtensions.includes(extension);
  }

  /**
   * Calculate distance between coordinates using Haversine formula
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
    return R * c; // Distance in km
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}