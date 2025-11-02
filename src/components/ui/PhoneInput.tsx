import React, { useState } from 'react'

interface CountryCode {
  code: string
  country: string
  dial_code: string
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', country: 'United States', dial_code: '+1' },
  { code: 'GB', country: 'United Kingdom', dial_code: '+44' },
  { code: 'BD', country: 'Bangladesh', dial_code: '+880' },
  { code: 'IN', country: 'India', dial_code: '+91' },
  { code: 'PK', country: 'Pakistan', dial_code: '+92' },
  { code: 'CA', country: 'Canada', dial_code: '+1' },
  { code: 'AU', country: 'Australia', dial_code: '+61' },
  { code: 'SA', country: 'Saudi Arabia', dial_code: '+966' },
  { code: 'AE', country: 'United Arab Emirates', dial_code: '+971' },
  { code: 'CN', country: 'China', dial_code: '+86' },
]

interface PhoneInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0])
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleCountryChange = (dialCode: string) => {
    const country = COUNTRY_CODES.find(c => c.dial_code === dialCode)
    if (country) {
      setSelectedCountry(country)
      onChange(`${dialCode}${phoneNumber}`)
    }
  }

  const handlePhoneChange = (number: string) => {
    // Only allow numbers
    const cleaned = number.replace(/\D/g, '')
    setPhoneNumber(cleaned)
    onChange(`${selectedCountry.dial_code}${cleaned}`)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-black mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        {/* Country Code Dropdown */}
        <select
          value={selectedCountry.dial_code}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className={`px-3 py-3 text-base text-black border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.dial_code}>
              {country.code} {country.dial_code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <input
          type="tel"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`flex-1 px-4 py-3 text-base text-black placeholder:text-gray-400 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
}
