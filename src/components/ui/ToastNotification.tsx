import { CheckCircle, XCircle, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastNotificationProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
  duration?: number
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  message,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'
  const textColor = type === 'success' ? 'text-green-700' : 'text-red-700'
  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[2500] ${bgColor} border ${textColor} px-4 py-3 rounded-lg shadow-lg max-w-md animate-slide-down`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
