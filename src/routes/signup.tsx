import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthCard } from '../components/ui/AuthCard'
import { FormInput } from '../components/ui/FormInput'
import { PhoneInput } from '../components/ui/PhoneInput'
import { signupUser } from '../api/auth'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  validatePhoneNumber,
} from '../utils/validation'
import { useAuth } from '../contexts/AuthContext'
import type { SignupRequest } from '../types/auth'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

interface FormErrors {
  full_name?: string
  email?: string
  phone_number?: string
  password?: string
  confirmPassword?: string
}

function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login, fetchAndStoreUserInfo } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  })

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({})

  // Touched fields (for showing validation only after blur)
  const [touched, setTouched] = useState({
    full_name: false,
    email: false,
    phone_number: false,
    password: false,
    confirmPassword: false,
  })

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Validate individual field
  const validateField = (field: keyof FormErrors, value: string) => {
    let validation

    switch (field) {
      case 'full_name':
        validation = validateRequired(value, 'Name')
        break
      case 'email':
        validation = validateEmail(value)
        break
      case 'phone_number':
        validation = validatePhoneNumber(value)
        break
      case 'password':
        validation = validatePassword(value)
        break
      case 'confirmPassword':
        validation = validatePasswordMatch(formData.password, value)
        break
      default:
        return
    }

    setErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? undefined : validation.error,
    }))
  }

  // Handle field change
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Re-validate if field was touched
    if (touched[field]) {
      validateField(field, value)
    }

    // Also re-validate confirmPassword if password changes
    if (field === 'password' && touched.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword)
    }
  }

  // Handle field blur
  const handleBlur = (field: keyof typeof formData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field])
  }

  // Check if form is valid
  const isFormValid = () => {
    const hasNoErrors = Object.values(errors).every(error => !error)
    const allFieldsFilled =
      formData.full_name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone_number.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== ''

    return hasNoErrors && allFieldsFilled
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      full_name: true,
      email: true,
      phone_number: true,
      password: true,
      confirmPassword: true,
    })

    // Validate all fields
    validateField('full_name', formData.full_name)
    validateField('email', formData.email)
    validateField('phone_number', formData.phone_number)
    validateField('password', formData.password)
    validateField('confirmPassword', formData.confirmPassword)

    if (!isFormValid()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const signupData: SignupRequest = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
      }

      const response = await signupUser(signupData)

      // Update auth context with token
      login(response.access_token, response.user)

      // Fetch and store user info from /me endpoint (ensures consistency)
      await fetchAndStoreUserInfo(response.access_token)

      // Redirect to main page
      navigate({ to: '/' })
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message)
      } else {
        setSubmitError('An unexpected error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Sign Up</h1>
        <p className="text-black">Enter your information to create an account</p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          label="Name"
          type="text"
          placeholder="Name"
          value={formData.full_name}
          onChange={(value) => handleChange('full_name', value)}
          onBlur={() => handleBlur('full_name')}
          error={touched.full_name ? errors.full_name : undefined}
          required
        />

        <FormInput
          label="Email"
          type="email"
          placeholder="m@example.com"
          value={formData.email}
          onChange={(value) => handleChange('email', value)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          required
        />

        <PhoneInput
          label="Phone Number"
          value={formData.phone_number}
          onChange={(value) => handleChange('phone_number', value)}
          onBlur={() => handleBlur('phone_number')}
          error={touched.phone_number ? errors.phone_number : undefined}
          required
        />

        <FormInput
          label="Password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(value) => handleChange('password', value)}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          required
        />

        <FormInput
          label="Re-enter Password"
          type="password"
          placeholder="Re-enter Password"
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          required
        />

        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-lg text-white font-semibold text-base transition-colors ${
            !isFormValid() || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? 'Creating account...' : 'Create an account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-black">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
