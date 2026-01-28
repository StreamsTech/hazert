import type { RainfallForecastResponse } from '../types/rainfall'

/**
 * API endpoint for rainfall forecast data
 * Currently using static parameters (Phase 2.1)
 * Future: Will accept dynamic date range parameters (Phase 2.2)
 */
const RAINFALL_API_URL = 'https://api-dev.hazert.utilian.com/weather/precipitation/frames'

/**
 * Fetch rainfall forecast data from the API
 *
 * Phase 2.1 (Current): Static API with hardcoded parameters
 * - Region: Virginia area (lat: 30-45, lon: -95 to -85)
 * - Duration: 72 hours (3 days)
 *
 * Phase 2.2 (Future): Will accept startDate, endDate, region parameters
 *
 * @returns Promise<RainfallForecastResponse> - Rainfall forecast data with metadata, grid, and frames
 */
export const fetchRainfallForecast = async (): Promise<RainfallForecastResponse> => {
  try {
    // Static parameters for Phase 2.1
    const params = new URLSearchParams({
      min_lat: '30',
      max_lat: '45',
      min_lon: '-95',
      max_lon: '-85',
      num_hours: '72', // 3 days
    })

    const url = `${RAINFALL_API_URL}?${params.toString()}`

    console.log('[Rainfall API] Fetching from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Rainfall forecast API failed with status ${response.status}`)
    }

    const data: RainfallForecastResponse = await response.json()

    console.log('[Rainfall API] Success:', {
      totalFrames: data.metadata.total_frames,
      startTime: data.metadata.start_time,
      endTime: data.metadata.end_time,
      unit: data.metadata.unit,
    })

    return data
  } catch (error) {
    console.error('[Rainfall API] Error:', error)
    throw error
  }
}

/**
 * Future implementation (Phase 2.2) - Dynamic date range API
 * This function will replace fetchRainfallForecast when implementing date range selection
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param region - Region identifier (default: 'virginia')
 */
export const fetchRainfallForecastWithDateRange = async (
  startDate: string,
  endDate: string,
  region: string = 'virginia'
): Promise<RainfallForecastResponse> => {
  try {
    const params = new URLSearchParams({
      start_time: startDate,
      end_time: endDate,
      region,
      resolution: '0.25', // 0.25 degree grid spacing
    })

    const url = `${RAINFALL_API_URL}?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Rainfall forecast API failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Rainfall API] Error fetching with date range:', error)
    throw error
  }
}
