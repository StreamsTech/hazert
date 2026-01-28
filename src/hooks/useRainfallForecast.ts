import { useQuery } from '@tanstack/react-query'
import { fetchRainfallForecast } from '../api/rainfall'
import type { RainfallForecastResponse } from '../types/rainfall'

/**
 * React Query hook for fetching rainfall forecast data
 *
 * Phase 2.1 (Current): Fetches static 72-hour forecast
 * Phase 2.2 (Future): Will accept date range parameters
 *
 * @param enabled - Whether to enable the query (default: true)
 * @returns React Query result with rainfall forecast data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useRainfallForecast()
 *
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 * if (data) return <RainfallMap data={data} />
 * ```
 */
export function useRainfallForecast(enabled: boolean = true) {
  return useQuery<RainfallForecastResponse>({
    queryKey: ['rainfallForecast', 'static'], // 'static' indicates Phase 2.1 static API
    queryFn: async () => {
      return fetchRainfallForecast()
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - Avoid refetch on mode re-entry
    gcTime: 20 * 60 * 1000, // 20 minutes (formerly cacheTime) - Keep in memory for repeat views
    retry: 1, // Retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
  })
}

/**
 * Future implementation (Phase 2.2) - Dynamic date range hook
 * This hook will be used when implementing date range selection modal
 *
 * @param startDate - Start date in YYYY-MM-DD format (null = disabled)
 * @param endDate - End date in YYYY-MM-DD format (null = disabled)
 * @param enabled - Whether to enable the query
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRainfallForecastWithDateRange(
 *   '2026-01-26',
 *   '2026-01-29',
 *   true
 * )
 * ```
 */
/*
export function useRainfallForecastWithDateRange(
  startDate: string | null,
  endDate: string | null,
  enabled: boolean = true
) {
  return useQuery<RainfallForecastResponse>({
    queryKey: ['rainfallForecast', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required')
      }
      return fetchRainfallForecastWithDateRange(startDate, endDate)
    },
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
    retryDelay: 2000,
  })
}
*/
