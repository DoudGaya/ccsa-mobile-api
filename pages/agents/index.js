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
  PencilIcon 
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
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
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
      agent.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phoneNumber?.includes(searchTerm)
    )
    setFilteredAgents(filtered)
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
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {agent.displayName || agent.firstName + ' ' + agent.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {agent.role === 'agent' ? 'Enrollment Agent' : agent.role}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agent.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <MailIcon className="h-4 w-4 mr-2" />
                    {agent.email}
                  </div>
                  {agent.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {agent.phoneNumber}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {agent._count?.farmers || 0}
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

                <div className="mt-6 flex space-x-3">
                  <Link 
                    href={`/agents/${agent.id}`}
                    className="flex-1 btn-secondary text-center flex items-center justify-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link 
                    href={`/agents/${agent.id}/edit`}
                    className="flex-1 btn-primary text-center flex items-center justify-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
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
