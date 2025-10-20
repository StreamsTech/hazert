import { Navigation } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export const CurrentLocationControl: React.FC = () => {
  const map = useMap()
  const [isLocating, setIsLocating] = useState(false)
  const [marker, setMarker] = useState<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Disable Leaflet map click propagation
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Remove old marker if exists
        if (marker) {
          map.removeLayer(marker)
        }

        // Create custom icon
        const customIcon = L.icon({
          iconUrl: '/images/currentLocation.png',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        })

        // Create new marker
        const newMarker = L.marker([latitude, longitude], {
          icon: customIcon
        }).addTo(map)

        // Store marker reference
        setMarker(newMarker)

        // Fly to location
        map.flyTo([latitude, longitude], 16, {
          duration: 1.5
        })

        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsLocating(false)

        let errorMessage = 'Unable to get your location.'
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location services.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable.'
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.'
        }

        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  return (
    <div
      ref={containerRef}
      className="current-location-button-prevent-click absolute top-[248px] right-4 z-[1001]"
    >
      <button
        onClick={handleGetCurrentLocation}
        disabled={isLocating}
        className={`backdrop-blur-sm rounded-lg shadow-lg p-3 transition-colors ${
          isLocating
            ? 'bg-blue-100 cursor-wait'
            : 'bg-white/95 hover:bg-white'
        }`}
        title="Go to My Current Location"
      >
        <Navigation
          className={`w-5 h-5 ${isLocating ? 'text-blue-600 animate-pulse' : 'text-gray-700'}`}
        />
      </button>
    </div>
  )
}
