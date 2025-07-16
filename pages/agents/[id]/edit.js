import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { useForm } from 'react-hook-form'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function EditAgent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm()

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
      const response = await fetch(`/api/agents/${id}`)
      if (!response.ok) throw new Error('Failed to fetch agent details')
      const data = await response.json()
      const agentData = data.agent
      setAgent(agentData)
      
      // Set form values
      setValue('displayName', agentData.displayName || '')
      setValue('firstName', agentData.firstName || '')
      setValue('lastName', agentData.lastName || '')
      setValue('email', agentData.email || '')
      setValue('phoneNumber', agentData.phoneNumber || '')
      setValue('state', agentData.state || '')
      setValue('lga', agentData.lga || '')
      setValue('isActive', agentData.isActive)
    } catch (error) {
      console.error('Error fetching agent:', error)
      setError('Failed to load agent details')
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
                    Display Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('displayName', { required: 'Display name is required' })}
                      type="text"
                      className="input-field pl-10"
                      placeholder="Enter display name"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="input-field pl-10"
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('phoneNumber', { 
                        pattern: {
                          value: /^[0-9]{11}$/,
                          message: 'Phone number must be 11 digits'
                        }
                      })}
                      type="tel"
                      className="input-field pl-10"
                      placeholder="08012345678"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    {...register('state')}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label htmlFor="lga" className="block text-sm font-medium text-gray-700">
                    Local Government Area
                  </label>
                  <input
                    {...register('lga')}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter LGA"
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
