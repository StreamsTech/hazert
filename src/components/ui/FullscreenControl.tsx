import { Maximize, Minimize } from 'lucide-react'
import { useState, useEffect } from 'react'

export const FullscreenControl: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div
      className="fullscreen-button-prevent-click absolute top-[192px] right-4 z-[1001]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleToggleFullscreen}
        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 hover:bg-white transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize className="w-5 h-5 text-gray-700" />
        ) : (
          <Maximize className="w-5 h-5 text-gray-700" />
        )}
      </button>
    </div>
  )
}
