import { GitCompare } from 'lucide-react'

interface ComparisonButtonProps {
  onClick: () => void
}

export const ComparisonButton: React.FC<ComparisonButtonProps> = ({ onClick }) => {
  return (
    <div
      className="comparison-button-prevent-click absolute top-[136px] right-4 z-[1001]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClick}
        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 hover:bg-white transition-colors group"
        title="Compare Layers"
      >
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
            Compare
          </span>
        </div>
      </button>
    </div>
  )
}
