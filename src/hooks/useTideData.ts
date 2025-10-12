import { useQuery } from '@tanstack/react-query';

// Type definitions for tide data
interface TideDataPoint {
  time: string;
  value: number;
  type: 'historical' | 'predicted';
}

interface TideDataResponse {
  stationId: string;
  data: TideDataPoint[];
}

interface UseTideDataOptions {
  days?: number;
  enabled?: boolean;
}

export const useTideData = (stationId: string | null, options: UseTideDataOptions = {}) => {
  return useQuery<TideDataResponse>({
    queryKey: ['tides', stationId, options.days || 7],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: String(options.days || 7)
      });

      const response = await fetch(`/api/stations/${stationId}/tides?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tide data for station ${stationId}`);
      }
      return response.json();
    },
    enabled: !!stationId && (options.enabled !== false),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 404s
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};