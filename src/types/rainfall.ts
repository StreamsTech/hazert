/**
 * Rainfall Forecast Type Definitions
 * API Response models for precipitation/rainfall forecast data
 */

export interface RainfallGrid {
  lat: number[]
  lon: number[]
}

export interface RainfallFrame {
  time: string // ISO 8601 format (e.g., "2026-01-26T02:00:00Z")
  z: number[][] // 2D matrix: z[lat_index][lon_index] - rainfall values in mm/hr
}

export interface RainfallForecastMetadata {
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  total_frames: number
  lat_bounds: [number, number] // [min, max]
  lon_bounds: [number, number] // [min, max]
  unit: 'mm/hr' | 'inches/hr'
}

export interface RainfallForecastResponse {
  metadata: RainfallForecastMetadata
  grid: RainfallGrid
  frames: RainfallFrame[]
}

/**
 * Heatmap Point for leaflet.heat
 * Format: [latitude, longitude, intensity]
 */
export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number // 0-1 normalized value
}

/**
 * Heatmap configuration options
 */
export interface HeatmapOptions {
  radius?: number
  blur?: number
  maxZoom?: number
  max?: number
  gradient?: Record<number, string>
}

/**
 * Date range for rainfall forecast query
 */
export interface RainfallDateRange {
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
}
