import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'

// Layer types configuration (full opacity like current index.tsx)
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
      { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", opacity: 1.0 },
      { url: "https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}", opacity: 0.4 }
    ]
  }
}

export const Route = createFileRoute('/')({
  component: HomePage,
})

const WMS_LAYERS = [
  {
    id: 'raster_data_1',
    name: 'Raster Data 1',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:NorflokDEM10m_Prj1',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 502,
  },
  {
    id: 'raster_data_2',
    name: 'Raster Data 2',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:NorflokDEM10m_Prj2',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 501,
  }
] as const

function LayerController({
  layerVisibility,
  onLayerToggle,
}: {
  layerVisibility: Record<string, boolean>
  onLayerToggle: (layerId: string) => void
}) {
  return (
    <div className="absolute top-4 left-4 bg-white p-3 rounded-md shadow-md z-[1000] min-w-[200px]">
      <h3 className="font-medium mb-2 text-sm text-gray-800">Layers</h3>
      <div className="space-y-2">
        {WMS_LAYERS.map((layer) => (
          <label key={layer.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layerVisibility[layer.id]}
              onChange={() => onLayerToggle(layer.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{layer.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// Base Layer Switcher Component
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

    {/* Leftward Dropdown */}
    <div className="absolute bottom-0 right-16 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
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

function HomePage() {
  return (
    <div className="h-screen w-full">
      <ClientOnly fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <div className="text-lg">Loading map...</div>
        </div>
      }>
        <MapComponent />
      </ClientOnly>
    </div>
  )
}

function MapComponent() {
  // Leaflet components are now imported at the top of the file

  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(
    WMS_LAYERS.reduce(
      (acc, layer) => ({
        ...acc,
        [layer.id]: true, // Both layers checked by default
      }),
      {},
    ),
  )

  // Base layer state management
  const [selectedBaseLayer, setSelectedBaseLayer] = useState<LayerType>('satellite')

  const handleLayerToggle = (layerId: string) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }

  // Load Leaflet CSS on client side
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])
  // Default center: Norfolk/Moyock area, Virginia (matches GeoServer data location)
  const center: [number, number] = [36.8443205, -76.2820786]
  const zoom = 12

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
      >
        {/* Dynamic Base Layers */}
        {LAYER_TYPES[selectedBaseLayer].layers.map((layer, index) => (
          <TileLayer
            key={`${selectedBaseLayer}-${index}`}
            url={layer.url}
            attribution="© Google Maps"
            opacity={layer.opacity}
            maxZoom={20}
          />
        ))}

        {/* WMS Layers */}
        {WMS_LAYERS.map((layer) => 
          layerVisibility[layer.id] ? (
            <WMSTileLayer
              key={layer.id}
              url={layer.url}
              layers={layer.layers}
              format={layer.format}
              transparent={layer.transparent}
              version={layer.version}
              zIndex={layer.zIndex}
            />
          ) : null
        )}

        {/* WMS Layer Controller (top-left) */}
        <LayerController
          layerVisibility={layerVisibility}
          onLayerToggle={handleLayerToggle}
        />

        {/* Base Layer Switcher (bottom-right) */}
        <LayerSwitcher
          selectedLayer={selectedBaseLayer}
          onLayerChange={setSelectedBaseLayer}
        />
      </MapContainer>
    </div>
  )
}