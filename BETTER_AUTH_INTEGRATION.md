# Better Auth Integration Guide

## Overview

Better Auth has been integrated into the HazERT application to provide enhanced authentication features while working with your FastAPI backend. This integration provides:

✅ **Automatic token storage and refresh**
✅ **Cross-tab synchronization** - Login/logout syncs across all open tabs
✅ **Centralized hooks** - `useBetterAuth()` for accessing user/session data
✅ **API interceptors** - Automatic auth headers on all API calls
✅ **Secure token management** - Better Auth handles storage strategy
✅ **Clean integration** with TanStack Query

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Better Auth Client                       │
│  (Manages session state, token storage, cross-tab sync)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─► Custom Fetch Adapter
                       │   (Transforms requests for FastAPI)
                       │
                       ▼
              ┌────────────────────┐
              │  FastAPI Backend   │
              │  (Python)          │
              └────────────────────┘
                       │
                       ├─► /login (POST)
                       ├─► /users (POST - signup)
                       └─► /me (GET - session)
```

## Files Created

### 1. `src/lib/auth-client.ts`
The Better Auth client configuration with custom fetch implementation.

**Key Features:**
- Maps Better Auth endpoints to FastAPI endpoints
- Transforms responses to Better Auth format
- Handles token storage in localStorage
- Exports hooks: `useSession`, `signIn`, `signOut`, `signUp`

### 2. `src/contexts/BetterAuthContext.tsx`
React Context wrapper for Better Auth.

**Provides:**
- `user: User | null` - Current user data
- `isLoading: boolean` - Loading state
- `isAuthenticated: boolean` - Auth status
- `signIn(email, password)` - Login method
- `signUp(email, password, ...)` - Signup method
- `signOut()` - Logout method

**Cross-Tab Sync:**
- Listens to `storage` events
- Auto-refreshes when token changes in other tabs

### 3. `src/lib/api-client.ts`
Enhanced fetch wrapper with automatic auth headers.

**Usage:**
```typescript
import { api } from '../lib/api-client'

// GET request with auto auth headers
const userData = await api.get('/me')

// POST request with auto auth headers
const result = await api.post('/stations', { name: 'Station 1' })

// Skip auth headers
const publicData = await api.get('/public', { skipAuth: true })
```

**Features:**
- Automatic `Authorization: Bearer <token>` headers
- Handles 401 responses (auto-redirect to login)
- Type-safe responses
- Error handling

## Usage Examples

### 1. Login Component

```typescript
import { useBetterAuth } from '../contexts/BetterAuthContext'

function LoginPage() {
  const { signIn, isAuthenticated } = useBetterAuth()

  const handleSubmit = async (email: string, password: string) => {
    try {
      await signIn({ email, password })
      // Better Auth handles token storage automatically
      navigate({ to: '/' })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }
}
```

### 2. Protected Route

```typescript
import { useBetterAuth } from '../contexts/BetterAuthContext'

function HomePage() {
  const { isAuthenticated, isLoading } = useBetterAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) return <div>Loading...</div>
}
```

### 3. User Profile

```typescript
import { useBetterAuth } from '../contexts/BetterAuthContext'

function UserProfile() {
  const { user, signOut } = useBetterAuth()

  return (
    <div>
      <h1>Welcome, {user?.full_name}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### 4. API Calls with Auto Auth

```typescript
import { api } from '../lib/api-client'

// All requests automatically include auth headers
const fetchStations = async () => {
  const stations = await api.get('/stations')
  return stations
}

const createStation = async (data) => {
  const result = await api.post('/stations', data)
  return result
}
```

## Benefits You Get

### 1. **Cross-Tab Synchronization**
- Login in one tab → All tabs auto-login
- Logout in one tab → All tabs auto-logout
- Implemented via `storage` event listeners

### 2. **Automatic Token Management**
- Better Auth stores tokens securely
- Auto-adds `Authorization` headers to API calls
- Handles token expiration (redirects to login on 401)

### 3. **Clean Hooks API**
```typescript
const { user, isAuthenticated, isLoading, signIn, signOut } = useBetterAuth()
```

### 4. **TanStack Query Integration**
- Can invalidate queries on login/logout
- Works seamlessly with existing query client

### 5. **Type Safety**
- Full TypeScript support
- Type-safe API client
- Type-safe auth hooks

## Migration from Old AuthContext

### Before (Old AuthContext):
```typescript
const { user, isAuthenticated, login, logout, fetchAndStoreUserInfo } = useAuth()

const handleLogin = async () => {
  const response = await loginUser(data)
  login(response.access_token)
  await fetchAndStoreUserInfo(response.access_token)
}
```

### After (Better Auth):
```typescript
const { user, isAuthenticated, signIn, signOut } = useBetterAuth()

const handleLogin = async () => {
  await signIn({ email, password })
  // That's it! Token and user info handled automatically
}
```

## Environment Variables

Make sure your `.env` file has:
```env
VITE_API_BASE_URL=https://api-dev.hazert.utilian.com
```

## Token Storage

Better Auth stores tokens in:
- `localStorage.getItem('access_token')` - JWT token from FastAPI

The API client automatically reads this token for all requests.

## Error Handling

### 401 Unauthorized
- API client detects 401 responses
- Clears invalid token
- Redirects to `/login`

### Network Errors
- Caught and thrown as Error objects
- Can be handled in try/catch blocks

## Future Enhancements

When your backend adds:

### 1. **Refresh Tokens**
Update `src/lib/auth-client.ts` to:
- Store refresh token
- Auto-refresh before expiry
- Handle refresh token rotation

### 2. **Role-Based Access**
Add to `BetterAuthContext.tsx`:
```typescript
const hasRole = (role: string) => {
  return user?.roles?.includes(role)
}
```

### 3. **Session Expiry**
Add automatic session refresh:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Refresh session every 5 minutes
  }, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

## Troubleshooting

### Issue: Login doesn't work
- Check network tab for API calls
- Verify FastAPI backend is running
- Check console for errors
- Verify `VITE_API_BASE_URL` is correct

### Issue: Token not persisting
- Check localStorage in DevTools
- Verify `access_token` is stored
- Check browser privacy settings (cookies/storage)

### Issue: Cross-tab sync not working
- Ensure both tabs are on same domain
- Check `storage` event listeners
- Verify localStorage permissions

## Summary

Better Auth integration provides a robust, type-safe authentication system that:
- Works seamlessly with your FastAPI backend
- Provides clean hooks and utilities
- Handles token management automatically
- Supports cross-tab synchronization
- Integrates with TanStack Query

The old `AuthContext` can now be removed once you verify everything works!
