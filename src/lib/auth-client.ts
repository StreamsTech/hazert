/**
 * Better Auth Client Configuration
 *
 * This file provides the Better Auth client setup for the Hazert application.
 * Since we're using a FastAPI backend, we use Better Auth mainly for its
 * client-side utilities (token management, cross-tab sync) rather than
 * its full-stack features.
 *
 * The actual auth logic is implemented in BetterAuthContext.tsx
 */

import { API_CONFIG } from '../config/api.config'

/**
 * Auth client placeholder
 * In a full Better Auth setup, this would use createAuthClient()
 * For our FastAPI backend, we implement custom auth logic in BetterAuthContext
 */
export const authClient = {
  apiBaseUrl: API_CONFIG.baseURL,
}
