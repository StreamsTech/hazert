import type { User } from '../types/auth'

const API_BASE_URL = 'https://api-dev.hazert.utilian.com'

/**
 * Fetch current logged-in user information
 */
export const fetchCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch user info' }))
    throw new Error(error.detail || 'Failed to fetch user info')
  }

  return await response.json()
}
