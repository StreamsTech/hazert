import { Droplets } from 'lucide-react'

interface RainfallLegendProps {
  maxValue: number
}

/**
 * Rainfall Legend Component
 * Displays continuous gradient scale for rainfall intensity
 * Position: Right side of the map (below Exit button)
 * Unit: mm/hr (millimeters per hour)
 *
 * Shows a vertical gradient bar matching the heatmap colors
 * with milestone value labels.
 */
export const RainfallLegend: React.FC<RainfallLegendProps> = ({ maxValue }) => {
  // Show loading state if no max value
  if (!maxValue || maxValue <= 0) {
    return (
      <div className="absolute top-[76px] right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[100px]">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Rain (mm/hr)</h3>
        </div>
        <p className="text-xs text-gray-500">Loading...</p>
      </div>
    )
  }

  // Calculate milestone values (0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3)
  // But adapt to actual max value
  const getMilestones = (max: number): number[] => {
    if (max <= 0.3) {
      return [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3].filter(v => v <= max)
    } else if (max <= 1.0) {
      return [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].filter(v => v <= max)
    } else {
      // For larger values, use 0.5 increments
      const milestones = [0]
      let current = 0.5
      while (current < max) {
        milestones.push(current)
        current += 0.5
      }
      milestones.push(Math.ceil(max * 10) / 10) // Round max to 1 decimal
      return milestones
    }
  }

  const milestones = getMilestones(maxValue)

  return (
    <div className="absolute top-[76px] right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[100px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Rain (mm/hr)</h3>
      </div>

      {/* Continuous Gradient Bar */}
      <div className="flex gap-3 items-stretch">
        {/* Gradient Bar */}
        <div className="relative w-8 h-[200px]">
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `linear-gradient(to top,
                #30123b 0%,
                #4145ab 7%,
                #4675ed 14%,
                #39a2fc 21%,
                #1bcfd4 29%,
                #24eca6 36%,
                #61fc6c 43%,
                #a4fc3b 50%,
                #d1e834 57%,
                #f3c63a 64%,
                #fe9b2d 71%,
                #f36315 79%,
                #d93806 86%,
                #b11901 93%,
                #7a0402 100%
              )`
            }}
          />
        </div>

        {/* Value Labels */}
        <div className="relative h-[200px] flex flex-col justify-between">
          {milestones.reverse().map((value, index) => (
            <div key={index} className="text-xs font-medium text-gray-700">
              {value.toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 text-center">
          Forecast Grid
        </p>
      </div>
    </div>
  )
}
