import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import LocationSelect from '../../../components/LocationSelect'
import { usePermissions, PERMISSIONS } from '../../../components/PermissionProvider'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  MapPinIcon,
  CalendarIcon,
  BanknotesIcon,
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function EditFarmer() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const { id } = router.query
  
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nin: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    employmentStatus: '',
    phone: '',
    email: '',
    whatsAppNumber: '',
    address: '',
    state: '',
    lga: '',
    ward: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    bvn: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})

  // Validation functions
  const validateField = (name, value) => {
    const errors = {}
    
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value || value.trim().length < 2) {
          errors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least 2 characters`
        }
        break
      case 'nin':
        if (!value) {
          errors[name] = 'NIN is required'
        } else if (!/^\d{11}$/.test(value)) {
          errors[name] = 'NIN must be exactly 11 digits'
        }
        break
      case 'phone':
        if (!value) {
          errors[name] = 'Phone number is required'
        } else if (!/^\d{11}$/.test(value)) {
          errors[name] = 'Phone number must be exactly 11 digits'
        }
        break
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[name] = 'Please enter a valid email address'
        }
        break
      case 'accountNumber':
        if (value && !/^\d{10}$/.test(value)) {
          errors[name] = 'Account number must be exactly 10 digits'
        }
        break
      case 'bvn':
        if (value && !/^\d{11}$/.test(value)) {
          errors[name] = 'BVN must be exactly 11 digits'
        }
        break
      case 'dateOfBirth':
        if (value) {
          const date = new Date(value)
          const today = new Date()
          const age = today.getFullYear() - date.getFullYear()
          if (isNaN(date.getTime())) {
            errors[name] = 'Please enter a valid date'
          } else if (age < 18 || age > 100) {
            errors[name] = 'Age must be between 18 and 100 years'
          }
        }
        break
    }
    
    return errors
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    if (!hasPermission(PERMISSIONS.FARMERS_UPDATE)) {
      router.push('/farmers')
      return
    }
    
    if (id) {
      fetchFarmerDetails()
    }
  }, [id, session, status, hasPermission])

  const fetchFarmerDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/farmers/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        // Handle both wrapped and direct farmer responses
        const farmerData = data.farmer || data
        setFarmer(farmerData)
        
        // Populate form data
        setFormData({
          firstName: farmerData.firstName || '',
          middleName: farmerData.middleName || '',
          lastName: farmerData.lastName || '',
          nin: farmerData.nin || '',
          dateOfBirth: farmerData.dateOfBirth ? farmerData.dateOfBirth.split('T')[0] : '',
          gender: farmerData.gender || '',
          maritalStatus: farmerData.maritalStatus || '',
          employmentStatus: farmerData.employmentStatus || '',
          phone: farmerData.phone || '',
          email: farmerData.email || '',
          whatsAppNumber: farmerData.whatsAppNumber || '',
          address: farmerData.address || '',
          state: farmerData.state || '',
          lga: farmerData.lga || '',
          ward: farmerData.ward || '',
          bankName: farmerData.bankName || '',
          accountName: farmerData.accountName || '',
          accountNumber: farmerData.accountNumber || '',
          bvn: farmerData.bvn || ''
        })
      } else {
        setError('Failed to fetch farmer details')
      }
    } catch (error) {
      setError('Error fetching farmer details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validate field and clear any existing errors for this field
    const errors = validateField(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: errors[name] || undefined
    }))
  }

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      state: locationData.state || '',
      lga: locationData.lga || '',
      ward: locationData.ward || ''
    }))
  }

  const handleStateChange = (state) => {
    setFormData(prev => ({
      ...prev,
      state: state || '',
      lga: '', // Reset LGA when state changes
      ward: '' // Reset ward when state changes
    }))
  }

  const handleLGAChange = (lga) => {
    setFormData(prev => ({
      ...prev,
      lga: lga || '',
      ward: '' // Reset ward when LGA changes
    }))
  }

  const handleWardChange = (ward) => {
    setFormData(prev => ({
      ...prev,
      ward: ward || ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    setFieldErrors({})

    // Validate all fields before submission
    const allErrors = {}
    Object.keys(formData).forEach(field => {
      const errors = validateField(field, formData[field])
      if (errors[field]) {
        allErrors[field] = errors[field]
      }
    })

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors)
      setSaving(false)
      setError('Please fix the validation errors below')
      return
    }

    try {
      console.log('Submitting form data:', formData)
      
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      console.log('Response:', data)

      if (response.ok) {
        setSuccess('Farmer information updated successfully!')
        setFarmer(data)
        
        // Redirect to farmer details page after a short delay
        setTimeout(() => {
          router.push(`/farmers/${id}`)
        }, 2000)
      } else {
        console.error('Server error:', data)
        
        // Handle validation errors from server
        if (data.details && Array.isArray(data.details)) {
          const serverErrors = {}
          data.details.forEach(detail => {
            serverErrors[detail.field] = detail.message
          })
          setFieldErrors(serverErrors)
        }
        
        setError(data.error || 'Failed to update farmer information')
      }
    } catch (error) {
      console.error('Network error:', error)
      setError('Network error: Unable to update farmer information. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Edit Farmer">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!farmer) {
    return (
      <Layout title="Edit Farmer">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Farmer not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The farmer you're looking for doesn't exist or you don't have permission to edit.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/farmers')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Farmers
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Edit ${farmer.firstName} ${farmer.lastName}`}>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Farmer</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update {farmer.firstName} {farmer.lastName}'s information
              </p>
            </div>
            <button
              onClick={() => router.push(`/farmers/${id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Details
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                Personal Information
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.firstName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter first name"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    id="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.middleName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter middle name"
                  />
                  {fieldErrors.middleName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.middleName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.lastName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter last name"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nin" className="block text-sm font-medium text-gray-700">
                    NIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nin"
                    id="nin"
                    required
                    maxLength="11"
                    value={formData.nin}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.nin 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="11-digit NIN"
                  />
                  {fieldErrors.nin && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.nin}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.dateOfBirth 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.gender 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {fieldErrors.gender && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.gender}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    id="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">
                    Employment Status
                  </label>
                  <select
                    name="employmentStatus"
                    id="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Farmer">Farmer</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-500 mr-2" />
                Contact Information
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.phone 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="e.g., +234 123 456 7890"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="whatsAppNumber" className="block text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsAppNumber"
                    id="whatsAppNumber"
                    value={formData.whatsAppNumber}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.whatsAppNumber 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="e.g., +234 123 456 7890"
                  />
                  {fieldErrors.whatsAppNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.whatsAppNumber}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter email address"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.address 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter full address"
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                Location Information
              </h3>
            </div>
            <div className="px-6 py-6">
              <LocationSelect
                initialState={formData.state}
                initialLga={formData.lga}
                initialWard={formData.ward}
                onStateChange={handleStateChange}
                onLGAChange={handleLGAChange}
                onWardChange={handleWardChange}
              />
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BanknotesIcon className="h-5 w-5 text-gray-500 mr-2" />
                Banking Information
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    id="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.bankName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter bank name"
                  />
                  {fieldErrors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.bankName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    id="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.accountName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter account name"
                  />
                  {fieldErrors.accountName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.accountName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.accountNumber 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter account number"
                    maxLength="10"
                  />
                  {fieldErrors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bvn" className="block text-sm font-medium text-gray-700">
                    BVN (Bank Verification Number)
                  </label>
                  <input
                    type="text"
                    name="bvn"
                    id="bvn"
                    maxLength="11"
                    value={formData.bvn}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      fieldErrors.bvn 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="11-digit BVN"
                  />
                  {fieldErrors.bvn && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.bvn}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/farmers/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
