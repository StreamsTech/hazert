import { Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface NotificationControlProps {
  onNotificationSent: (success: boolean, message: string) => void
}

export const NotificationControl: React.FC<NotificationControlProps> = ({ onNotificationSent }) => {
  const map = useMap()
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Disable Leaflet map click propagation
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  const handleNotifyClick = async () => {
    setIsSending(true)

    try {
      // Dynamic import to avoid circular dependencies
      const { sendNotification } = await import('../../api/notifications')
      await sendNotification()

      // Success callback
      onNotificationSent(true, 'Successfully Notify Everyone')
    } catch (error) {
      console.error('Error sending notification:', error)

      // Error callback
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification'
      onNotificationSent(false, errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="notification-button-prevent-click absolute top-[308px] right-4 z-[1001]"
    >
      <button
        onClick={handleNotifyClick}
        disabled={isSending}
        className={`backdrop-blur-sm rounded-lg shadow-lg p-3 transition-colors ${
          isSending
            ? 'bg-blue-100 cursor-wait'
            : 'bg-white/95 hover:bg-white'
        }`}
        title="Notify Everyone"
      >
        <Bell
          className={`w-5 h-5 ${isSending ? 'text-blue-600 animate-pulse' : 'text-gray-700'}`}
        />
      </button>
    </div>
  )
}
