// Authentication related type definitions

export interface SignupRequest {
  full_name: string
  email: string
  phone_number: string
  password: string
}

export interface SignupResponse {
  access_token: string
  token_type: string
  user: {
    email: string
    full_name: string
    phone_number: string
    id: number
    fcm_token: string | null
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface AuthError {
  detail: string
}

export interface User {
  id: number
  email: string
  full_name: string
  phone_number: string
  fcm_token: string | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}
