import React from 'react'
import { UserProfile } from './UserProfile'
import { LogOut, X } from 'lucide-react'

interface DrawerContentProps {
  name: string
  email: string
  phone: string
  onLogout: () => void
  onClose: () => void
}

export const DrawerContent: React.FC<DrawerContentProps> = ({
  name,
  email,
  phone,
  onLogout,
  onClose,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-black">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-black" />
        </button>
      </div>

      {/* User Profile Section */}
      <UserProfile name={name} email={email} phone={phone} />

      {/* Divider */}
      <div className="border-t border-gray-200 mx-4" />

      {/* Spacer to push logout to bottom */}
      <div className="flex-1" />

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
