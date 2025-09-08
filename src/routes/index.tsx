import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const WMS_LAYERS = [
  {
    id: 'flood-prediction',
    name: 'NOAA Flood Prediction',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:NOAA_Pred_Sts_Prj',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    attribution: 'IMIS Gazipur GeoServer',
    zIndex: 502,
  },
  {
    id: 'gis-places',
    name: 'GIS Places',
    url: 'http://13.250.205.178:8080/geoserver/wms',
    layers: 'imis_gazipur:gis_places',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    attribution: 'IMIS Gazipur GeoServer',
    zIndex: 501,
  },
] as const

function LayerController({
  layerVisibility,
  onLayerToggle,
}: {
  layerVisibility: Record<string, boolean>
  onLayerToggle: (layerId: string) => void
}) {
  return (
    <div className="absolute top-4 right-4 bg-white p-3 rounded-md shadow-md z-[1000] min-w-[200px]">
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

  // Default center: Dhaka, Bangladesh (appropriate for flood monitoring)
  const center: [number, number] = [23.8103, 90.4125]
  const zoom = 10

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
      >
        {/* Google Maps Base Layer */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="© Google Maps"
          maxZoom={20}
        />

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
              attribution={layer.attribution}
            />
          ) : null
        )}

        {/* Layer Controller */}
        <LayerController
          layerVisibility={layerVisibility}
          onLayerToggle={handleLayerToggle}
        />
      </MapContainer>
    </div>
  )
}