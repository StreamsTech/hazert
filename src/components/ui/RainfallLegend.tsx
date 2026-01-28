import { Droplets } from 'lucide-react'

/**
 * Rainfall Legend Component
 * Displays color gradient scale for rainfall intensity
 * Position: Right side of the map
 * Unit: mm/hr (millimeters per hour)
 *
 * Color Scale:
 * - 0-5 mm/hr: Light green (#A8E6CF) - Light rain
 * - 5-10 mm/hr: Yellow (#FFD700) - Moderate rain
 * - 10-20 mm/hr: Orange (#FF8C00) - Heavy rain
 * - 20-40 mm/hr: Dark orange (#FF4500) - Very heavy rain
 * - 40+ mm/hr: Dark red (#8B0000) - Extreme rainfall
 */
export const RainfallLegend: React.FC = () => {
  const legendItems = [
    { color: '#8B0000', label: '40+', description: 'Extreme' },
    { color: '#FF4500', label: '20-40', description: 'Very Heavy' },
    { color: '#FF8C00', label: '10-20', description: 'Heavy' },
    { color: '#FFD700', label: '5-10', description: 'Moderate' },
    { color: '#A8E6CF', label: '0-5', description: 'Light' },
  ]

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[160px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Rainfall</h3>
      </div>

      {/* Legend Items */}
      <div className="space-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-6 h-4 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                <span className="text-[10px] text-gray-500">mm/hr</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 text-center">
          Forecast Heatmap
        </p>
      </div>
    </div>
  )
}
