import { useQuery } from '@tanstack/react-query'
import type { MapLayersResponse, CompareMapData } from '../types/map'

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