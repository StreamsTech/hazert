import React, { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { X, Loader2 } from 'lucide-react'
import { useRainfallForecast } from '../../hooks/useRainfallForecast'
import { RainfallLegend } from './RainfallLegend'
import { RainfallTimeControl } from './RainfallTimeControl'
import type { RainfallFrame, RainfallGrid, RainfallForecastMetadata } from '../../types/rainfall'

export interface LegendItem {
  color: string
  label: string
  description: string
}

// Extend Leaflet types for leaflet.heat
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number
      blur?: number
      maxZoom?: number
      max?: number
      gradient?: Record<number, string>
    }
  ): L.Layer & {
    setLatLngs(latlngs: Array<[number, number, number]>): void
    addTo(map: L.Map): void
    remove(): void
  }
}

interface RainfallForecastMapProps {
  onDisable?: () => void
}

/**
 * Rainfall Forecast Map Component
 * Main visualization component for animated rainfall heatmap
 *
 * Features:
 * - Fetches 72-hour rainfall forecast data
 * - Renders animated heatmap overlay using leaflet.heat
 * - Provides playback controls (play/pause, speed, scrubbing)
 * - Displays color-coded legend
 * - Handles loading and error states
 *
 * Data Flow:
 * 1. Fetch data using useRainfallForecast hook
 * 2. Convert each frame's 2D rainfall matrix to heatmap points
 * 3. Update heatmap layer on frame change
 * 4. Animate through frames based on playback controls
 */
export const RainfallForecastMap: React.FC<RainfallForecastMapProps> = ({
  onDisable = () => console.log('Rainfall forecast disabled'),
}) => {
  // Fetch rainfall forecast data
  const { data, isLoading, error } = useRainfallForecast()

  // Map and heatmap layer refs
  const mapRef = useRef<L.Map | null>(null)
  const heatmapLayerRef = useRef<L.Layer & { setLatLngs: (latlngs: Array<[number, number, number]>) => void } | null>(
    null
  )

  // Animation state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // ms per frame
  const [isMapReady, setIsMapReady] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(6)

  // Rainfall tooltip state
  const [tooltipPosition, setTooltipPosition] = useState<[number, number] | null>(null)
  const [tooltipRainfall, setTooltipRainfall] = useState<number | null>(null)
  const [pinIconInstance, setPinIconInstance] = useState<L.Icon | null>(null)

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

  // Calculate dynamic legend items based on data quantiles
  const legendItems = useMemo(() => {
    if (!data || !rainfallStats.allValues || rainfallStats.allValues.length === 0) return []

    const { effectiveMax, allValues } = rainfallStats

    // Generate 12 quantile-based buckets for equal data distribution
    const numBuckets = 12
    const legendBuckets: LegendItem[] = []

    // Extract colors from our exact heatmap gradient (reversed order for legend display)
    const gradientColors = [
      '#7a0402', // 100% - very dark red
      '#b11901', // 93% - dark red
      '#d93806', // 86% - red-orange
      '#f36315', // 79% - deep orange
      '#fe9b2d', // 71% - orange
      '#f3c63a', // 64% - gold
      '#d1e834', // 57% - yellow
      '#a4fc3b', // 50% - yellow-green
      '#61fc6c', // 43% - green
      '#24eca6', // 36% - green-cyan
      '#1bcfd4', // 29% - cyan
      '#39a2fc', // 21% - light blue
    ]

    for (let i = 0; i < numBuckets; i++) {
      // Calculate quantile indices
      const startIdx = Math.floor((i / numBuckets) * allValues.length)
      const endIdx = Math.floor(((i + 1) / numBuckets) * allValues.length)

      // Get quantile range values
      const rangeMin = allValues[startIdx]
      const rangeMax = i === numBuckets - 1 ? effectiveMax : allValues[endIdx - 1]

      // Format labels with 3 decimal places for better precision
      const label = `${rangeMin.toFixed(3)}-${rangeMax.toFixed(3)}`

      // Determine description based on intensity
      let description = 'Trace'
      if (rangeMax >= 2.5) description = 'Extreme'
      else if (rangeMax >= 1.8) description = 'Very Heavy'
      else if (rangeMax >= 1.2) description = 'Heavy'
      else if (rangeMax >= 0.6) description = 'Moderate'
      else if (rangeMax >= 0.3) description = 'Light'
      else if (rangeMax >= 0.1) description = 'Very Light'

      legendBuckets.push({
        color: gradientColors[i],
        label,
        description,
      })
    }

    // Already in descending order (highest at top)
    return legendBuckets
  }, [data, rainfallStats])

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

  // Track zoom level changes and update heatmap settings
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const updateZoom = () => {
      const newZoom = map.getZoom()
      setCurrentZoom(newZoom)
      // Update heatmap settings for new zoom level
      updateHeatmapForZoom(newZoom)
    }

    map.on('zoomend', updateZoom)
    updateZoom() // Initial zoom

    return () => {
      map.off('zoomend', updateZoom)
    }
  }, [isMapReady])

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

  // Initialize heatmap layer
  useEffect(() => {
    if (!isMapReady || !mapRef.current || heatmapLayerRef.current) return

    try {
      // Create heatmap layer with custom gradient
      const heatLayer = L.heatLayer([], {
        radius: 35,        // Increased from 25 for smoother appearance
        blur: 25,          // Increased from 15 for better blending
        maxZoom: 17,
        max: 1.0,
        minIntensity: 0,
        maxIntensity: rainfallStats.effectiveMax, // Use 98th percentile as max
        gradient: {
          0.00: '#30123b', // very dark purple
          0.07: '#4145ab', // deep blue
          0.14: '#4675ed', // blue
          0.21: '#39a2fc', // light blue
          0.29: '#1bcfd4', // cyan
          0.36: '#24eca6', // green-cyan
          0.43: '#61fc6c', // green
          0.50: '#a4fc3b', // yellow-green
          0.57: '#d1e834', // yellow
          0.64: '#f3c63a', // gold
          0.71: '#fe9b2d', // orange
          0.79: '#f36315', // deep orange
          0.86: '#d93806', // red-orange
          0.93: '#b11901', // dark red
          1.00: '#7a0402'  // very dark red
        }
      } as any)

      heatLayer.addTo(mapRef.current)
      heatmapLayerRef.current = heatLayer

      console.log('✅ Heatmap layer initialized')
    } catch (err) {
      console.error('❌ Error initializing heatmap layer:', err)
    }

    // Cleanup function
    return () => {
      if (heatmapLayerRef.current && mapRef.current) {
        try {
          heatmapLayerRef.current.remove()
          heatmapLayerRef.current = null
        } catch (err) {
          console.warn('Error cleaning up heatmap layer:', err)
        }
      }
    }
  }, [isMapReady, rainfallStats])

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

  // Update heatmap when frame changes
  useEffect(() => {
    if (!heatmapLayerRef.current || !data) return

    const currentFrame = data.frames[currentFrameIndex]
    if (!currentFrame) return

    const heatmapPoints = convertFrameToHeatmapPoints(currentFrame, data.grid, data.metadata)

    heatmapLayerRef.current.setLatLngs(heatmapPoints)

    console.log(`📍 Frame ${currentFrameIndex + 1}/${data.frames.length}: ${currentFrame.time}`, {
      points: heatmapPoints.length,
    })
  }, [currentFrameIndex, data])

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

  // Convert frame data to heatmap points
  const convertFrameToHeatmapPoints = (
    frame: RainfallFrame,
    grid: RainfallGrid,
    metadata: RainfallForecastMetadata
  ): Array<[number, number, number]> => {
    const points: Array<[number, number, number]> = []
    const maxRainfall = rainfallStats.effectiveMax // Use 98th percentile for normalization

    grid.lat.forEach((lat, latIndex) => {
      grid.lon.forEach((lon, lonIndex) => {
        const rainfallValue = frame.z[latIndex]?.[lonIndex]

        // Skip null/zero/negative values
        if (!rainfallValue || rainfallValue <= 0) return

        // Normalize to 0-1 range
        const intensity = Math.min(rainfallValue / maxRainfall, 1.0)

        // leaflet.heat format: [lat, lng, intensity]
        points.push([lat, lon, intensity])
      })
    })

    return points
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

  // Calculate zoom-dependent heatmap settings based on user testing
  const getHeatmapSettings = (zoom: number): { radius: number; blur: number } => {
    // Based on user testing:
    // Zoom 5: R:50 B:0
    // Zoom 7: R:55 B:0
    // Zoom 9: R:60 B:15
    // Pattern: As zoom increases, radius increases, blur increases slowly

    if (zoom <= 5) {
      return { radius: 50, blur: 0 }
    } else if (zoom <= 7) {
      return { radius: 55, blur: 0 }
    } else if (zoom <= 9) {
      return { radius: 60, blur: 15 }
    } else if (zoom <= 11) {
      return { radius: 50, blur: 25 }
    } else if (zoom <= 13) {
      return { radius: 40, blur: 28 }
    } else if (zoom <= 15) {
      return { radius: 35, blur: 25 }
    } else {
      return { radius: 30, blur: 20 }
    }
  }

  // Update heatmap settings when zoom changes
  const updateHeatmapForZoom = (zoom: number) => {
    if (!heatmapLayerRef.current || !mapRef.current || !data) return

    try {
      const settings = getHeatmapSettings(zoom)
      const map = mapRef.current

      // Remove old layer
      heatmapLayerRef.current.remove()

      // Create new layer with zoom-appropriate settings
      const layer = L.heatLayer([], {
        radius: settings.radius,
        blur: settings.blur,
        maxZoom: 17,
        max: 1.0,
        minIntensity: 0,
        maxIntensity: rainfallStats.effectiveMax,
        gradient: {
          0.0: '#30123b',
          0.07: '#4145ab',
          0.14: '#4675ed',
          0.21: '#39a2fc',
          0.29: '#1bcfd4',
          0.36: '#24eca6',
          0.43: '#61fc6c',
          0.5: '#a4fc3b',
          0.57: '#d1e834',
          0.64: '#f3c63a',
          0.71: '#fe9b2d',
          0.79: '#f36315',
          0.86: '#d93806',
          0.93: '#b11901',
          1.0: '#7a0402',
        },
      } as any)

      layer.addTo(map)
      heatmapLayerRef.current = layer

      // Re-render current frame
      const currentFrame = data.frames[currentFrameIndex]
      if (currentFrame) {
        const points = convertFrameToHeatmapPoints(currentFrame, data.grid, data.metadata)
        layer.setLatLngs(points)
      }

      console.log(`🔄 Heatmap updated for zoom ${zoom}: radius=${settings.radius}, blur=${settings.blur}`)
    } catch (err) {
      console.error('❌ Error updating heatmap for zoom:', err)
    }
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
      <RainfallLegend items={legendItems} />

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
