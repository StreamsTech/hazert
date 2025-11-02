import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {children}
      </div>
    </div>
  )
}
