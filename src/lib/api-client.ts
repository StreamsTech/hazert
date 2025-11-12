/**
 * API Client with automatic auth token injection
 * Integrates with Better Auth for seamless authentication
 */

import { API_CONFIG } from '../config/api.config'

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Enhanced fetch wrapper with automatic authorization headers
 *
 * @example
 * const data = await apiFetch('/me')
 * const result = await apiFetch('/users', { method: 'POST', body: JSON.stringify(data) })
 */
export const apiFetch = async <T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options

  // Get token from localStorage (managed by Better Auth)
  const token = localStorage.getItem('access_token')

  // Build headers
  const headers: Record<string, string> = {
    ...API_CONFIG.headers,
    ...(customHeaders as Record<string, string>),
  }

  // Add authorization header if token exists and not skipped
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Build full URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.baseURL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    })

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')

      // Redirect to login (or let Better Auth handle it)
      window.location.href = '/login'
      throw new Error('Unauthorized - please login again')
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`
      }))
      throw new Error(error.detail || 'Request failed')
    }

    // Parse JSON response
    const data = await response.json()
    return data as T

  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
}

/**
 * API client methods for common HTTP operations
 */
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body: any, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}
