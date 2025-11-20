import axios from 'axios';

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${lat},${lng}`,
            key: this.apiKey
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.address_components;
        
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

  private findComponent(components: any[], type: string): string | undefined {
    const component = components.find(c => c.types.includes(type));
    return component?.long_name;
  }
}

export const geocodingService = new GeocodingService();