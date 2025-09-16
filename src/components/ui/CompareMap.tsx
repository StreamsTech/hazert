import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-side-by-side'
import { Layers, AlertCircle, Loader2 } from 'lucide-react'
import { useCompareMapData } from '../../hooks/useMapLayers'
import type { MapLayer } from '../../types/map'

// Layer types configuration
type LayerType = 'default' | 'satellite' | 'terrain'

interface LayerConfig {
  name: string
  icon: string
  layers: Array<{
    url: string
    opacity: number
  }>
}

const LAYER_TYPES: Record<LayerType, LayerConfig> = {
  default: {
    name: 'Default',
    icon: '🗺️',
    layers: [
      { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", opacity: 0.3 }
    ]
  },
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    layers: [
      { url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", opacity: 0.3 }
    ]
  },
  terrain: {
    name: 'Terrain',
    icon: '🏔️',
    layers: [
      { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", opacity: 0.3 },
      { url: "https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}", opacity: 0.15 }
    ]
  }
}

// Legend Component
interface MapLegendProps {
  leftLayer: MapLayer
  rightLayer: MapLayer
}

const MapLegend: React.FC<MapLegendProps> = ({ leftLayer, rightLayer }) => (
  <div className="absolute bottom-4 left-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000] min-w-[280px]">
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

// Layer Switcher Component
interface LayerSwitcherProps {
  selectedLayer: LayerType
  onLayerChange: (layer: LayerType) => void
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ selectedLayer, onLayerChange }) => (
  <div className="absolute top-4 right-4 z-[1001] group">
    {/* Layer Icon Button */}
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 cursor-pointer hover:bg-white transition-colors">
      <Layers className="w-5 h-5 text-gray-700" />
    </div>

    {/* Horizontal Dropdown */}
    <div className="absolute top-0 right-16 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-1 min-w-max">
        {(Object.keys(LAYER_TYPES) as LayerType[]).map((layerType) => {
          const layer = LAYER_TYPES[layerType]
          const isSelected = selectedLayer === layerType

          return (
            <button
              key={layerType}
              onClick={() => onLayerChange(layerType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={layer.name}
            >
              <span className="text-lg">{layer.icon}</span>
              <span>{layer.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

const createLeftLayers = () =>{
  return L.tileLayer.wms('http://202.4.127.189:5459/geoserver/wms',
      {
        layers: 'flood-app:NorflokDEM10m_Prj1',
        format: 'image/png',
        transparent: true,
        version:  '1.3.0',
        attribution: '',
        maxZoom: 26,
        minZoom:  1,
        opacity: 1.0,
        zIndex: 502,
      }
  )
}

const createRightLayers = () =>{
  return L.tileLayer.wms('http://202.4.127.189:5459/geoserver/wms',
      {
        layers: 'flood-app:NorflokDEM10m_Prj2',
        format: 'image/png',
        transparent: true,
        version:  '1.3.0',
        attribution: '',
        maxZoom: 26,
        minZoom:  1,
        opacity: 1.0,
        zIndex: 502,
      }
  )
}

// Helper function to create layer based on type
/*const createLeafletLayer = (layer: MapLayer, map?: L.Map): L.TileLayer | L.Layer => {
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
      opacity: layer.opacity || 1.0,
      zIndex: 502,
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
}*/

// Main CompareMap Component
export const CompareMap: React.FC = () => {
  const { data: compareData, isLoading, error, refetch } = useCompareMapData()
  const mapRef = useRef<L.Map | null>(null)
  const sideBySideRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('default')

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
      const leftLayer = createLeftLayers()
      const rightLayer = createRightLayers()

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
        {/* Base layers for context based on selected layer type */}
        {LAYER_TYPES[selectedLayer].layers.map((layer, index) => (
          <TileLayer
            key={`${selectedLayer}-${index}`}
            url={layer.url}
            attribution="© Google Maps"
            opacity={layer.opacity}
            maxZoom={20}
          />
        ))}
      </MapContainer>

      {/* Layer Switcher */}
      <LayerSwitcher
        selectedLayer={selectedLayer}
        onLayerChange={setSelectedLayer}
      />

      {/* Legend */}
      <MapLegend
        leftLayer={compareData.leftLayer}
        rightLayer={compareData.rightLayer}
      />
    </div>
  )
}

export default CompareMap