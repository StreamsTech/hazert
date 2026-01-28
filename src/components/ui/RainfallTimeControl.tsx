import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface RainfallTimeControlProps {
  currentFrameIndex: number
  totalFrames: number
  isPlaying: boolean
  playbackSpeed: number
  currentTimestamp: string
  onFrameChange: (index: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
}

/**
 * Rainfall Time Control Component
 * Provides playback controls for animated rainfall forecast
 *
 * Features:
 * - Play/Pause button
 * - Previous/Next frame buttons
 * - Timeline slider for scrubbing
 * - Speed selector (0.5x, 1x, 2x, 4x)
 * - Current timestamp display
 *
 * Position: Bottom center of the map
 */
export const RainfallTimeControl: React.FC<RainfallTimeControlProps> = ({
  currentFrameIndex,
  totalFrames,
  isPlaying,
  playbackSpeed,
  currentTimestamp,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
}) => {
  const handlePrevious = () => {
    onFrameChange(Math.max(0, currentFrameIndex - 1))
  }

  const handleNext = () => {
    onFrameChange(Math.min(totalFrames - 1, currentFrameIndex + 1))
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value)
    onFrameChange(newIndex)
  }

  // Format timestamp for display
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch (error) {
      return isoString
    }
  }

  // Get speed label
  const getSpeedLabel = (speed: number): string => {
    const speedMap: Record<number, string> = {
      2000: '0.5x',
      1000: '1x',
      500: '2x',
      250: '4x',
    }
    return speedMap[speed] || '1x'
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[500px] max-w-[90vw]">
      {/* Controls Row */}
      <div className="flex items-center gap-3 mb-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentFrameIndex === 0}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous Frame"
        >
          <SkipBack className="w-4 h-4 text-gray-700" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentFrameIndex === totalFrames - 1}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next Frame"
        >
          <SkipForward className="w-4 h-4 text-gray-700" />
        </button>

        {/* Timeline Slider */}
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrameIndex}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
              (currentFrameIndex / (totalFrames - 1)) * 100
            }%, #e5e7eb ${(currentFrameIndex / (totalFrames - 1)) * 100}%, #e5e7eb 100%)`,
          }}
          title={`Frame ${currentFrameIndex + 1} of ${totalFrames}`}
        />

        {/* Frame Counter */}
        <div className="text-xs text-gray-600 font-medium min-w-[60px] text-center">
          {currentFrameIndex + 1} / {totalFrames}
        </div>

        {/* Speed Selector */}
        <select
          value={playbackSpeed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          title="Playback Speed"
        >
          <option value={2000}>0.5x</option>
          <option value={1000}>1x</option>
          <option value={500}>2x</option>
          <option value={250}>4x</option>
        </select>
      </div>

      {/* Timestamp Display */}
      <div className="text-center text-sm text-gray-700 font-medium pt-2 border-t border-gray-200">
        {formatTimestamp(currentTimestamp)}
      </div>
    </div>
  )
}
