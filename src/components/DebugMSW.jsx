import { useState } from 'react'

export function DebugMSW() {
  const [stationsData, setStationsData] = useState(null)
  const [tideData, setTideData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testStationsAPI = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stations')
      console.log('Stations response status:', response.status)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Stations data:', data)
      setStationsData(data)
    } catch (err) {
      console.error('Stations error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testTideAPI = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stations/VA001/tides?days=3')
      console.log('Tide response status:', response.status)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Tide data:', data)
      setTideData(data)
    } catch (err) {
      console.error('Tide error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[9999] max-w-sm">
      <h3 className="font-bold mb-2">MSW Debug Panel</h3>
      
      <div className="space-y-2">
        <button 
          onClick={testStationsAPI}
          disabled={loading}
          className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Test Stations API
        </button>
        
        <button 
          onClick={testTideAPI}
          disabled={loading}
          className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          Test Tide API
        </button>
      </div>

      {loading && (
        <div className="mt-2 text-sm text-blue-600">Loading...</div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
          Error: {error}
        </div>
      )}

      {stationsData && (
        <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
          ✅ Stations: {stationsData.features?.length} found
        </div>
      )}

      {tideData && (
        <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded text-sm">
          ✅ Tide Data: {tideData.data?.length} points
        </div>
      )}
    </div>
  )
}