import type { SignupRequest, SignupResponse, LoginRequest, LoginResponse, AuthError } from '../types/auth'
import { API_CONFIG } from '../config/api.config'

/**
 * Signup a new user
 */
export const signupUser = async (data: SignupRequest): Promise<SignupResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: AuthError = await response.json()
      throw new Error(error.detail || 'Signup failed')
    }

    const result: SignupResponse = await response.json()
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during signup')
  }
}

/**
 * Login an existing user
 */
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: AuthError = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const result: LoginResponse = await response.json()
    return result
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during login')
  }
}
