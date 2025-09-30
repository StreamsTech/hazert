import { useQuery } from '@tanstack/react-query'
import type { MapLayersResponse, CompareMapData, StationClickResponse, StationClickParams } from '../types/map'

// Hook to fetch all available map layers
export function useMapLayers() {
  return useQuery<MapLayersResponse>({
    queryKey: ['mapLayers'],
    queryFn: async () => {
      const response = await fetch('/api/map-layers')
      if (!response.ok) {
        throw new Error('Failed to fetch map layers')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to fetch comparison map data (left and right layers with positioning)
export function useCompareMapData() {
  return useQuery<CompareMapData>({
    queryKey: ['compareMapData'],
    queryFn: async () => {
      const response = await fetch('/api/map-layers/compare')
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('MSW service worker not ready - please refresh the page')
        }
        throw new Error(`Failed to fetch comparison map data (${response.status})`)
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Increased to 5 minutes
    gcTime: 10 * 60 * 1000, // Increased to 10 minutes
    retry: (failureCount, error) => {
      // Don't retry 404s from MSW issues
      if (error?.message?.includes('MSW service worker')) return false
      return failureCount < 2
    },
    retryDelay: 2000, // 2 second delay between retries
  })
}

// Hook to fetch a specific layer by ID (for future API expansion)
export function useMapLayer(layerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['mapLayer', layerId],
    queryFn: async () => {
      const response = await fetch(`/api/map-layers/${layerId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch map layer: ${layerId}`)
      }
      return response.json()
    },
    enabled: enabled && !!layerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to fetch station data from GeoServer GetFeatureInfo
export function useStationClick(clickParams: StationClickParams | null, enabled: boolean = true) {
  return useQuery<StationClickResponse>({
    queryKey: ['stationClick', clickParams],
    queryFn: async () => {
      if (!clickParams) throw new Error('No click parameters provided')

      const url = new URL('http://202.4.127.189:5459/geoserver/flood-app/wms')
      url.searchParams.set('SERVICE', 'WMS')
      url.searchParams.set('VERSION', '1.1.1')
      url.searchParams.set('REQUEST', 'GetFeatureInfo')
      url.searchParams.set('FORMAT', 'image/png')
      url.searchParams.set('TRANSPARENT', 'true')
      url.searchParams.set('QUERY_LAYERS', clickParams.layers)
      url.searchParams.set('LAYERS', clickParams.layers)
      url.searchParams.set('exceptions', 'application/vnd.ogc.se_inimage')
      url.searchParams.set('INFO_FORMAT', 'application/json')
      url.searchParams.set('FEATURE_COUNT', '50')
      url.searchParams.set('X', clickParams.x.toString())
      url.searchParams.set('Y', clickParams.y.toString())
      url.searchParams.set('SRS', 'EPSG:4326')
      url.searchParams.set('WIDTH', clickParams.width.toString())
      url.searchParams.set('HEIGHT', clickParams.height.toString())
      url.searchParams.set('BBOX', clickParams.bbox)

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`GetFeatureInfo request failed: ${response.status}`)
      }

      const data = await response.json()

      // Check if we got any features
      if (!data.features || data.features.length === 0) {
        throw new Error('No station data found at this location')
      }

      return data
    },
    enabled: enabled && !!clickParams,
    staleTime: 0, // Don't cache click results
    gcTime: 1 * 60 * 1000, // Keep for 1 minute
    retry: (failureCount, error) => {
      // Don't retry if no features found
      if (error?.message?.includes('No station data found')) return false
      return failureCount < 2
    },
    retryDelay: 1000,
  })
}