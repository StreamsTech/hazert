import { api } from '../lib/api-client'
import type { User } from '../types/auth'

/**
 * Fetch current logged-in user information
 * Now uses Better Auth's automatic token injection - no need to pass token manually!
 */
export const fetchCurrentUser = async (): Promise<User> => {
  return api.get<User>('/me')
}

/**
 * Update user profile
 */
export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  return api.put<User>('/users/me', data)
}
