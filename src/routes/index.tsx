import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents } from 'react-leaflet'
import { Layers, X } from 'lucide-react'
import { useStationClick } from '../hooks/useMapLayers'
import type { StationClickParams, StationClickResponse } from '../types/map'

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
    zIndex: 501,
  },
  {
    id: 'raster_data_2',
    name: 'Raster Data 2',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:NorflokDEM10m_Prj2',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 502,
  },
  {
    id: 'raster_geo_point',
    name: 'Raster Geo Point',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:noaa_predictions',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 503,
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

// Station Modal Component
interface StationModalProps {
  data: StationClickResponse
  isVisible: boolean
  onClose: () => void
}

const StationModal: React.FC<StationModalProps> = ({ data, isVisible, onClose }) => {
  if (!isVisible || !data || data.features.length === 0) return null

  const station = data.features[0]
  const stationName = station.properties.station_name
  const stationId = station.properties.station_id

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{stationName}</h2>
              <p className="text-sm text-gray-600">Station ID: {stationId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Data Table */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Water Level (v)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">NAVD (v_navd)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.features.map((feature, index) => (
                  <tr key={feature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">{feature.properties.time}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{feature.properties.v}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{feature.properties.v_navd}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{feature.properties.used_datum}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{feature.properties.pred_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Last Seen: {data.timeStamp}</span>
            <span>{data.features.length} records found</span>
          </div>
        </div>
      </div>
    </div>
  )
}

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

  // Modal and station click state
  const [clickParams, setClickParams] = useState<StationClickParams | null>(null)
  const [selectedStation, setSelectedStation] = useState<StationClickResponse | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const handleLayerToggle = (layerId: string) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }

  // Use the station click hook
  const { data: stationData, isLoading, error } = useStationClick(clickParams, !!clickParams)

  // Handle successful station data fetch
  useEffect(() => {
    if (stationData && !isLoading) {
      setSelectedStation(stationData)
      setModalVisible(true)
      setClickParams(null) // Reset click params
    }
  }, [stationData, isLoading])

  // Map click event component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        // Only handle clicks if the point layer is visible
        if (!layerVisibility['raster_geo_point']) return

        const map = e.target
        const size = map.getSize()
        const bounds = map.getBounds()

        // Convert click coordinates to pixel coordinates
        const containerPoint = map.latLngToContainerPoint(e.latlng)

        // Build GetFeatureInfo parameters
        const params: StationClickParams = {
          x: Math.round(containerPoint.x),
          y: Math.round(containerPoint.y),
          width: size.x,
          height: size.y,
          bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
          layers: 'flood-app:noaa_predictions'
        }

        setClickParams(params)
      }
    })
    return null
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

        {/* Map Click Handler */}
        <MapClickHandler />

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

      {/* Station Modal */}
      {selectedStation && (
        <StationModal
          data={selectedStation}
          isVisible={modalVisible}
          onClose={() => {
            setModalVisible(false)
            setSelectedStation(null)
          }}
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1500]">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Loading station data...</span>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && !isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1500]">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Error:</span>
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}