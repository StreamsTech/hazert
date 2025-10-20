import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Layer {
  id: string
  name: string
}

interface ComparisonModalProps {
  visible: boolean
  onClose: () => void
  onEnable: (leftLayerId: string, rightLayerId: string) => void
  layers: readonly Layer[]
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  visible,
  onClose,
  onEnable,
  layers,
}) => {
  const [leftLayer, setLeftLayer] = useState<string | null>(null)
  const [rightLayer, setRightLayer] = useState<string | null>(null)

  // Reset selections when modal opens
  useEffect(() => {
    if (visible) {
      setLeftLayer(null)
      setRightLayer(null)
    }
  }, [visible])

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [visible, onClose])

  const handleEnable = () => {
    if (leftLayer && rightLayer && leftLayer !== rightLayer) {
      onEnable(leftLayer, rightLayer)
      onClose()
    }
  }

  const canEnable = leftLayer !== null && rightLayer !== null && leftLayer !== rightLayer

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[2000] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2001] w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-6 m-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Layers to Compare</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Left Layer Selection */}
          <div className="mb-6">
            <label htmlFor="leftLayer" className="block text-sm font-medium text-gray-700 mb-3">
              Left Layer
            </label>
            <select
              id="leftLayer"
              value={leftLayer || ''}
              onChange={(e) => setLeftLayer(e.target.value || null)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all hover:border-gray-400"
            >
              <option value="">Select left layer</option>
              {layers.map((layer) => (
                <option
                  key={`left-${layer.id}`}
                  value={layer.id}
                  disabled={rightLayer === layer.id}
                >
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right Layer Selection */}
          <div className="mb-6">
            <label htmlFor="rightLayer" className="block text-sm font-medium text-gray-700 mb-3">
              Right Layer
            </label>
            <select
              id="rightLayer"
              value={rightLayer || ''}
              onChange={(e) => setRightLayer(e.target.value || null)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all hover:border-gray-400"
            >
              <option value="">Select right layer</option>
              {layers.map((layer) => (
                <option
                  key={`right-${layer.id}`}
                  value={layer.id}
                  disabled={leftLayer === layer.id}
                >
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Enable Button */}
          <button
            onClick={handleEnable}
            disabled={!canEnable}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              canEnable
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Enable Comparison
          </button>

          {/* Helper Text */}
          {!canEnable && (
            <p className="mt-3 text-xs text-center text-gray-500">
              {!leftLayer || !rightLayer
                ? 'Please select both left and right layers'
                : 'Please select different layers'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
