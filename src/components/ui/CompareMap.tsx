import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-side-by-side'
import { Layers, X } from 'lucide-react'

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
      { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", opacity: 1.0 }
    ]
  },
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    layers: [
      { url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", opacity: 1.0 }
    ]
  },
  terrain: {
    name: 'Terrain',
    icon: '🏔️',
    layers: [
      { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", opacity: 0.9 },
      { url: "https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}", opacity: 0.5 }
    ]
  }
}

interface WMSLayerConfig {
  id: string
  name: string
  url: string
  layers: string
  format: string
  transparent: boolean
  version: string
  zIndex: number
}

interface CompareMapProps {
  leftLayerId?: string | null
  rightLayerId?: string | null
  layersConfig?: readonly WMSLayerConfig[]
  onDisable?: () => void
}

// Default WMS layers configuration
const DEFAULT_WMS_LAYERS: readonly WMSLayerConfig[] = [
  {
    id: 'water_surface_elevation',
    name: 'Water Surface Elevation',
    url: import.meta.env.VITE_GEOSERVER_BASE_URL,
    layers: 'flood-app:rendered_noaa_wse',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 502
  },
  {
    id: 'water_surface_elevation_2nd',
    name: 'Water Surface Elevation 2nd Phase',
    url: import.meta.env.VITE_GEOSERVER_BASE_URL,
    layers: 'flood-app:rendered_noaa_wse_2nd',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 503
  }
] as const

// Legend Component
interface MapLegendProps {
  leftLayerName: string
  rightLayerName: string
}

const MapLegend: React.FC<MapLegendProps> = ({ leftLayerName, rightLayerName }) => (
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
          <p className="font-medium text-sm text-gray-800 truncate">{leftLayerName}</p>
          <p className="text-xs text-gray-600">Left Side</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Right Layer */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-green-500 rounded border border-green-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">{rightLayerName}</p>
          <p className="text-xs text-gray-600">Right Side</p>
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

// Disable Button Component
interface DisableButtonProps {
  onDisable: () => void
}

const DisableButton: React.FC<DisableButtonProps> = ({ onDisable }) => (
  <div className="absolute top-4 right-4 z-[1001]">
    <button
      onClick={onDisable}
      className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 hover:bg-white transition-colors flex items-center gap-2"
      title="Exit Comparison"
    >
      <X className="w-5 h-5 text-gray-700" />
      <span className="text-sm font-medium text-gray-700">Exit Comparison</span>
    </button>
  </div>
)

// Main CompareMap Component
export const CompareMap: React.FC<CompareMapProps> = ({
  leftLayerId = 'water_surface_elevation',
  rightLayerId = 'water_surface_elevation_2nd',
  layersConfig = DEFAULT_WMS_LAYERS,
  onDisable = () => console.log('Comparison disabled')
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const sideBySideRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedLayer] = useState<LayerType>('satellite')

  // Find layer configs
  const leftLayerConfig = layersConfig.find(l => l.id === leftLayerId)
  const rightLayerConfig = layersConfig.find(l => l.id === rightLayerId)

  // Load Leaflet CSS
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  // Initialize side-by-side comparison when data is available
  useEffect(() => {
    if (!leftLayerConfig || !rightLayerConfig || !isMapReady || !mapRef.current) return

    try {
      const map = mapRef.current

      // Create WMS layers dynamically
      const leftLayer = L.tileLayer.wms(leftLayerConfig.url, {
        layers: leftLayerConfig.layers,
        format: leftLayerConfig.format,
        transparent: leftLayerConfig.transparent,
        version: leftLayerConfig.version,
        attribution: '',
        maxZoom: 26,
        minZoom: 1,
        opacity: 1.0,
        zIndex: leftLayerConfig.zIndex,
      })

      const rightLayer = L.tileLayer.wms(rightLayerConfig.url, {
        layers: rightLayerConfig.layers,
        format: rightLayerConfig.format,
        transparent: rightLayerConfig.transparent,
        version: rightLayerConfig.version,
        attribution: '',
        maxZoom: 26,
        minZoom: 1,
        opacity: 1.0,
        zIndex: rightLayerConfig.zIndex,
      })

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

      console.log('✅ CompareMap initialized with side-by-side layers:', {
        left: leftLayerConfig.name,
        right: rightLayerConfig.name
      })

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
  }, [leftLayerConfig, rightLayerConfig, isMapReady])

  // Default center: Norfolk/Moyock area, Virginia
  const center: [number, number] = [36.8443205, -76.2820786]
  const zoom = 12

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
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
            maxZoom={21}
          />
        ))}
      </MapContainer>

      {/* Disable Button */}
      <DisableButton onDisable={onDisable} />

      {/* Legend */}
      {leftLayerConfig && rightLayerConfig && (
        <MapLegend
          leftLayerName={leftLayerConfig.name}
          rightLayerName={rightLayerConfig.name}
        />
      )}
    </div>
  )
}

export default CompareMap
