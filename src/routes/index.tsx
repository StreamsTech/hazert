import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, Marker, Popup } from 'react-leaflet'
import { Layers, X, Download, Table, Pen, LineChart } from 'lucide-react'
import { useStationClick } from '../hooks/useMapLayers'
import type { StationClickParams, StationClickResponse, WaterLevelPrediction } from '../types/map'
import { fetchStationWaterLevel } from '../api/stations'
import { WaterLevelChart } from '../components/WaterLevelChart'
import { ComparisonButton } from '../components/ui/ComparisonButton'
import { ComparisonModal } from '../components/ui/ComparisonModal'
import { CompareMap } from '../components/ui/CompareMap'
import { FullscreenControl } from '../components/ui/FullscreenControl'
import { CurrentLocationControl } from '../components/ui/CurrentLocationControl'
import { NotificationControl } from '../components/ui/NotificationControl'
import { ToastNotification } from '../components/ui/ToastNotification'
import L from 'leaflet'

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
// Toggleable layers (appear in LayerController)
const TOGGLEABLE_WMS_LAYERS = [
  {
    id: 'water_surface_elevation',
    name: 'Coastal WSE in 12 hours',
    url: import.meta.env.VITE_GEOSERVER_BASE_URL,
    layers: 'flood-app:rendered_noaa_wse',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 501,
  },
  {
    id: 'water_surface_elevation_second_phase',
    name: 'Coastal WSE in 24 hours',
    url: import.meta.env.VITE_GEOSERVER_BASE_URL,
    layers: 'flood-app:noaa_wse_second',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 501,
  }
] as const

// Always-visible layer (not in LayerController)
const PERMANENT_LAYER = {
  id: 'raster_geo_point',
  name: 'NOAA Predictions',
  url: import.meta.env.VITE_GEOSERVER_BASE_URL,
  layers: 'flood-app:NOAA_Pred_Sts_Prj', // flood-app:noaa_predictions
  format: 'image/png',
  transparent: true,
  version: '1.3.0',
  zIndex: 503,
} as const

function LayerController({
  layerVisibility,
  onLayerToggle,
}: {
  layerVisibility: Record<string, boolean>
  onLayerToggle: (layerId: string) => void
}) {
  // Get currently selected layer
  const selectedLayerId = Object.keys(layerVisibility).find(
    (layerId) => layerVisibility[layerId]
  ) || TOGGLEABLE_WMS_LAYERS[0].id

  return (
    <div
      className="layer-controller-prevent-click absolute bottom-20 left-4 bg-white p-4 rounded-md shadow-md z-[1000] min-w-[220px] min-h-[180px]"
      onClick={(e) => {
        // Stop click propagation to prevent map click handler from firing
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        // Also stop mousedown to prevent any interaction from reaching the map
        e.stopPropagation()
      }}
    >
      <h3 className="font-medium mb-3 text-sm text-gray-800">Layers</h3>
      <select
        value={selectedLayerId}
        onChange={(e) => onLayerToggle(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 cursor-pointer shadow-sm"
      >
        {TOGGLEABLE_WMS_LAYERS.map((layer) => (
          <option key={layer.id} value={layer.id}>
            {layer.name}
          </option>
        ))}
      </select>
    </div>
  )
}

// Base Layer Switcher Component
interface LayerSwitcherProps {
  selectedLayer: LayerType
  onLayerChange: (layer: LayerType) => void
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ selectedLayer, onLayerChange }) => (
  <div
    className="layer-switcher-prevent-click absolute top-4 right-4 z-[1001] group"
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
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

// Pen Mode Toggle Button Component
interface PenModeToggleProps {
  isActive: boolean
  onToggle: () => void
}

const PenModeToggle: React.FC<PenModeToggleProps> = ({ isActive, onToggle }) => (
  <div
    className="pen-toggle-prevent-click absolute top-20 right-4 z-[1001]"
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <button
      onClick={onToggle}
      className={`backdrop-blur-sm rounded-lg shadow-lg p-3 transition-all duration-200 ${
        isActive
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-white/95 hover:bg-white text-gray-700'
      }`}
      title={isActive ? 'Disable Pen Mode' : 'Enable Pen Mode'}
    >
      <Pen className="w-5 h-5" />
    </button>
  </div>
)


// Bottom Sheet Component
interface StationModalProps {
  data: StationClickResponse
  isVisible: boolean
  onClose: () => void
}

const StationModal: React.FC<StationModalProps> = ({ data, isVisible, onClose }) => {
  if (!data || data.features.length === 0) return null

  const station = data.features[0]
  const stationName = station.properties.Station
  const stationId = station.properties.StationID

  // Date range state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dateViewMode, setDateViewMode] = useState<'day' | 'week' | '2week'>('day')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Water level chart data state
  const [waterLevelData, setWaterLevelData] = useState<WaterLevelPrediction[]>([])
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [chartError, setChartError] = useState<Error | null>(null)

  // View mode state (chart or table)
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  // Download CSV handler
  const handleDownloadCSV = () => {
    if (waterLevelData.length === 0) {
      alert('No data available to download')
      return
    }

    // Create CSV header
    const csvHeader = 'Time,Water Level (v),NAVD (v_navd),Datum,Type\n'

    // Create CSV rows
    const csvRows = waterLevelData.map(prediction => {
      return `${prediction.t},${prediction.v},${prediction.v_navd},${prediction.used_datum},${prediction.type}`
    }).join('\n')

    // Combine header and rows
    const csvContent = csvHeader + csvRows

    // Create Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // Set filename with station info and date range
    const filename = `station_${stationId}_${startDate}_to_${endDate}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Auto-select today's date when bottom sheet opens
  useEffect(() => {
    if (isVisible && !selectedDate) {
      const today = new Date().toISOString().split('T')[0]
      setSelectedDate(today)
    }
  }, [isVisible, selectedDate])

  // Fetch water level data when date range changes
  useEffect(() => {
    const fetchData = async () => {
      if (isVisible && stationId && startDate && endDate) {
        try {
          setIsChartLoading(true)
          setChartError(null)
          console.log('🔄 Fetching water level data:', { stationId, startDate, endDate })
          const response = await fetchStationWaterLevel(stationId, startDate, endDate)
          console.log('✅ Water level data received:', response)

          // Extract predictions for the selected station
          const stationData = response.saved_files[stationId]
          if (stationData && stationData.predictions) {
            setWaterLevelData(stationData.predictions)
          } else {
            setWaterLevelData([])
          }
        } catch (error) {
          console.error('❌ Error fetching water level data:', error)
          setChartError(error as Error)
          setWaterLevelData([])
        } finally {
          setIsChartLoading(false)
        }
      }
    }

    fetchData()
  }, [isVisible, stationId, startDate, endDate])

  // Calculate date range based on selected date and view mode
  useEffect(() => {
    if (!selectedDate) {
      setStartDate('')
      setEndDate('')
      return
    }

    const start = new Date(selectedDate)
    setStartDate(selectedDate)

    const end = new Date(start)
    switch (dateViewMode) {
      case 'day':
        end.setDate(end.getDate() + 1)
        break
      case 'week':
        end.setDate(end.getDate() + 7)
        break
      case '2week':
        end.setDate(end.getDate() + 14)
        break
    }
    setEndDate(end.toISOString().split('T')[0])
  }, [selectedDate, dateViewMode])

  // Get today's date for max attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[2000] h-1/2 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="bg-white rounded-t-2xl shadow-2xl h-full overflow-hidden w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b gap-4 flex-shrink-0">
          {/* Left: Station Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{stationName}</h2>
              <p className="text-sm text-gray-600">Station ID: {stationId}</p>
            </div>
          </div>

          {/* Middle: Date Range Controls */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {/* Selectable Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min="2010-01-01"
              max={today}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* View Mode Buttons */}
            <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setDateViewMode('day')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  dateViewMode === 'day'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setDateViewMode('week')}
                className={`px-4 py-1.5 text-sm font-medium border-x border-gray-300 transition-colors ${
                  dateViewMode === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDateViewMode('2week')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  dateViewMode === '2week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                2 Week
              </button>
            </div>

            {/* Read-only Date Range Display */}
            <input
              type="date"
              value={startDate}
              readOnly
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              readOnly
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="End Date"
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadCSV}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              title={viewMode === 'chart' ? 'Show Table View' : 'Show Chart View'}
            >
              {viewMode === 'chart' ? (
                <Table className="w-4 h-4 text-gray-700" />
              ) : (
                <LineChart className="w-4 h-4 text-gray-700" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Data Body - Table and Chart */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 min-h-0">
          {viewMode === 'table' ? (
            /* Data Table */
            <div>
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
                    {waterLevelData.map((prediction, index) => (
                      <tr key={prediction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{prediction.t}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prediction.v}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prediction.v_navd}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prediction.used_datum}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prediction.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Water Level Chart */
            <div>
              <WaterLevelChart
                data={waterLevelData}
                title={`Water Level Chart - ${stationName}`}
                loading={isChartLoading}
                stationId={stationId}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-2 px-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Last Seen: {data.timeStamp}</span>
            <span>{waterLevelData.length} records found</span>
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
    TOGGLEABLE_WMS_LAYERS.reduce(
      (acc, layer, index) => ({
        ...acc,
        [layer.id]: index === 0, // Only first layer visible by default
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

  // Pen mode state
  const [penModeActive, setPenModeActive] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null)
  const [markerDepth, setMarkerDepth] = useState<number | null>(null)
  const [isLoadingDepth, setIsLoadingDepth] = useState(false)

  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonLeftLayer, setComparisonLeftLayer] = useState<string | null>(null)
  const [comparisonRightLayer, setComparisonRightLayer] = useState<string | null>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  // Notification toast state
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [toastMessage, setToastMessage] = useState('')

  // Refs for pen mode
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleLayerToggle = (layerId: string) => {
    // Prevent deselecting the currently active layer
    if (layerVisibility[layerId]) return

    // Radio button behavior: only one layer visible at a time
    setLayerVisibility((prev) => {
      const newState: Record<string, boolean> = {}
      for (const key of Object.keys(prev)) {
        newState[key] = key === layerId
      }
      return newState
    })
  }

  // Handle comparison enable
  const handleComparisonEnable = (leftLayerId: string, rightLayerId: string) => {
    setComparisonLeftLayer(leftLayerId)
    setComparisonRightLayer(rightLayerId)
    setComparisonMode(true)
    console.log('✅ Comparison mode enabled:', { leftLayerId, rightLayerId })
  }

  // Handle comparison disable
  const handleComparisonDisable = () => {
    setComparisonMode(false)
    setComparisonLeftLayer(null)
    setComparisonRightLayer(null)
    console.log('🚫 Comparison mode disabled')
  }

  // Handle notification sent
  const handleNotificationSent = (success: boolean, message: string) => {
    setToastType(success ? 'success' : 'error')
    setToastMessage(message)
    setShowToast(true)
  }

  // Get highest z-index DEM raster layer (for pen mode depth queries)
  const getActiveLayer = useCallback(() => {
    // Filter only visible DEM raster layers (not point layers)
    const demLayers = TOGGLEABLE_WMS_LAYERS.filter(layer =>
      layerVisibility[layer.id]
    )
    if (demLayers.length === 0) return null
    // Return highest z-index DEM layer
    return demLayers.reduce((highest, current) =>
      current.zIndex > highest.zIndex ? current : highest
    )
  }, [layerVisibility])

  // Fetch water depth from GetFeatureInfo API
  const fetchWaterDepth = useCallback(async (
    latlng: L.LatLng,
    map: L.Map,
    layer: typeof TOGGLEABLE_WMS_LAYERS[number]
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setIsLoadingDepth(true)

      // Get map bounds and size (already in EPSG:4326)
      const bounds = map.getBounds()
      const mapSize = map.getSize()

      // Calculate pixel size in degrees (EPSG:4326)
      const degPerPixelX = (bounds.getEast() - bounds.getWest()) / mapSize.x
      const degPerPixelY = (bounds.getNorth() - bounds.getSouth()) / mapSize.y

      // Create a 101x101 pixel BBOX centered on cursor position
      const halfSize = 50 // 50 pixels on each side = 101 total
      const halfWidthDeg = halfSize * degPerPixelX
      const halfHeightDeg = halfSize * degPerPixelY

      // Build BBOX in EPSG:4326 (minX, minY, maxX, maxY) = (west, south, east, north)
      const bboxMinX = latlng.lng - halfWidthDeg
      const bboxMinY = latlng.lat - halfHeightDeg
      const bboxMaxX = latlng.lng + halfWidthDeg
      const bboxMaxY = latlng.lat + halfHeightDeg

      const bbox = `${bboxMinX},${bboxMinY},${bboxMaxX},${bboxMaxY}`

      // Debug logging
      console.log('🎯 Pen Mode Debug:', {
        cursor: { lat: latlng.lat, lng: latlng.lng },
        bbox,
        bboxParsed: { west: bboxMinX, south: bboxMinY, east: bboxMaxX, north: bboxMaxY },
        pixelSize: { degPerPixelX, degPerPixelY },
        layer: layer.layers
      })

      // Build params matching the working example format
      const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetFeatureInfo',
        FORMAT: 'image/jpeg',
        TRANSPARENT: 'true',
        QUERY_LAYERS: layer.layers,
        LAYERS: layer.layers,
        exceptions: 'application/vnd.ogc.se_inimage',
        INFO_FORMAT: 'application/json',
        FEATURE_COUNT: '50',
        X: '50', // Center of 101x101 box
        Y: '50', // Center of 101x101 box
        SRS: 'EPSG:4326',
        WIDTH: '101',
        HEIGHT: '101',
        BBOX: bbox,
      })

      // Add STYLES parameter without value (matching template)
      const paramsString = params.toString() + '&STYLES'

      // Use correct base URL with /flood-app/ workspace
      const baseUrl = `${import.meta.env.VITE_GEOSERVER_BASE_URL.replace('/wms', '')}/flood-app/wms`

      const response = await fetch(
        `${baseUrl}?${paramsString}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const grayIndex = data.features[0].properties?.GRAY_INDEX
        if (grayIndex !== undefined && grayIndex !== null) {
          setMarkerDepth(grayIndex)
        } else {
          setMarkerDepth(null)
        }
      } else {
        setMarkerDepth(null)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching water depth:', error)
        setMarkerDepth(null)
      }
    } finally {
      setIsLoadingDepth(false)
    }
  }, [])

  // Handle pen mode click
  const handlePenModeClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!penModeActive) return

    console.log('🖱️ Pen mode click detected:', { lat: e.latlng.lat, lng: e.latlng.lng })

    const activeLayer = getActiveLayer()
    if (!activeLayer) {
      console.log('⚠️ No active layer found for pen mode')
      return
    }

    console.log('✅ Active layer:', activeLayer.name)

    const map = e.target

    // Set marker position
    setMarkerPosition(e.latlng)
    setMarkerDepth(null) // Reset depth when placing new marker

    // Fetch water depth
    fetchWaterDepth(e.latlng, map, activeLayer)
  }, [penModeActive, getActiveLayer, fetchWaterDepth])

  // Cleanup on unmount or pen mode toggle
  useEffect(() => {
    if (!penModeActive) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setMarkerPosition(null)
      setMarkerDepth(null)
    }
  }, [penModeActive])

  // Create custom pin icon
  const [pinIconInstance, setPinIconInstance] = useState<L.Icon | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const icon = L.icon({
        iconUrl: '/images/pin.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })
      setPinIconInstance(icon)
    }
  }, [])

  // Use the station click hook (only enabled when clickParams exists)
  const { data: stationData, isLoading, error } = useStationClick(clickParams, !!clickParams)

  // Handle successful station data fetch
  useEffect(() => {
    if (stationData && !isLoading) {
      setSelectedStation(stationData)
      setModalVisible(true)
      setClickParams(null) // Reset click params after success
    }
  }, [stationData, isLoading])

  // Reset clickParams on error to prevent re-querying
  useEffect(() => {
    if (error && !isLoading) {
      console.log('❌ Station query error, resetting clickParams:', error.message)
      setClickParams(null)
    }
  }, [error, isLoading])

  // Map click event component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        // Check if click originated from UI control
        const target = e.originalEvent?.target as HTMLElement
        if (target) {
          const clickedOnControl =
            target.closest('.layer-controller-prevent-click') ||
            target.closest('.layer-switcher-prevent-click') ||
            target.closest('.pen-toggle-prevent-click')

          if (clickedOnControl) {
            console.log('🚫 Click on UI control detected, ignoring map click')
            return
          }
        }

        console.log('✅ Valid map click detected')

        // Handle pen mode click
        if (penModeActive) {
          handlePenModeClick(e)
          return
        }

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
          layers: 'flood-app:NOAA_Pred_Sts_Prj'
        }

        console.log('📍 Setting click params for station query:', params)
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
    <div className={`w-full relative transition-all duration-300 ${
      modalVisible ? 'h-1/2' : 'h-full'
    }`}>
      {/* Conditional Rendering: Comparison Mode vs Normal Map */}
      {comparisonMode ? (
        // Comparison Mode: Show CompareMap
        <CompareMap
          leftLayerId={comparisonLeftLayer}
          rightLayerId={comparisonRightLayer}
          layersConfig={TOGGLEABLE_WMS_LAYERS}
          onDisable={handleComparisonDisable}
        />
      ) : (
        // Normal Mode: Show MapContainer with all controls
        <MapContainer
          center={center}
          zoom={zoom}
          className={`h-full w-full ${penModeActive ? 'cursor-crosshair' : ''}`}
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

          {/* Toggleable WMS Layers */}
          {TOGGLEABLE_WMS_LAYERS.map((layer) =>
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

          {/* Permanent Layer (Always Visible) */}
          <WMSTileLayer
            key={PERMANENT_LAYER.id}
            url={PERMANENT_LAYER.url}
            layers={PERMANENT_LAYER.layers}
            format={PERMANENT_LAYER.format}
            transparent={PERMANENT_LAYER.transparent}
            version={PERMANENT_LAYER.version}
            zIndex={PERMANENT_LAYER.zIndex}
          />

          {/* Map Click Handler */}
          <MapClickHandler />

          {/* WMS Layer Controller (top-left) */}
          <LayerController
            layerVisibility={layerVisibility}
            onLayerToggle={handleLayerToggle}
          />

          {/* Base Layer Switcher (bottom-right) - Hidden in comparison mode */}
          <LayerSwitcher
            selectedLayer={selectedBaseLayer}
            onLayerChange={setSelectedBaseLayer}
          />

          {/* Pen Mode Toggle Button */}
          <PenModeToggle
            isActive={penModeActive}
            onToggle={() => {
              setPenModeActive(!penModeActive)
              if (penModeActive) {
                setMarkerDepth(null)
              }
            }}
          />

          {/* Comparison Button - Below Layer Controller */}
          <ComparisonButton onClick={() => setShowComparisonModal(true)} />

          {/* Pen Mode Marker */}
          {penModeActive && markerPosition && pinIconInstance && (
            <Marker
              position={markerPosition}
              icon={pinIconInstance}
              eventHandlers={{
                add: (e) => {
                  // Open popup when marker is added
                  e.target.openPopup()
                }
              }}
            >
              <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                <div className="text-center min-w-[100px]">
                  <div className="text-xs font-medium text-gray-500 mb-1">Water Depth</div>
                  {isLoadingDepth ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  ) : markerDepth !== null ? (
                    <div className="text-base font-semibold text-gray-900">
                      {markerDepth.toFixed(2)} feet
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No data</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Current Location Control - Go to current location (positioned below Fullscreen button) */}
          <CurrentLocationControl />

          {/* Notification Control - Send notification to all users (positioned below Current Location button) */}
          <NotificationControl onNotificationSent={handleNotificationSent} />
        </MapContainer>
      )}

      {/* Fullscreen Control - Toggle fullscreen mode (positioned below Comparison button) */}
      {!comparisonMode && <FullscreenControl />}

      {/* Comparison Modal */}
      <ComparisonModal
        visible={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onEnable={handleComparisonEnable}
        layers={TOGGLEABLE_WMS_LAYERS}
      />

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

      {/* Error indicator - Only show for actual API errors, not "no station found" */}
      {error && !isLoading && error.message !== 'NO_STATION_FOUND' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1500]">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Error:</span>
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <ToastNotification
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

    </div>
  )
}