import { CloudRain } from 'lucide-react'

interface RainfallForecastButtonProps {
  onClick: () => void
}

/**
 * Rainfall Forecast Button
 * Position: Bottom of the button list (top-[360px])
 * Phase 2.1: Opens rainfall forecast mode directly
 * Phase 2.2: Will open date range modal
 */
export const RainfallForecastButton: React.FC<RainfallForecastButtonProps> = ({ onClick }) => {
  return (
    <div
      className="rainfall-forecast-button-prevent-click absolute top-[360px] right-4 z-[1001]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClick}
        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 hover:bg-white transition-colors group"
        title="Rainfall Forecast"
      >
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
            Rainfall
          </span>
        </div>
      </button>
    </div>
  )
}
