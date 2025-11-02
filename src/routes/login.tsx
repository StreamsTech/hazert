import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthCard } from '../components/ui/AuthCard'
import { FormInput } from '../components/ui/FormInput'
import { loginUser } from '../api/auth'
import { validateEmail, validateRequired } from '../utils/validation'
import { useAuth } from '../contexts/AuthContext'
import type { LoginRequest } from '../types/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

interface FormErrors {
  email?: string
  password?: string
}

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({})

  // Touched fields
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Validate individual field
  const validateField = (field: keyof FormErrors, value: string) => {
    let validation

    switch (field) {
      case 'email':
        validation = validateEmail(value)
        break
      case 'password':
        validation = validateRequired(value, 'Password')
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
      formData.email.trim() !== '' && formData.password.trim() !== ''

    return hasNoErrors && allFieldsFilled
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    })

    // Validate all fields
    validateField('email', formData.email)
    validateField('password', formData.password)

    if (!isFormValid()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const loginData: LoginRequest = {
        email: formData.email,
        password: formData.password,
      }

      const response = await loginUser(loginData)

      // Update auth context and localStorage
      login(response.access_token)

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
        <h1 className="text-3xl font-bold text-black mb-2">Login</h1>
        <p className="text-black">Enter your credentials to access your account</p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className={`w-full py-3.5 px-4 rounded-lg text-white font-semibold text-base transition-colors ${
            !isFormValid() || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-black">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
