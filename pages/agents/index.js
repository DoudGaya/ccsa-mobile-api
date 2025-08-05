import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { 
  PlusIcon,
  UserIcon,
  EnvelopeIcon as MailIcon,
  PhoneIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

export default function Agents() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAgents, setFilteredAgents] = useState([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchAgents()
  }, [session, status])

  useEffect(() => {
    filterAgents()
  }, [agents, searchTerm])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?limit=100') // Get more agents
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setAgents(data.data.agents || [])
        } else {
          setAgents([])
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = () => {
    if (!searchTerm) {
      setFilteredAgents(agents)
      return
    }

    const filtered = agents.filter(agent =>
      agent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phoneNumber?.includes(searchTerm) ||
      agent.phone?.includes(searchTerm) ||
      agent.nin?.includes(searchTerm)
    )
    setFilteredAgents(filtered)
  }

  const handleDeleteAgent = async (agentId, agentName) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        alert('Agent deleted successfully')
        fetchAgents() // Refresh the list
      } else {
        alert(data.message || 'Failed to delete agent')
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Failed to delete agent')
    }
  }

  const handleResetPassword = async (agentId, agentName) => {
    if (!confirm(`Are you sure you want to reset the password for agent "${agentName}"? The password will be reset to the default.`)) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        alert(`Password reset successfully. New password: ${data.data.newPassword}`)
      } else {
        alert(data.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Failed to reset password')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Agents">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Layout title="Agents Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Enrollment Agents</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage enrollment agents who register farmers in the field.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link 
              href="/agents/new"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Agent
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search agents by name, email, or phone..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {agent.agent?.photoUrl ? (
                        <img 
                          src={agent.agent.photoUrl} 
                          alt={agent.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {agent.fullName || agent.displayName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {agent.role === 'agent' ? 'Enrollment Agent' : agent.role}
                      {agent.agent?.nin && (
                        <span className="ml-2 text-xs text-blue-600">
                          NIN: {agent.agent.nin.slice(-4)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <MailIcon className="h-4 w-4 mr-2" />
                    {agent.email}
                    {agent.isVerified && (
                      <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                    )}
                  </div>
                  {(agent.phoneNumber || agent.phone) && (
                    <div className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {agent.phoneNumber || agent.phone}
                    </div>
                  )}
                  {agent.assignedState && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {agent.assignedState}
                        {agent.assignedLGA && ` • ${agent.assignedLGA}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {agent.totalFarmersRegistered || agent._count?.farmers || 0}
                    </div>
                    <div className="text-xs text-gray-500">Farmers</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {agent.lastLogin ? formatDate(agent.lastLogin) : 'Never'}
                    </div>
                    <div className="text-xs text-gray-500">Last Login</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDate(agent.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500">Created</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Link 
                    href={`/agents/${agent.id}`}
                    className="btn-secondary text-center flex items-center justify-center text-sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link 
                    href={`/agents/${agent.id}/edit`}
                    className="btn-primary text-center flex items-center justify-center text-sm"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleResetPassword(agent.id, agent.fullName)}
                    className="btn-secondary text-center flex items-center justify-center text-sm"
                  >
                    <KeyIcon className="h-4 w-4 mr-1" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id, agent.fullName)}
                    className="bg-red-600 text-white px-3 py-2 rounded-md text-center flex items-center justify-center text-sm hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new agent.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link 
                  href="/agents/new"
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Agent
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{agents.length}</div>
              <div className="text-sm text-gray-500">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.isActive).length}
              </div>
              <div className="text-sm text-gray-500">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {agents.filter(a => !a.isActive).length}
              </div>
              <div className="text-sm text-gray-500">Inactive Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agents.reduce((total, agent) => total + (agent._count?.farmers || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total Registrations</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
