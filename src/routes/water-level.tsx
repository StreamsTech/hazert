import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup } from 'react-leaflet'
import { useTideData } from '~/hooks/useTideData'
import { DebugMSW } from '~/components/DebugMSW'
import { useStations } from '~/hooks/useStations'
import L from 'leaflet'
import { TideChart } from '~/components/TideChart'
import TideMonitoringSiteCategories from '~/components/ui/TideMonitoringSiteCategories'
export const Route = createFileRoute('/water-level')({
  component: HomePage,
})

const createBlueIcon = () => {
  try {
    if (typeof window !== 'undefined') {
      return new L.Icon({
        iconUrl:
          'data:image/svg+xml;base64,' +
          btoa(`
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
              <path fill="#3B82F6" stroke="#1E40AF" stroke-width="2" 
                    d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5S25 25 25 12.5C25 5.6 19.4 0 12.5 0z"/>
              <circle fill="white" cx="12.5" cy="12.5" r="6"/>
            </svg>
          `),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })
    }
  } catch (error) {
    console.warn('Failed to create custom icon:', error)
  }
  return null
}

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

function HomePage() {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [selectedStationName, setSelectedStationName] = useState('')

  const { data: tideData, isLoading: isTideLoading, error: tideError } = useTideData(
    selectedStationId,
    { days: 7, enabled: !!selectedStationId }
  )

  const handleStationClick = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId)
    setSelectedStationName(stationName)
  }
  return (
    <div className="h-screen w-full">
      {import.meta.env.DEV && <DebugMSW />}
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
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [selectedStationName, setSelectedStationName] = useState('')

  const { data: tideData, isLoading: isTideLoading, error: tideError } = useTideData(
    selectedStationId,
    { days: 7, enabled: !!selectedStationId }
  )

  const handleStationClick = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId)
    setSelectedStationName(stationName)
  }


  const { data: stationsData, isLoading, error } = useStations()
  const [blueIcon, setBlueIcon] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapRef = useRef(null)
  if (stationsData?.features) {
    console.log('Features:', stationsData.features)
  }

  // Load Leaflet CSS on client side
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
  
    const icon = createBlueIcon()
    if (icon) {
      setBlueIcon(icon)
    }
  }, [])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        setIsMapReady(false)
        setBlueIcon(null)
      }
    }, [])

  // Default center: Norfolk/Moyock area, Virginia (matches GeoServer data location)
  const center: [number, number] = [36.8443205, -76.2820786]
  const zoom = 10

  return (
    <div className="h-full w-full flex flex-col">
      {/* Charts Section - Lower Half */}
      <div className="h-2/3 w-full flex relative">


      <div className="w-100 border-r border-gray-200 bg-white overflow-y-auto">
      <TideMonitoringSiteCategories />
    </div>



    <div className="flex-1 relative">
      
    <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={true}
          whenReady={() => setIsMapReady(true)} 
        >
          {/* Google Maps Base Layer */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution="© Google Maps"
            maxZoom={20}
          />

          {/* WMS Layers */}
          {WMS_LAYERS.map((layer) => 
            (
              <WMSTileLayer
                key={layer.id}
                url={layer.url}
                layers={layer.layers}
                format={layer.format}
                transparent={layer.transparent}
                version={layer.version}
              />
            )
          )}
              {isMapReady && stationsData?.features?.map((station) => (
            <Marker
              key={station.properties.id}
              position={[
                station.geometry.coordinates[1],
                station.geometry.coordinates[0]
              ]}
              icon={blueIcon || undefined}
              eventHandlers={{
                click: () => handleStationClick(station.properties.id, station.properties.name)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold">{station.properties.name}</h3>
                  <p className="text-gray-600">ID: {station.properties.id}</p>
                  <p className="text-gray-600">Status: {station.properties.status}</p>
                  <button 
                    onClick={() =>handleStationClick(station.properties.id, station.properties.name)

                    }
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    View Tide Data
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
    </div>


            {/* Selected Station Indicator */}
            {selectedStationId && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md z-[1000]">
          <p className="text-sm font-medium text-gray-700">
            Selected Station: {selectedStationId}
          </p>
        </div>
      )}
      </div>


    {/* Charts Section - Lower Half */}
    <div className="flex-1 min-h-0 bg-gray-50 p-4">
        {selectedStationId ? (
          <div className="h-full flex items-center justify-center p-4">
            {/* Single Combined Tide Chart */}
            <div className="w-full max-w-6xl">
              <TideChart
                data={tideData?.data}
                title={`Water Level Data - ${selectedStationName}`}
                loading={isTideLoading}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Station</h3>
              <p className="text-gray-600">Click on a blue marker on the map to view tide data for that station.</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {tideError && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600">{tideError.message}</p>
              <button 
                onClick={() => selectedStationId && handleStationClick(selectedStationId, selectedStationName)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}