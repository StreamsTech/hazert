import React from 'react'
import { User } from 'lucide-react'

interface UserProfileProps {
  name: string
  email: string
  phone: string
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, email, phone }) => {
  return (
    <div className="flex items-start gap-4 p-6">
      {/* User Avatar Circle */}
      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        <User className="w-6 h-6 text-gray-600" />
      </div>

      {/* User Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-black truncate">
          {name}
        </h3>
        <p className="text-sm text-black mt-1 truncate">
          {email}
        </p>
        <p className="text-sm text-black mt-0.5 truncate">
          {phone}
        </p>
      </div>
    </div>
  )
}
