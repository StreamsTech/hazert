import { useQuery } from '@tanstack/react-query';

// Type for station GeoJSON data
interface StationProperties {
  id: string;
  name: string;
  status: string;
  value: number;
}

interface StationGeometry {
  type: string;
  coordinates: [number, number];
}

interface StationFeature {
  type: string;
  properties: StationProperties;
  geometry: StationGeometry;
}

interface StationsResponse {
  type: string;
  features: StationFeature[];
}

export const useStations = () => {
  return useQuery<StationsResponse>({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await fetch('/api/stations');
      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime is now gcTime in React Query v5)
  });
};