import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Layout from '../../components/Layout'
import LocationSelect from '../../components/LocationSelect'
import NINInput from '../../components/NINInput'
import { nigerianBanks } from '../../data/nigerianBanks'
import { usePermissions, PermissionGate, PERMISSIONS } from '../../components/PermissionProvider'
import { 
  UserIcon, 
  MapPinIcon, 
  BanknotesIcon, 
  BriefcaseIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

// Form validation schema
const agentSchema = z.object({
  // Personal Information
  nin: z.string()
    .min(11, 'NIN must be exactly 11 digits')
    .max(11, 'NIN must be exactly 11 digits')
    .regex(/^\d{11}$/, 'NIN must contain only numbers (no letters or special characters)'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], { required_error: 'Marital status is required' }),
  
  // Contact & Location
  phone: z.string().min(11, 'Phone number must be 11 digits').max(11, 'Phone number must be 11 digits').regex(/^0\d{10}$/, 'Phone must start with 0 and be 11 digits'),
  email: z.string().email('Invalid email address'),
  whatsAppNumber: z.string().min(11, 'Phone number must be 11 digits').max(11, 'Phone number must be 11 digits').regex(/^0\d{10}$/, 'Phone must start with 0 and be 11 digits'),
  alternativePhone: z.string().optional(),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  state: z.string().min(1, 'State is required'),
  localGovernment: z.string().min(1, 'Local Government is required'),
  ward: z.string().min(1, 'Ward is required'),
  pollingUnit: z.string().optional(),
  
  // Bank Information
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(2, 'Account name is required'),
  accountNumber: z.string().min(10, 'Account number must be 10 digits').max(10, 'Account number must be 10 digits').regex(/^\d{10}$/, 'Account number must contain only numbers'),
  bvn: z.string().min(11, 'BVN must be 11 digits').max(11, 'BVN must be 11 digits').regex(/^\d{11}$/, 'BVN must contain only numbers'),
  
  // Employment
  employmentStatus: z.enum(['employed', 'unemployed', 'self-employed', 'student', 'retired'], { required_error: 'Employment status is required' }),
  startDate: z.string().min(1, 'Start date is required'),
  salary: z.coerce.number().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  assignedState: z.string().min(1, 'Assigned state is required'),
  assignedLGA: z.string().min(1, 'Assigned LGA is required'),
  assignedWard: z.string().min(1, 'Assigned ward is required'),
  assignedPollingUnit: z.string().min(1, 'Assigned polling unit is required'),
})

const steps = [
  { id: 1, title: 'Personal Info', icon: UserIcon },
  { id: 2, title: 'Contact & Location', icon: MapPinIcon },
  { id: 3, title: 'Bank Info', icon: BanknotesIcon },
  { id: 4, title: 'Employment', icon: BriefcaseIcon },
]

export default function NewAgent() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nimcData, setNimcData] = useState(null)
  const [showPasswords, setShowPasswords] = useState({
    bvn: false
  })

  // Check permissions
  if (!hasPermission(PERMISSIONS.AGENTS_CREATE)) {
    return (
      <Layout title="Access Denied">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to create agents.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-ccsa-blue text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(agentSchema),
    mode: 'onChange'
  })

  // Watch location fields for cascading selects
  const selectedState = watch('state')
  const selectedLGA = watch('localGovernment')
  const selectedWard = watch('ward')

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleNINValidation = (ninData) => {
    console.log('NIN Validation Result:', ninData)
    
    if (ninData && ninData.isValid) {
      if (ninData.verified && ninData.firstName) {
        // Auto-fill form with verified NIN data
        console.log('Auto-filling form with verified NIN data')
        
        setValue('firstName', ninData.firstName)
        setValue('lastName', ninData.lastName)
        
        if (ninData.middleName) {
          setValue('middleName', ninData.middleName)
        }
        
        if (ninData.dateOfBirth) {
          setValue('dateOfBirth', ninData.dateOfBirth)
        }
        
        if (ninData.gender) {
          setValue('gender', ninData.gender.toUpperCase())
        }
        
        if (ninData.maritalStatus) {
          // Map marital status values
          const maritalStatusMap = {
            'SINGLE': 'single',
            'MARRIED': 'married',
            'DIVORCED': 'divorced',
            'WIDOWED': 'widowed'
          }
          const mappedStatus = maritalStatusMap[ninData.maritalStatus.toUpperCase()]
          if (mappedStatus) {
            setValue('maritalStatus', mappedStatus)
          }
        }
        
        // Store NIMC data to control field states
        setNimcData(ninData)
        
        if (ninData.phone && !watch('phone')) {
          setValue('phone', ninData.phone)
        }
        
        if (ninData.email && !watch('email')) {
          setValue('email', ninData.email)
        }
        
        // Trigger validation for auto-filled fields
        setTimeout(() => {
          trigger(['firstName', 'lastName', 'gender', 'maritalStatus'])
        }, 100)
        
        setSuccess('NIN verified successfully! Form fields have been auto-filled.')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // NIN is valid format but not verified
        console.log('NIN format is valid but not verified')
        setError('')
      }
    } else {
      // Invalid NIN
      console.log('Invalid NIN')
      setError(ninData?.error || 'Invalid NIN')
      setTimeout(() => setError(''), 3000)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate)
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step) => {
    switch (step) {
      case 1:
        return ['nin', 'firstName', 'lastName', 'gender', 'maritalStatus']
      case 2:
        return ['phone', 'email', 'address', 'state', 'localGovernment', 'ward']
      case 3:
        return ['bankName', 'accountName', 'accountNumber', 'bvn']
      case 4:
        return ['employmentStatus', 'startDate', 'assignedState', 'assignedLGA', 'assignedWard', 'assignedPollingUnit']
      default:
        return []
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess('Agent created successfully!')
        setTimeout(() => {
          router.push('/agents')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create agent')
      }
    } catch (error) {
      setError('An error occurred while creating the agent')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create New Agent">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? ' bg-ccsa-blue  text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-ccsa-blue' : 'text-gray-500'
                  }`}>
                    Step {step.id}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.id ? 'text-ccsa-blue' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-6 w-16 h-0.5 ${
                    currentStep > step.id ? 'bg-ccsa-blue' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter the agent's personal details and identification information.
                  </p>
                </div>

                {/* NIN Input with enhanced validation */}
                <div>
                  <Controller
                    control={control}
                    name="nin"
                    render={({ field: { onChange, value } }) => (
                      <NINInput
                        value={value || ''}
                        onChange={onChange}
                        onValidation={handleNINValidation}
                        error={errors.nin?.message}
                        required={true}
                        label="Agent's National Identification Number (NIN)"
                        placeholder="Enter agent's 11-digit NIN (numbers only)"
                      />
                    )}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <p>• NIN must be exactly 11 digits</p>
                    <p>• Only numbers are allowed (no letters or special characters)</p>
                    <p>• Personal details will be automatically verified and populated when possible</p>
                  </div>
                </div>

                {/* Name Fields - with auto-fill indication */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('firstName') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                      {nimcData?.verified && watch('middleName') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('middleName')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.middleName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter middle name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('lastName') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Personal Details - with auto-fill indication */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                      {nimcData?.verified && watch('dateOfBirth') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('gender') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <select
                      {...register('gender')}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.gender ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('maritalStatus') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <select
                      {...register('maritalStatus')}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.maritalStatus ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                    {errors.maritalStatus && (
                      <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    Contact & Location Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter contact details and residential address information.
                  </p>
                </div>

                {/* Contact Information - with auto-fill indication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('phone') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      maxLength={11}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 08012345678"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                      {nimcData?.verified && watch('email') && (
                        <span className="ml-2 text-xs text-green-600">✓ Auto-filled from NIN</span>
                      )}
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="agent@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('whatsAppNumber')}
                      type="tel"
                      maxLength={11}
                      inputMode="numeric"
                      required
                      pattern="[0-9]*"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      // className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 08012345678"
                    />
                     {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternative Phone
                    </label>
                    <input
                      {...register('alternativePhone')}
                      type="tel"
                      maxLength={11}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 08012345678"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Residential Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter full residential address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                {/* Location Selection */}
                <LocationSelect
                  selectedState={selectedState}
                  selectedLGA={selectedLGA}
                  selectedWard={selectedWard}
                  onStateChange={(value) => setValue('state', value)}
                  onLGAChange={(value) => setValue('localGovernment', value)}
                  onWardChange={(value) => setValue('ward', value)}
                  onPollingUnitChange={(value) => setValue('pollingUnit', value)}
                  errors={errors}
                  required={true}
                />
              </div>
            )}

            {/* Step 3: Bank Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BanknotesIcon className="w-5 h-5 mr-2" />
                    Bank Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter banking details for salary and commission payments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('bankName')}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.bankName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Bank</option>
                      {nigerianBanks.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('accountName')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.accountName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Account holder name"
                    />
                    {errors.accountName && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('accountNumber')}
                      type="text"
                      maxLength={10}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="10-digit account number"
                    />
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BVN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('bvn')}
                        type={showPasswords.bvn ? "text" : "password"}
                        maxLength={11}
                        className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.bvn ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="11-digit BVN"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('bvn')}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.bvn ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.bvn && (
                      <p className="mt-1 text-sm text-red-600">{errors.bvn.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Employment Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BriefcaseIcon className="w-5 h-5 mr-2" />
                    Employment Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure employment terms and assignment details.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('employmentStatus')}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.employmentStatus ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Employment Status</option>
                      <option value="employed">Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="self-employed">Self-employed</option>
                      <option value="student">Student</option>
                      <option value="retired">Retired</option>
                    </select>
                    {errors.employmentStatus && (
                      <p className="mt-1 text-sm text-red-600">{errors.employmentStatus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('startDate')}
                      type="date"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Salary (₦)
                    </label>
                    <input
                      {...register('salary')}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      {...register('commissionRate')}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 5.5"
                    />
                  </div>
                </div>

                {/* Assignment Location */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Assignment Location <span className="text-red-500">*</span></h4>
                  <p className="text-sm text-gray-600 mb-4">Select the location where this agent will be assigned to work.</p>
                  
                  <Controller
                    control={control}
                    name="assignedState"
                    render={({ field: { onChange, value } }) => (
                      <LocationSelect
                        selectedState={value}
                        selectedLGA={watch('assignedLGA')}
                        selectedWard={watch('assignedWard')}
                        onStateChange={(newState) => {
                          setValue('assignedState', newState)
                          setValue('assignedLGA', '')
                          setValue('assignedWard', '')
                          setValue('assignedPollingUnit', '')
                        }}
                        onLGAChange={(newLGA) => {
                          setValue('assignedLGA', newLGA)
                          setValue('assignedWard', '')
                          setValue('assignedPollingUnit', '')
                        }}
                        onWardChange={(newWard) => {
                          setValue('assignedWard', newWard)
                          setValue('assignedPollingUnit', '')
                        }}
                        onPollingUnitChange={(newPU) => setValue('assignedPollingUnit', newPU)}
                        errors={{
                          state: errors.assignedState,
                          localGovernment: errors.assignedLGA,
                          ward: errors.assignedWard,
                          pollingUnit: errors.assignedPollingUnit
                        }}
                        required={true}
                        labelPrefix="Assigned "
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <p className="mt-2 text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 bg-ccsa-blue text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating Agent...' : 'Create Agent'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
