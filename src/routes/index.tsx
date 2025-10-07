import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents } from 'react-leaflet'
import { Layers, X, Download, Table, Pen } from 'lucide-react'
import { useStationClick } from '../hooks/useMapLayers'
import type { StationClickParams, StationClickResponse } from '../types/map'
import { fetchStationWaterLevel } from '../api/stations'

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
    id: 'water_surface_elevation',
    name: 'Water Surface Elevation',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:rendered_noaa_wse',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 502,
  },
  {
    id: 'raster_geo_point',
    name: 'NOAA Predictions',
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

// Pen Mode Toggle Button Component
interface PenModeToggleProps {
  isActive: boolean
  onToggle: () => void
}

const PenModeToggle: React.FC<PenModeToggleProps> = ({ isActive, onToggle }) => (
  <div className="absolute top-20 right-4 z-[1001]">
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

// Floating Tooltip Component
interface PenModeTooltipProps {
  visible: boolean
  position: { x: number; y: number }
  depth: number | null
  isLoading: boolean
}

const PenModeTooltip: React.FC<PenModeTooltipProps> = ({ visible, position, depth, isLoading }) => {
  if (!visible) return null

  return (
    <div
      className="fixed z-[1500] pointer-events-none transition-opacity duration-150"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 min-w-[120px]">
        <div className="text-xs font-medium text-gray-500 mb-1">Water Depth</div>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        ) : depth !== null ? (
          <div className="text-base font-semibold text-gray-900">
            {depth.toFixed(2)} m
          </div>
        ) : (
          <div className="text-sm text-gray-400">No data</div>
        )}
      </div>
    </div>
  )
}

// Bottom Sheet Component
interface StationModalProps {
  data: StationClickResponse
  isVisible: boolean
  onClose: () => void
}

const StationModal: React.FC<StationModalProps> = ({ data, isVisible, onClose }) => {
  if (!data || data.features.length === 0) return null

  const station = data.features[0]
  const stationName = station.properties.station_name
  const stationId = station.properties.station_id

  // Date range state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [viewMode, setViewMode] = useState<'day' | 'week' | '2week'>('day')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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
          console.log('🔄 Fetching water level data:', { stationId, startDate, endDate })
          const response = await fetchStationWaterLevel(stationId, startDate, endDate)
          console.log('✅ Water level data received:', response)
        } catch (error) {
          console.error('❌ Error fetching water level data:', error)
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
    switch (viewMode) {
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
  }, [selectedDate, viewMode])

  // Get today's date for max attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[2000] h-1/2 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="bg-white rounded-t-2xl shadow-2xl h-full overflow-hidden w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b gap-4">
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
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 text-sm font-medium border-x border-gray-300 transition-colors ${
                  viewMode === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('2week')}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === '2week'
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
            <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 text-gray-700" />
            </button>
            <button className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
              <Table className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
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

  // Pen mode state
  const [penModeActive, setPenModeActive] = useState(false)
  const [cursorDepth, setCursorDepth] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isLoadingDepth, setIsLoadingDepth] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  // Refs for pen mode
  const abortControllerRef = useRef<AbortController | null>(null)
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef({ x: 0, y: 0, time: 0 })

  const handleLayerToggle = (layerId: string) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }

  // Get highest z-index DEM raster layer (for pen mode depth queries)
  const getActiveLayer = useCallback(() => {
    // Filter only DEM raster layers (not point layers)
    const demLayers = WMS_LAYERS.filter(layer =>
      layerVisibility[layer.id] &&
      layer.id === 'water_surface_elevation'
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
    layer: typeof WMS_LAYERS[number]
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
      const baseUrl = 'http://202.4.127.189:5459/geoserver/flood-app/wms'

      const response = await fetch(
        `${baseUrl}?${paramsString}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const grayIndex = data.features[0].properties?.GRAY_INDEX
        if (grayIndex !== undefined && grayIndex !== null) {
          setCursorDepth(grayIndex)
        } else {
          setCursorDepth(null)
        }
      } else {
        setCursorDepth(null)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching water depth:', error)
        setCursorDepth(null)
      }
    } finally {
      setIsLoadingDepth(false)
    }
  }, [])

  // Hybrid throttle + debounce handler
  const handlePenModeMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    if (!penModeActive) return

    const activeLayer = getActiveLayer()
    if (!activeLayer) {
      setTooltipVisible(false)
      return
    }

    const map = e.target
    const containerPoint = map.latLngToContainerPoint(e.latlng)

    // Update tooltip position
    setTooltipPosition({ x: e.originalEvent.clientX, y: e.originalEvent.clientY })
    setTooltipVisible(true)

    // Fast movement detection
    const now = Date.now()
    const dx = containerPoint.x - lastPositionRef.current.x
    const dy = containerPoint.y - lastPositionRef.current.y
    const dt = now - lastPositionRef.current.time
    const velocity = Math.sqrt(dx * dx + dy * dy) / (dt || 1)

    lastPositionRef.current = { x: containerPoint.x, y: containerPoint.y, time: now }

    // Skip if moving too fast (>50px in 100ms = velocity > 0.5px/ms)
    if (velocity > 0.5) {
      // Clear throttle timer but keep debounce for final call
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
        throttleTimerRef.current = null
      }
    } else {
      // Throttle: Call every 250ms during slow movement
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null
          fetchWaterDepth(e.latlng, map, activeLayer)
        }, 250)
      }
    }

    // Debounce: Always call after 400ms of inactivity
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchWaterDepth(e.latlng, map, activeLayer)
    }, 400)
  }, [penModeActive, getActiveLayer, fetchWaterDepth])

  // Cleanup on unmount or pen mode toggle
  useEffect(() => {
    if (!penModeActive) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      setTooltipVisible(false)
      setCursorDepth(null)
    }
  }, [penModeActive])

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
        // Skip if pen mode is active
        if (penModeActive) return

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
      },
      mousemove: (e) => {
        handlePenModeMouseMove(e)
      },
      mouseout: () => {
        if (penModeActive) {
          setTooltipVisible(false)
        }
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

        {/* Pen Mode Toggle Button */}
        <PenModeToggle
          isActive={penModeActive}
          onToggle={() => {
            setPenModeActive(!penModeActive)
            if (penModeActive) {
              setCursorDepth(null)
            }
          }}
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

      {/* Pen Mode Tooltip */}
      <PenModeTooltip
        visible={tooltipVisible && penModeActive}
        position={tooltipPosition}
        depth={cursorDepth}
        isLoading={isLoadingDepth}
      />
    </div>
  )
}