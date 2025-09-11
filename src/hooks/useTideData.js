import { useQuery } from '@tanstack/react-query';

export const useTideData = (stationId, options = {}) => {
  return useQuery({
    queryKey: ['tides', stationId, options.days || 7],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: options.days || 7
      });
      
      const response = await fetch(`/api/stations/${stationId}/tides?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tide data for station ${stationId}`);
      }
      return response.json();
    },
    enabled: !!stationId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 404s
      if (error.message.includes('404')) return false;
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};