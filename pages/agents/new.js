import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { useForm } from 'react-hook-form'

export default function NewAgent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  if (status === 'loading') {
    return (
      <Layout title="Create New Agent">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
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
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Agent created successfully! Temporary password: ${result.tempPassword}`)
        reset()
        setTimeout(() => {
          router.push('/agents')
        }, 3000)
      } else {
        setError(result.message || 'Failed to create agent')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create New Agent">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create New Enrollment Agent
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a new agent account. The agent will receive login credentials via email.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="form-label">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('firstName', { 
                      required: 'First name is required',
                      minLength: { value: 2, message: 'First name must be at least 2 characters' }
                    })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    {...register('lastName', { 
                      required: 'Last name is required',
                      minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                    })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g., +234 812 345 6789"
                  {...register('phoneNumber', {
                    pattern: {
                      value: /^(\+234|0)[789]\d{9}$/,
                      message: 'Please enter a valid Nigerian phone number'
                    }
                  })}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Display Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="How the name should appear in the system"
                  {...register('displayName')}
                />
                <p className="mt-1 text-sm text-gray-500">
                  If not provided, will use "First Name Last Name"
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/agents')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
