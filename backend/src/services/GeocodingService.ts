import axios from 'axios';

// Service for converting GPS coordinates to addresses (reverse geocoding)
export class GeocodingService {
  private apiKey: string;

  constructor() {
    // Get Google Maps API key from environment
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  }

  // Convert GPS coordinates (latitude, longitude) to address
  async reverseGeocode(lat: number, lng: number) {
    try {
      // Call Google Maps Geocoding API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${lat},${lng}`,
            key: this.apiKey
          }
        }
      );

      // Extract address components from API response
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.address_components;
        
        // Return formatted address with city and country
        return {
          address: result.formatted_address,
          city: this.findComponent(components, 'locality'),
          country: this.findComponent(components, 'country')
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Helper method to find address component by type
  private findComponent(components: any[], type: string): string | undefined {
    const component = components.find(c => c.types.includes(type));
    return component?.long_name;
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();