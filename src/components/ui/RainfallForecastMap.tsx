import React, { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet'
import L from 'leaflet'
import { X, Loader2 } from 'lucide-react'
import { useRainfallForecast } from '../../hooks/useRainfallForecast'
import { RainfallLegend } from './RainfallLegend'
import { RainfallTimeControl } from './RainfallTimeControl'
import type { RainfallFrame, RainfallGrid, RainfallForecastMetadata } from '../../types/rainfall'

interface RainfallForecastMapProps {
  onDisable?: () => void
}

/**
 * Rainfall Forecast Map Component
 * Main visualization component for animated rainfall grid
 *
 * Features:
 * - Fetches 72-hour rainfall forecast data
 * - Renders rainfall as 25km × 25km square grid cells (matching 0.25° grid spacing)
 * - Provides playback controls (play/pause, speed, scrubbing)
 * - Displays continuous gradient legend
 * - Handles loading and error states
 *
 * Data Flow:
 * 1. Fetch data using useRainfallForecast hook
 * 2. Create grid of rectangles for each data point
 * 3. Map rainfall values to colors using gradient
 * 4. Update rectangle colors on frame change
 * 5. Animate through frames based on playback controls
 */

// Map rainfall value to color using gradient interpolation
const getColorForRainfall = (value: number, maxValue: number): string => {
  // Gradient color stops (same as before)
  const gradientStops = [
    { position: 0.00, color: '#30123b' }, // very dark purple
    { position: 0.07, color: '#4145ab' }, // deep blue
    { position: 0.14, color: '#4675ed' }, // blue
    { position: 0.21, color: '#39a2fc' }, // light blue
    { position: 0.29, color: '#1bcfd4' }, // cyan
    { position: 0.36, color: '#24eca6' }, // green-cyan
    { position: 0.43, color: '#61fc6c' }, // green
    { position: 0.50, color: '#a4fc3b' }, // yellow-green / lime
    { position: 0.57, color: '#d1e834' }, // yellow
    { position: 0.64, color: '#f3c63a' }, // gold
    { position: 0.71, color: '#fe9b2d' }, // orange
    { position: 0.79, color: '#f36315' }, // deep orange
    { position: 0.86, color: '#d93806' }, // red-orange
    { position: 0.93, color: '#b11901' }, // dark red
    { position: 1.00, color: '#7a0402' }  // very dark red
  ]

  // Normalize value to 0-1 range
  const normalized = Math.min(value / maxValue, 1.0)

  // Find the two stops to interpolate between
  let lowerStop = gradientStops[0]
  let upperStop = gradientStops[gradientStops.length - 1]

  for (let i = 0; i < gradientStops.length - 1; i++) {
    if (normalized >= gradientStops[i].position && normalized <= gradientStops[i + 1].position) {
      lowerStop = gradientStops[i]
      upperStop = gradientStops[i + 1]
      break
    }
  }

  // Linear interpolation between two colors
  const ratio = (normalized - lowerStop.position) / (upperStop.position - lowerStop.position)

  // Parse hex colors
  const r1 = parseInt(lowerStop.color.slice(1, 3), 16)
  const g1 = parseInt(lowerStop.color.slice(3, 5), 16)
  const b1 = parseInt(lowerStop.color.slice(5, 7), 16)

  const r2 = parseInt(upperStop.color.slice(1, 3), 16)
  const g2 = parseInt(upperStop.color.slice(3, 5), 16)
  const b2 = parseInt(upperStop.color.slice(5, 7), 16)

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}
export const RainfallForecastMap: React.FC<RainfallForecastMapProps> = ({
  onDisable = () => console.log('Rainfall forecast disabled'),
}) => {
  // Fetch rainfall forecast data
  const { data, isLoading, error } = useRainfallForecast()

  // Map ref
  const mapRef = useRef<L.Map | null>(null)

  // Animation state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // ms per frame
  const [isMapReady, setIsMapReady] = useState(false)

  // Rainfall tooltip state
  const [tooltipPosition, setTooltipPosition] = useState<[number, number] | null>(null)
  const [tooltipRainfall, setTooltipRainfall] = useState<number | null>(null)
  const [pinIconInstance, setPinIconInstance] = useState<L.Icon | null>(null)

  // Grid cells state: array of { bounds, color, value } for each grid cell
  interface GridCell {
    bounds: [[number, number], [number, number]]
    color: string
    value: number
  }
  const [gridCells, setGridCells] = useState<GridCell[]>([])

  // Calculate rainfall statistics (min, max, 98th percentile)
  const rainfallStats = useMemo(() => {
    if (!data) return { min: 0, max: 4.0, effectiveMax: 4.0 }

    // Collect all rainfall values across all frames
    const allValues: number[] = []
    data.frames.forEach((frame) => {
      frame.z.forEach((row) => {
        row.forEach((value) => {
          if (value && value > 0) {
            allValues.push(value)
          }
        })
      })
    })

    if (allValues.length === 0) return { min: 0, max: 4.0, effectiveMax: 4.0 }

    // Sort values for percentile calculation
    allValues.sort((a, b) => a - b)

    // Calculate 98th percentile as effective max (to handle outliers)
    const p98Index = Math.floor(allValues.length * 0.98)
    const effectiveMax = allValues[p98Index] || allValues[allValues.length - 1]
    const min = allValues[0]
    const max = allValues[allValues.length - 1]

    console.log('📊 Rainfall statistics:', {
      min: min.toFixed(3),
      max: max.toFixed(3),
      effectiveMax: effectiveMax.toFixed(3),
      p98Index,
      totalPoints: allValues.length,
    })

    return { min, max, effectiveMax, allValues }
  }, [data])

  // Legend data - just pass the max value for continuous gradient
  const legendMaxValue = rainfallStats.effectiveMax

  // Load Leaflet CSS
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  // Create custom pin icon (reuse from index.tsx)
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


  // Handle map click to show rainfall tooltip
  useEffect(() => {
    if (!mapRef.current || !data) return

    const map = mapRef.current
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if click came from close button or other UI element
      const target = e.originalEvent?.target as HTMLElement
      if (target && (target.closest('.rainfall-tooltip-close') || target.closest('.leaflet-popup'))) {
        return // Ignore clicks on tooltip/close button
      }

      const { lat, lng } = e.latlng

      // Get rainfall value at clicked location for current frame
      const currentFrame = data.frames[currentFrameIndex]
      if (!currentFrame) return

      const rainfallValue = getRainfallAtLocation(lat, lng, currentFrame, data.grid)

      if (rainfallValue !== null) {
        setTooltipPosition([lat, lng])
        setTooltipRainfall(rainfallValue)
      } else {
        // Clicked outside data bounds
        setTooltipPosition([lat, lng])
        setTooltipRainfall(null)
      }
    }

    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
    }
  }, [isMapReady, data, currentFrameIndex])

  // Update tooltip rainfall value when frame changes
  useEffect(() => {
    if (!tooltipPosition || !data) return

    const [lat, lng] = tooltipPosition
    const currentFrame = data.frames[currentFrameIndex]
    if (!currentFrame) return

    const rainfallValue = getRainfallAtLocation(lat, lng, currentFrame, data.grid)
    setTooltipRainfall(rainfallValue)
  }, [currentFrameIndex, tooltipPosition, data])

  // Generate and update grid cells when frame changes
  useEffect(() => {
    if (!data) return

    const currentFrame = data.frames[currentFrameIndex]
    if (!currentFrame) return

    const cells: GridCell[] = []
    const maxValue = rainfallStats.effectiveMax

    // Create a rectangle for each grid point
    data.grid.lat.forEach((lat, latIndex) => {
      data.grid.lon.forEach((lon, lonIndex) => {
        const rainfallValue = currentFrame.z[latIndex]?.[lonIndex]

        // Skip cells with no data or zero rainfall
        if (!rainfallValue || rainfallValue <= 0) return

        // Calculate rectangle bounds (0.25° grid spacing = 0.125° on each side)
        const halfCell = 0.125
        const bounds: [[number, number], [number, number]] = [
          [lat - halfCell, lon - halfCell], // Southwest corner
          [lat + halfCell, lon + halfCell]  // Northeast corner
        ]

        // Get color for this rainfall value
        const color = getColorForRainfall(rainfallValue, maxValue)

        cells.push({
          bounds,
          color,
          value: rainfallValue
        })
      })
    })

    setGridCells(cells)

    console.log(`📍 Frame ${currentFrameIndex + 1}/${data.frames.length}: ${currentFrame.time}`, {
      cells: cells.length,
    })
  }, [currentFrameIndex, data, rainfallStats])

  // Fit map bounds to data coverage area when data loads
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !data) return

    try {
      // Create bounds from metadata
      const bounds: [[number, number], [number, number]] = [
        [data.metadata.lat_bounds[0], data.metadata.lon_bounds[0]], // Southwest corner
        [data.metadata.lat_bounds[1], data.metadata.lon_bounds[1]], // Northeast corner
      ]

      // Fit map to show entire data coverage area
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50], // Add 50px padding on all sides
        animate: true,
        duration: 1.0, // 1 second animation
      })

      console.log('🗺️ Map fitted to data bounds:', {
        latBounds: data.metadata.lat_bounds,
        lonBounds: data.metadata.lon_bounds,
      })
    } catch (err) {
      console.error('❌ Error fitting map bounds:', err)
    }
  }, [isMapReady, data])


  // Animation loop
  useEffect(() => {
    if (!isPlaying || !data) return

    const intervalId = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const next = prev + 1
        return next >= data.frames.length ? 0 : next // Loop back to start
      })
    }, playbackSpeed)

    return () => clearInterval(intervalId)
  }, [isPlaying, playbackSpeed, data])

  // Get rainfall value at specific lat/lng by finding nearest grid cell with interpolation
  const getRainfallAtLocation = (
    lat: number,
    lng: number,
    frame: RainfallFrame,
    grid: RainfallGrid
  ): number | null => {
    // Find nearest grid indices
    let nearestLatIdx = 0
    let nearestLonIdx = 0
    let minLatDist = Infinity
    let minLonDist = Infinity

    // Find nearest latitude index
    grid.lat.forEach((gridLat, idx) => {
      const dist = Math.abs(gridLat - lat)
      if (dist < minLatDist) {
        minLatDist = dist
        nearestLatIdx = idx
      }
    })

    // Find nearest longitude index
    grid.lon.forEach((gridLon, idx) => {
      const dist = Math.abs(gridLon - lng)
      if (dist < minLonDist) {
        minLonDist = dist
        nearestLonIdx = idx
      }
    })

    // Check if click is within reasonable bounds (within 1.5 degrees)
    if (minLatDist > 1.5 || minLonDist > 1.5) {
      return null // Too far from any grid point
    }

    // Check center point first
    const centerValue = frame.z[nearestLatIdx]?.[nearestLonIdx]
    if (centerValue && centerValue > 0) {
      return centerValue
    }

    // If center has no data, check surrounding neighbors in 5x5 grid (2-cell radius, 24 neighbors)
    // This better matches the visual blur area (radius 50-60 pixels)
    const neighbors: Array<{ value: number; distance: number }> = []

    for (let latOffset = -2; latOffset <= 2; latOffset++) {
      for (let lonOffset = -2; lonOffset <= 2; lonOffset++) {
        const latIdx = nearestLatIdx + latOffset
        const lonIdx = nearestLonIdx + lonOffset

        if (latIdx >= 0 && latIdx < grid.lat.length && lonIdx >= 0 && lonIdx < grid.lon.length) {
          const value = frame.z[latIdx]?.[lonIdx]
          if (value && value > 0) {
            // Calculate distance from clicked point for weighted average
            const distance = Math.sqrt(latOffset * latOffset + lonOffset * lonOffset)
            neighbors.push({ value, distance })
          }
        }
      }
    }

    // If we found rainfall in nearby cells, return weighted average
    // Closer cells get more weight (inverse distance weighting)
    if (neighbors.length > 0) {
      let weightedSum = 0
      let totalWeight = 0

      neighbors.forEach(({ value, distance }) => {
        // Weight = 1 / (distance + 0.1) to avoid division by zero
        const weight = 1 / (distance + 0.1)
        weightedSum += value * weight
        totalWeight += weight
      })

      const weightedAverage = weightedSum / totalWeight
      return weightedAverage
    }

    // No rainfall data found in area
    return 0
  }


  // Format timestamp to 12-hour format: "Jan 26, 2026, 08:00 AM"
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
      return date.toLocaleString('en-US', options)
    } catch (error) {
      return isoString
    }
  }

  // Handlers
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev)
  }

  const handleFrameChange = (index: number) => {
    setCurrentFrameIndex(index)
    // Pause playback when manually scrubbing
    if (isPlaying) setIsPlaying(false)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }


  // Default center: Norfolk/Moyock area, Virginia
  // Using zoom 6 to show broader region for rainfall data coverage
  const center: [number, number] = [36.8443205, -76.2820786]
  const zoom = 6

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading rainfall forecast...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching 72 frames (~2.9MB)</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium mb-2">Failed to load rainfall forecast</p>
            <p className="text-sm text-red-600">{error.message}</p>
            <button
              onClick={onDisable}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Exit Forecast Mode
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">No rainfall forecast data available</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
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
        {/* Base Layer - Light/Positron (CartoDB) - Matches Plotly carto-positron style */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
          subdomains="abcd"
        />
        {/* Base Layer - Satellite */}
      {/*  <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="© Google Maps"
            maxZoom={21}
            subdomains="https://dev.hazert.utilian.com/"
        />*/}

        {/* Rainfall Grid Squares - 25km x 25km cells */}
        {gridCells.map((cell, index) => (
          <Rectangle
            key={`grid-${index}`}
            bounds={cell.bounds}
            pathOptions={{
              fillColor: cell.color,
              fillOpacity: 0.7,
              color: cell.color, // Border color same as fill
              weight: 0, // No border
              stroke: false // Disable stroke completely
            }}
          />
        ))}

        {/* Rainfall Tooltip Marker */}
        {tooltipPosition && pinIconInstance && (
          <Marker
            position={tooltipPosition}
            icon={pinIconInstance}
            eventHandlers={{
              add: (e) => {
                // Open popup when marker is added
                e.target.openPopup()
              }
            }}
          >
            <Popup closeButton={false} autoClose={false} closeOnClick={false}>
              <div className="text-center min-w-[130px] relative pt-5">
                {/* Close button - Row 1 (top right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTooltipPosition(null)
                    setTooltipRainfall(null)
                  }}
                  className="rainfall-tooltip-close absolute top-0 right-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs z-10"
                  title="Close"
                >
                  ✕
                </button>

                {/* Time - Row 2 (center) */}
                <div className="text-xs font-medium text-gray-500 mb-1">
                  🕒 {data ? formatTimestamp(data.frames[currentFrameIndex]?.time || '') : 'Loading...'}
                </div>

                {/* Value - Row 3 (center) */}
                {tooltipRainfall !== null ? (
                  <div className="text-lg font-bold text-blue-600">
                    {tooltipRainfall.toFixed(3)} mm/hr
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No rainfall data</div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Exit Button - Top Right */}
      <div className="absolute top-4 right-4 z-[1001]">
        <button
          onClick={onDisable}
          className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 hover:bg-white transition-colors flex items-center gap-2"
          title="Exit Rainfall Forecast"
        >
          <X className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Exit Forecast</span>
        </button>
      </div>

      {/* Legend - Below Exit Button */}
      <RainfallLegend maxValue={legendMaxValue} />

      {/* Time Control */}
      <RainfallTimeControl
        currentFrameIndex={currentFrameIndex}
        totalFrames={data.frames.length}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        currentTimestamp={data.frames[currentFrameIndex]?.time || ''}
        onFrameChange={handleFrameChange}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  )
}
