import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  CalendarIcon,
  UsersIcon,
  PencilIcon,
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

export default function AgentDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [agent, setAgent] = useState(null)
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    recentRegistrations: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      
      if (data.success) {
        setAgent(data.data.agent)
        setStats(data.data.stats)
      } else {
        setError(data.message || 'Failed to fetch agent details')
      }
    } catch (error) {
      console.error('Error fetching agent:', error)
      setError(error.message || 'Failed to fetch agent details')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Agent Details">
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

  if (error) {
    return (
      <Layout title="Agent Details">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
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
      <Layout title="Agent Details">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Agent not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested agent could not be found.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={agent.fullName || agent.displayName || `${agent.firstName} ${agent.lastName}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {agent.agent?.photoUrl ? (
                    <img 
                      src={agent.agent.photoUrl} 
                      alt={agent.fullName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {agent.fullName || agent.displayName || `${agent.firstName} ${agent.lastName}`}
                  </h1>
                  <p className="text-sm text-gray-500">Agent ID: {agent.id}</p>
                  {agent.agent?.nin && (
                    <p className="text-sm text-blue-600">NIN: {agent.agent.nin}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agent.isActive && agent.status === 'active'
                    ? 'bg-green-100 text-green-800' 
                    : agent.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : agent.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {agent.status === 'pending' ? 'Pending' : agent.isActive ? 'Active' : 'Inactive'}
                </span>
                <Link 
                  href={`/agents/${agent.id}/edit`}
                  className="btn-primary flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Agent
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Agent Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{agent.fullName || agent.displayName || 'Not set'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 flex items-center">
                      <MailIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{agent.email}</span>
                      {agent.isVerified && (
                        <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <span className="text-sm text-gray-900">{agent.firstName}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <span className="text-sm text-gray-900">{agent.lastName}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{agent.phone || agent.phoneNumber || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className="text-sm text-gray-900 capitalize">{agent.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(agent.assignedState || agent.assignedLGA || agent.agent?.state || agent.agent?.assignedState) && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Assignment Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(agent.assignedState || agent.agent?.assignedState) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned State</label>
                        <div className="mt-1 flex items-center">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{agent.assignedState || agent.agent?.assignedState}</span>
                        </div>
                      </div>
                    )}
                    {(agent.assignedLGA || agent.agent?.assignedLGA) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned LGA</label>
                        <span className="text-sm text-gray-900">{agent.assignedLGA || agent.agent?.assignedLGA}</span>
                      </div>
                    )}
                    {agent.agent?.assignedWards && agent.agent.assignedWards.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Assigned Wards</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {agent.agent.assignedWards.map((ward, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {ward}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Statistics */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Performance Statistics</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Farmers</p>
                        <p className="text-2xl font-bold text-blue-900">{stats?.totalFarmers || agent.totalFarmersRegistered || agent._count?.farmers || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Active Farmers</p>
                        <p className="text-2xl font-bold text-green-900">{stats?.activeFarmers || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">This Month</p>
                        <p className="text-2xl font-bold text-orange-900">{stats?.recentRegistrations || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Account Status</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.isActive && agent.status === 'active'
                      ? 'bg-green-100 text-green-800' 
                      : agent.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : agent.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.status === 'pending' ? 'Pending' : agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {agent.isVerified !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verification</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agent.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {agent.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {agent.lastLogin 
                        ? new Date(agent.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Created</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(agent.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <Link 
                  href={`/agents/${agent.id}/edit`}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Agent
                </Link>
                <button className="w-full btn-secondary">
                  View Farmers
                </button>
              </div>
            </div>

            {/* Additional Agent Details */}
            {agent.agent && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Agent Details</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {agent.agent.nin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">NIN</label>
                      <span className="text-sm text-gray-900">{agent.agent.nin}</span>
                    </div>
                  )}
                  {agent.agent.gender && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <span className="text-sm text-gray-900 capitalize">{agent.agent.gender}</span>
                    </div>
                  )}
                  {agent.agent.dateOfBirth && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <span className="text-sm text-gray-900">
                        {new Date(agent.agent.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {agent.agent.employmentType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                      <span className="text-sm text-gray-900 capitalize">{agent.agent.employmentType}</span>
                    </div>
                  )}
                  {agent.agent.bvn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">BVN</label>
                      <span className="text-sm text-gray-900">****{agent.agent.bvn.slice(-4)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
