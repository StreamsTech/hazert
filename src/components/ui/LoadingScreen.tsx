import React from 'react'

interface LoadingScreenProps {
  message?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo or App Name */}
        <div className="text-4xl font-bold text-blue-600 tracking-tight">
          Hazert
        </div>

        {/* Loading message */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-medium text-gray-700">{message}</p>

          {/* Animated dots - Horizontal Progress */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
