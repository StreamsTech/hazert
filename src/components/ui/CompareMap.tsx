import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-side-by-side'
import { Layers, AlertCircle, Loader2 } from 'lucide-react'
import { useCompareMapData } from '../../hooks/useMapLayers'
import type { MapLayer } from '../../types/map'

// Legend Component
interface MapLegendProps {
  leftLayer: MapLayer
  rightLayer: MapLayer
}

const MapLegend: React.FC<MapLegendProps> = ({ leftLayer, rightLayer }) => (
  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000] min-w-[280px]">
    <div className="flex items-center gap-2 mb-3">
      <Layers className="w-5 h-5 text-blue-600" />
      <h3 className="font-semibold text-gray-800">Layer Comparison</h3>
    </div>
    
    <div className="space-y-3">
      {/* Left Layer */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">{leftLayer.name}</p>
          <p className="text-xs text-gray-600 truncate">{leftLayer.description}</p>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-200" />
      
      {/* Right Layer */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-green-500 rounded border border-green-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">{rightLayer.name}</p>
          <p className="text-xs text-gray-600 truncate">{rightLayer.description}</p>
        </div>
      </div>
    </div>
    
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500">
        Drag the slider to compare layers
      </p>
    </div>
  </div>
)

// Loading Component
const MapLoading: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[1000]">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
      <p className="text-gray-700 font-medium">Loading comparison layers...</p>
      <p className="text-sm text-gray-500 mt-1">Preparing side-by-side view</p>
    </div>
  </div>
)

// Error Component
interface MapErrorProps {
  message: string
  onRetry?: () => void
}

const MapError: React.FC<MapErrorProps> = ({ message, onRetry }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-[1000]">
    <div className="text-center max-w-md px-6">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Map</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
)

// Helper function to create layer based on type
const createLeafletLayer = (layer: MapLayer, map?: L.Map): L.TileLayer | L.Layer => {
  if (layer.layers) {
    // WMS Layer
    return L.tileLayer.wms(layer.url, {
      layers: layer.layers,
      format: layer.format || 'image/png',
      transparent: layer.transparent || true,
      version: layer.version || '1.1.1',
      attribution: layer.attribution || '',
      maxZoom: layer.maxZoom || 18,
      minZoom: layer.minZoom || 1,
      opacity: layer.opacity || 1.0
    })
  } else {
    // Regular tile layer
    return L.tileLayer(layer.url, {
      attribution: layer.attribution || '',
      maxZoom: layer.maxZoom || 18,
      minZoom: layer.minZoom || 1,
      opacity: layer.opacity || 1.0
    })
  }
}

// Main CompareMap Component
export const CompareMap: React.FC = () => {
  const { data: compareData, isLoading, error, refetch } = useCompareMapData()
  const mapRef = useRef<L.Map | null>(null)
  const sideBySideRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // Load Leaflet CSS
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  // Initialize side-by-side comparison when data is available
  useEffect(() => {
    if (!compareData || !isMapReady || !mapRef.current) return

    try {
      const map = mapRef.current

      // Create layers
      const leftLayer = createLeafletLayer(compareData.leftLayer, map)
      const rightLayer = createLeafletLayer(compareData.rightLayer, map)

      // Add layers to map
      leftLayer.addTo(map)
      rightLayer.addTo(map)

      // Initialize side-by-side control
      const sideBySide = (L.control as any).sideBySide(leftLayer, rightLayer, {
        thumbSize: 42,
        padding: 0
      })

      sideBySide.addTo(map)
      sideBySideRef.current = sideBySide

      // Set map view
      map.setView(compareData.center, compareData.zoom)

      console.log('=� CompareMap initialized with side-by-side layers')

    } catch (err) {
      console.error('Error initializing side-by-side comparison:', err)
    }

    // Cleanup function
    return () => {
      if (sideBySideRef.current && mapRef.current) {
        try {
          mapRef.current.removeControl(sideBySideRef.current)
          sideBySideRef.current = null
        } catch (err) {
          console.warn('Error cleaning up side-by-side control:', err)
        }
      }
    }
  }, [compareData, isMapReady])

  // Handle loading state
  if (isLoading) {
    return (
      <div className="relative h-screen w-full">
        <MapLoading />
      </div>
    )
  }

  // Handle error state
  if (error || !compareData) {
    return (
      <div className="relative h-screen w-full">
        <MapError
          message={error?.message || 'Unable to load comparison data'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={compareData.center}
        zoom={compareData.zoom}
        className="h-full w-full"
        zoomControl={true}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance
            setIsMapReady(true)
          }
        }}
        whenReady={() => setIsMapReady(true)}
      >
        {/* Base layer for context (optional) */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="� OpenStreetMap contributors"
          opacity={0.3}
        />
      </MapContainer>

      {/* Legend */}
      <MapLegend
        leftLayer={compareData.leftLayer}
        rightLayer={compareData.rightLayer}
      />
    </div>
  )
}

export default CompareMap