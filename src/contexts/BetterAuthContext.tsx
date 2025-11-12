import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authClient } from '../lib/auth-client'
import { fetchCurrentUser } from '../api/user'
import { API_CONFIG } from '../config/api.config'
import type { User } from '../types/auth'

interface BetterAuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<void>
  signUp: (credentials: { email: string; password: string; full_name: string; phone_number: string }) => Promise<void>
  signOut: () => Promise<void>
}

const BetterAuthContext = createContext<BetterAuthContextType | undefined>(undefined)

export const BetterAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const userData = await fetchCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to load user:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
        }
      }
      setIsLoading(false)
    }
    loadUser()
  }, [])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        // Token changed in another tab
        if (!e.newValue) {
          // Token removed - sign out
          setUser(null)
        } else {
          // Token added/changed - refresh session
          window.location.reload()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Sign in method
  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access_token)

      // Fetch user data
      const userData = await fetchCurrentUser()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign up method
  const signUp = async (credentials: { email: string; password: string; full_name: string; phone_number: string }) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Signup failed')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access_token)

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign out method
  const signOut = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value: BetterAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut
  }

  return (
    <BetterAuthContext.Provider value={value}>
      {children}
    </BetterAuthContext.Provider>
  )
}

export const useBetterAuth = () => {
  const context = useContext(BetterAuthContext)
  if (!context) {
    throw new Error('useBetterAuth must be used within BetterAuthProvider')
  }
  return context
}
