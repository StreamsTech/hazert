import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthState } from '../types/auth'

interface AuthContextType extends AuthState {
  login: (token: string, user?: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')

    if (token) {
      const user = userStr ? JSON.parse(userStr) : null
      setAuthState({
        isAuthenticated: true,
        user,
        token,
      })
    }
  }, [])

  const login = (token: string, user?: User) => {
    localStorage.setItem('access_token', token)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }

    setAuthState({
      isAuthenticated: true,
      user: user || null,
      token,
    })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
