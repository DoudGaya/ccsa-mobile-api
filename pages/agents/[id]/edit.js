import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import LocationSelect from '../../../components/LocationSelect'
import { nigerianBanks } from '../../../data/nigerianBanks'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  MapPinIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Form validation schema (simplified version of new agent schema)
const editAgentSchema = z.object({
  // Personal Information
  nin: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  
  // Contact & Location
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
  whatsAppNumber: z.string().optional(),
  alternativePhone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  localGovernment: z.string().optional(),
  ward: z.string().optional(),
  pollingUnit: z.string().optional(),
  
  // Bank Information
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bvn: z.string().optional(),
  
  // Employment
  employmentStatus: z.enum(['employed', 'unemployed', 'self-employed', 'student', 'retired']).optional(),
  startDate: z.string().optional(),
  salary: z.coerce.number().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  assignedState: z.string().optional(),
  assignedLGA: z.string().optional(),
  assignedWard: z.string().optional(),
  assignedPollingUnit: z.string().optional(),
  
  // System
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  isActive: z.boolean().optional(),
})

export default function EditAgent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    bvn: false
  })

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(editAgentSchema),
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (id && session) {
      fetchAgentDetails()
    }
  }, [id, session, status])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      // Try main API first, then fallback
      let response = await fetch(`/api/agents/${id}`)
      
      if (!response.ok) {
        console.log('Main agent API failed, trying fallback...')
        response = await fetch(`/api/agents-details/${id}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        const agentData = data.agent || data
        setAgent(agentData)
        
        // Set form values
        setValue('displayName', agentData.displayName || '')
        setValue('nin', agentData.nin || '')
        setValue('firstName', agentData.firstName || '')
        setValue('middleName', agentData.middleName || '')
        setValue('lastName', agentData.lastName || '')
        setValue('dateOfBirth', agentData.dateOfBirth ? agentData.dateOfBirth.split('T')[0] : '')
        setValue('gender', agentData.gender || '')
        setValue('maritalStatus', agentData.maritalStatus || '')
        setValue('email', agentData.email || '')
        setValue('phone', agentData.phone || agentData.phoneNumber || '')
        setValue('whatsAppNumber', agentData.whatsAppNumber || '')
        setValue('alternativePhone', agentData.alternativePhone || '')
        setValue('address', agentData.address || '')
        setValue('state', agentData.state || '')
        setValue('localGovernment', agentData.lga || agentData.localGovernment || '')
        setValue('ward', agentData.ward || '')
        setValue('pollingUnit', agentData.pollingUnit || '')
        setValue('bankName', agentData.bankName || '')
        setValue('accountName', agentData.accountName || '')
        setValue('accountNumber', agentData.accountNumber || '')
        setValue('bvn', agentData.bvn || '')
        setValue('employmentStatus', agentData.employmentStatus || '')
        setValue('startDate', agentData.startDate ? agentData.startDate.split('T')[0] : '')
        setValue('salary', agentData.salary || '')
        setValue('commissionRate', agentData.commissionRate || '')
        setValue('assignedState', agentData.assignedState || '')
        setValue('assignedLGA', agentData.assignedLGA || '')
        setValue('assignedWard', agentData.assignedWard || '')
        setValue('assignedPollingUnit', agentData.assignedPollingUnit || '')
        setValue('isActive', agentData.isActive !== false)
      } else {
        throw new Error('Failed to fetch agent details')
      }
    } catch (error) {
      console.error('Error fetching agent details, trying fallback:', error)
      try {
        const response = await fetch(`/api/agents-details/${id}`)
        if (response.ok) {
          const data = await response.json()
          setAgent(data)
          
          // Set form values
          setValue('displayName', data.displayName || '')
          setValue('nin', data.nin || '')
          setValue('firstName', data.firstName || '')
          setValue('middleName', data.middleName || '')
          setValue('lastName', data.lastName || '')
          setValue('dateOfBirth', data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '')
          setValue('gender', data.gender || '')
          setValue('maritalStatus', data.maritalStatus || '')
          setValue('email', data.email || '')
          setValue('phone', data.phone || data.phoneNumber || '')
          setValue('whatsAppNumber', data.whatsAppNumber || '')
          setValue('alternativePhone', data.alternativePhone || '')
          setValue('address', data.address || '')
          setValue('state', data.state || '')
          setValue('localGovernment', data.lga || data.localGovernment || '')
          setValue('ward', data.ward || '')
          setValue('pollingUnit', data.pollingUnit || '')
          setValue('bankName', data.bankName || '')
          setValue('accountName', data.accountName || '')
          setValue('accountNumber', data.accountNumber || '')
          setValue('bvn', data.bvn || '')
          setValue('employmentStatus', data.employmentStatus || '')
          setValue('startDate', data.startDate ? data.startDate.split('T')[0] : '')
          setValue('salary', data.salary || '')
          setValue('commissionRate', data.commissionRate || '')
          setValue('assignedState', data.assignedState || '')
          setValue('assignedLGA', data.assignedLGA || '')
          setValue('assignedWard', data.assignedWard || '')
          setValue('assignedPollingUnit', data.assignedPollingUnit || '')
          setValue('isActive', data.isActive !== false)
        } else {
          throw new Error('Both APIs failed')
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
        setError('Failed to load agent details')
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      setError(null)
      
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update agent')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/agents/${id}`)
      }, 2000)
    } catch (error) {
      console.error('Error updating agent:', error)
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Edit Agent">
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !agent) {
    return (
      <Layout title="Edit Agent">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!agent) {
    return (
      <Layout title="Edit Agent">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Agent not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested agent could not be found.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Edit ${agent.displayName || agent.firstName + ' ' + agent.lastName}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Agent: {agent.displayName || `${agent.firstName} ${agent.lastName}`}
            </h1>
            <p className="text-sm text-gray-500">Update agent information and settings</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  Agent updated successfully! Redirecting to agent details...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                    Display Name *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('displayName')}
                      type="text"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                      placeholder="Enter display name"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nin" className="block text-sm font-medium text-gray-700">
                    National ID Number (NIN)
                  </label>
                  <input
                    {...register('nin')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter 11-digit NIN"
                    maxLength={11}
                  />
                  {errors.nin && (
                    <p className="mt-1 text-sm text-red-600">{errors.nin.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                  <input
                    {...register('middleName')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter middle name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-100"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
                    Marital Status
                  </label>
                  <select
                    {...register('maritalStatus')}
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-100"
                  >
                    <option value="">Select marital status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                      placeholder="08012345678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="whatsAppNumber" className="block text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('whatsAppNumber')}
                      type="tel"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                      placeholder="08012345678"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="alternativePhone" className="block text-sm font-medium text-gray-700">
                    Alternative Phone
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('alternativePhone')}
                      type="tel"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    {...register('address')}
                    rows="3"
                    className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Location Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <LocationSelect
                selectedState={selectedState}
                selectedLGA={selectedLGA}
                selectedWard={selectedWard}
                onStateChange={(state) => {
                  setValue('state', state)
                  setValue('localGovernment', '') // Reset LGA when state changes
                  setValue('ward', '') // Reset ward when state changes
                }}
                onLGAChange={(lga) => {
                  setValue('localGovernment', lga)
                  setValue('ward', '') // Reset ward when LGA changes
                }}
                onWardChange={(ward) => {
                  setValue('ward', ward)
                }}
                onPollingUnitChange={(pollingUnit) => {
                  setValue('pollingUnit', pollingUnit)
                }}
                errors={errors}
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Bank Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BanknotesIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register('bankName')}
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                    >
                      <option value="">Select bank</option>
                      {nigerianBanks.map(bank => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                    Account Name
                  </label>
                  <input
                    {...register('accountName')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter account name"
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    {...register('accountNumber')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter 10-digit account number"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label htmlFor="bvn" className="block text-sm font-medium text-gray-700">
                    BVN
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('bvn')}
                      type={showPasswords.bvn ? "text" : "password"}
                      className="input-field pr-10 border-2 w-full bg-gray-200 border-green-600"
                      placeholder="Enter 11-digit BVN"
                      maxLength={11}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('bvn')}
                    >
                      {showPasswords.bvn ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Employment Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">
                    Employment Status
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register('employmentStatus')}
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                    >
                      <option value="">Select employment status</option>
                      <option value="employed">Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="self-employed">Self-employed</option>
                      <option value="student">Student</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('startDate')}
                      type="date"
                      className="input-field pl-10 border-2 w-full bg-gray-100 border-green-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                    Salary (₦)
                  </label>
                  <input
                    {...register('salary')}
                    type="number"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter monthly salary"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700">
                    Commission Rate (%)
                  </label>
                  <input
                    {...register('commissionRate')}
                    type="number"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter commission rate"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Assignment Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assignedState" className="block text-sm font-medium text-gray-700">
                    Assigned State
                  </label>
                  <input
                    {...register('assignedState')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter assigned state"
                  />
                </div>

                <div>
                  <label htmlFor="assignedLGA" className="block text-sm font-medium text-gray-700">
                    Assigned LGA
                  </label>
                  <input
                    {...register('assignedLGA')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter assigned LGA"
                  />
                </div>

                <div>
                  <label htmlFor="assignedWard" className="block text-sm font-medium text-gray-700">
                    Assigned Ward
                  </label>
                  <input
                    {...register('assignedWard')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter assigned ward"
                  />
                </div>

                <div>
                  <label htmlFor="assignedPollingUnit" className="block text-sm font-medium text-gray-700">
                    Assigned Polling Unit
                  </label>
                  <input
                    {...register('assignedPollingUnit')}
                    type="text"
                    className="mt-1 input-field border-green-600 border-2 w-full bg-gray-200"
                    placeholder="Enter assigned polling unit"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active Account
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Deactivating this account will prevent the agent from logging in and registering new farmers.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Agent'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
