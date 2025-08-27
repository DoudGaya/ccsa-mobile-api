import { useState } from 'react'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const NINInput = ({ 
  value, 
  onChange, 
  onValidation, 
  error, 
  disabled = false, 
  required = true,
  label = "National Identification Number (NIN)",
  placeholder = "Enter 11-digit NIN"
}) => {
  const [showNIN, setShowNIN] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [ninData, setNinData] = useState(null)

  const validateNIN = (nin) => {
    // Basic NIN validation - 11 digits
    const ninRegex = /^\d{11}$/
    return ninRegex.test(nin)
  }

  const handleNINChange = async (e) => {
    const nin = e.target.value.replace(/\D/g, '').slice(0, 11) // Only numbers, max 11 digits
    onChange(nin)
    
    // Reset validation when NIN changes
    setValidationResult(null)
    setNinData(null)
    
    // Reset validation callback
    if (onValidation) {
      onValidation({ isValid: false })
    }
    
    // Validate format and auto-verify if 11 digits
    if (nin.length === 11 && validateNIN(nin)) {
      // Auto-verify with API when 11 digits are entered
      await verifyNINWithAPI(nin)
    } else if (nin.length > 0) {
      setValidationResult('invalid')
    }
  }

  const verifyNINWithAPI = async (nin) => {
    try {
      setValidating(true)
      setValidationResult(null)
      
      const response = await fetch('/api/nin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Successfully verified with external API
        setNinData(data)
        setValidationResult('verified')
        
        if (onValidation) {
          onValidation({
            isValid: true,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            maritalStatus: data.maritalStatus,
            phone: data.phone,
            email: data.email,
            verified: true
          })
        }
      } else if (response.status === 422) {
        // Format valid but verification service unavailable
        setValidationResult('valid')
        
        if (onValidation) {
          onValidation({
            isValid: true,
            verified: false,
            message: data.message || 'NIN format is valid but verification service is unavailable'
          })
        }
      } else {
        // Invalid NIN or other error
        setValidationResult('invalid')
        
        if (onValidation) {
          onValidation({
            isValid: false,
            error: data.error || 'Invalid NIN'
          })
        }
      }
    } catch (error) {
      console.error('NIN verification error:', error)
      setValidationResult('error')
      
      if (onValidation) {
        onValidation({
          isValid: false,
          error: 'Network error during verification'
        })
      }
    } finally {
      setValidating(false)
    }
  }

  const formatNIN = (nin) => {
    // Format NIN as XXX-XX-XXXX for display
    if (nin.length >= 11) {
      return `${nin.slice(0, 3)}-${nin.slice(3, 5)}-${nin.slice(5, 11)}`
    }
    return nin
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={showNIN ? "text" : "password"}
          value={showNIN ? formatNIN(value) : value.replace(/./g, '•')}
          onChange={handleNINChange}
          disabled={disabled || validating}
          placeholder={placeholder}
          inputMode="numeric"
          pattern="[0-9]*"
          className={`w-full px-3 py-2 pr-20 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : validationResult === 'valid' || validationResult === 'verified'
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
              : validationResult === 'invalid'
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          maxLength={13} // Account for formatting dashes
        />
        
        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={() => setShowNIN(!showNIN)}
          disabled={disabled}
          className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          {showNIN ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>

        {/* Validation indicator */}
        <div className="absolute inset-y-0 right-2 flex items-center">
          {validating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : validationResult === 'valid' || validationResult === 'verified' ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          ) : validationResult === 'invalid' || validationResult === 'error' ? (
            <XCircleIcon className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>

      {/* Validation messages */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {validationResult === 'verified' && ninData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800 font-medium">✓ NIN Verified Successfully</p>
          <div className="text-xs text-green-700 mt-1 space-y-1">
            <p><strong>Name:</strong> {ninData.firstName} {ninData.middleName ? ninData.middleName + ' ' : ''}{ninData.lastName}</p>
            {ninData.dateOfBirth && <p><strong>Date of Birth:</strong> {ninData.dateOfBirth}</p>}
            {ninData.gender && <p><strong>Gender:</strong> {ninData.gender}</p>}
            {ninData.maritalStatus && <p><strong>Marital Status:</strong> {ninData.maritalStatus}</p>}
            {ninData.phone && <p><strong>Phone:</strong> {ninData.phone}</p>}
          </div>
          <p className="text-xs text-green-600 mt-2">✓ Details will be automatically filled in the form</p>
        </div>
      )}
      
      {validationResult === 'valid' && !ninData && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800 font-medium">✓ Valid NIN Format</p>
          <p className="text-xs text-blue-700 mt-1">
            NIN format is correct. Verification service may be unavailable - you can proceed with manual entry.
          </p>
        </div>
      )}
      
      {validationResult === 'invalid' && (
        <p className="text-sm text-red-600">✗ Invalid NIN format. Must be exactly 11 digits containing only numbers.</p>
      )}
      
      {validationResult === 'error' && (
        <p className="text-sm text-red-600">✗ Error verifying NIN. Please try again.</p>
      )}

      {/* Manual verification button */}
      {value.length === 11 && validateNIN(value) && validationResult !== 'verified' && (
        <button
          type="button"
          onClick={() => verifyNINWithAPI(value)}
          disabled={validating}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {validating ? 'Verifying...' : 'Verify with NIMC'}
        </button>
      )}

      <p className="text-xs text-gray-500">
        Enter your 11-digit National Identification Number. Details will be automatically verified and populated.
      </p>
    </div>
  )
}

export default NINInput
