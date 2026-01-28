import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { X, Loader2 } from 'lucide-react'
import { useRainfallForecast } from '../../hooks/useRainfallForecast'
import { RainfallLegend } from './RainfallLegend'
import { RainfallTimeControl } from './RainfallTimeControl'
import type { RainfallFrame, RainfallGrid, RainfallForecastMetadata } from '../../types/rainfall'

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

  // Load Leaflet CSS
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  // Initialize heatmap layer
  useEffect(() => {
    if (!isMapReady || !mapRef.current || heatmapLayerRef.current) return

    try {
      // Create heatmap layer with custom gradient
      const heatLayer = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        minIntensity: 0,
        maxIntensity: 4.0, // Maximum expected rainfall value (mm/hr)
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
  }, [isMapReady])

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

  // Convert frame data to heatmap points
  const convertFrameToHeatmapPoints = (
    frame: RainfallFrame,
    grid: RainfallGrid,
    metadata: RainfallForecastMetadata
  ): Array<[number, number, number]> => {
    const points: Array<[number, number, number]> = []
    const maxRainfall = 4.0 // mm/hr threshold for normalization (matches maxIntensity)

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
        {/* Base Layer - Satellite */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution="© Google Maps"
          maxZoom={21}
        />
      </MapContainer>

      {/* Exit Button */}
      <div className="absolute top-4 left-4 z-[1001]">
        <button
          onClick={onDisable}
          className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 hover:bg-white transition-colors flex items-center gap-2"
          title="Exit Rainfall Forecast"
        >
          <X className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Exit Forecast</span>
        </button>
      </div>

      {/* Legend */}
      <RainfallLegend />

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
