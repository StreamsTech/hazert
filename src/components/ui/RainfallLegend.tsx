import { Droplets } from 'lucide-react'

export interface LegendItem {
  color: string
  label: string
  description: string
}

interface RainfallLegendProps {
  items: LegendItem[]
}

/**
 * Rainfall Legend Component
 * Displays dynamic color gradient scale for rainfall intensity
 * Position: Right side of the map
 * Unit: mm/hr (millimeters per hour)
 *
 * The legend is dynamically generated based on quantile clustering
 * of actual rainfall data, with 98th percentile outlier handling.
 */
export const RainfallLegend: React.FC<RainfallLegendProps> = ({ items }) => {
  // Show loading state if no items
  if (!items || items.length === 0) {
    return (
      <div className="absolute top-[76px] right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[180px]">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Rainfall</h3>
        </div>
        <p className="text-xs text-gray-500">Calculating...</p>
      </div>
    )
  }

  return (
    <div className="absolute top-[76px] right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[180px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Rainfall</h3>
      </div>

      {/* Legend Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
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
