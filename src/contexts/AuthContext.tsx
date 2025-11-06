import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthState } from '../types/auth'
import { fetchCurrentUser } from '../api/user'

interface AuthContextType extends AuthState {
  login: (token: string, user?: User) => void
  logout: () => void
  fetchAndStoreUserInfo: (token: string) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })

  // Check for existing token on mount and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        // No token found, user is not authenticated
        return
      }

      try {
        // Validate token by fetching user info from backend
        const user = await fetchCurrentUser(token)

        // Token is valid, restore session
        setAuthState({
          isAuthenticated: true,
          user,
          token,
        })
      } catch (error) {
        // Token is invalid/expired, clear everything
        console.error('Token validation failed:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      }
    }

    validateToken()
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

  const fetchAndStoreUserInfo = async (token: string): Promise<User> => {
    const user = await fetchCurrentUser(token)

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user))

    // Update auth state with user data
    setAuthState(prev => ({
      ...prev,
      user,
    }))

    return user
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        fetchAndStoreUserInfo,
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
