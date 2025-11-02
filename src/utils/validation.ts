// Form validation utilities

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

/**
 * Validate password (minimum 6 characters)
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' }
  }

  return { isValid: true }
}

/**
 * Validate password match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { isValid: false, error: 'Please re-enter your password' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }

  return { isValid: true }
}

/**
 * Validate required field
 */
export const validateRequired = (
  value: string,
  fieldName: string
): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }

  return { isValid: true }
}

/**
 * Validate phone number (basic validation)
 */
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: false, error: 'Phone number is required' }
  }

  // Basic validation: at least 7 digits
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  if (digitsOnly.length < 7) {
    return { isValid: false, error: 'Please enter a valid phone number' }
  }

  return { isValid: true }
}
