import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { PermissionGate, PERMISSIONS } from '../../components/PermissionProvider'
import { 
  PlusIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function Agents() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAgents, setFilteredAgents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [filters, setFilters] = useState({
    state: '',
    status: 'active'
  })

  // Helper function to capitalize text
  const capitalize = (text) => {
    if (!text) return ''
    return text.toString().toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never'
    const now = new Date()
    const date = new Date(dateString)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchAgents()
  }, [session, status])

  // Fetch attendance data after agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      fetchAttendanceData()
    }
  }, [agents])

  useEffect(() => {
    filterAgents()
  }, [agents, searchTerm, filters])

  const fetchAgents = async () => {
    try {
      // Try main API first
      let response = await fetch('/api/agents')
      
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || data)
      } else {
        setAgents([])
      }
    } catch (error) {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      // For each agent, fetch their attendance summary using userId
      const attendancePromises = agents.map(async (agent) => {
        try {
          const response = await fetch(`/api/agents/attendance-summary?userId=${agent.id}`)
          if (response.ok) {
            const data = await response.json()
            return {
              agentId: agent.id,
              attendanceRate: data.attendanceRate || 0,
              presentDays: data.presentDays || 0,
              totalDays: data.totalDays || 30,
              checkIns: data.checkIns || 0,
              checkOuts: data.checkOuts || 0
            }
          }
        } catch (error) {
          console.error(`Failed to fetch attendance for agent ${agent.id}:`, error)
        }
        return {
          agentId: agent.id,
          attendanceRate: 0,
          presentDays: 0,
          totalDays: 30,
          checkIns: 0,
          checkOuts: 0
        }
      })
      
      const attendanceResults = await Promise.all(attendancePromises)
      const attendanceMap = {}
      attendanceResults.forEach(result => {
        attendanceMap[result.agentId] = result
      })
      
      setAttendanceData(attendanceMap)
    } catch (error) {
      console.error('Failed to fetch attendance data:', error)
    }
  }

  const filterAgents = () => {
    let filtered = Array.isArray(agents) ? agents : []

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone?.includes(searchTerm)
      )
    }

    // State filter
    if (filters.state) {
      filtered = filtered.filter(agent => agent.state === filters.state)
    }

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(agent => agent.isActive !== false)
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(agent => agent.isActive === false)
    }

    setFilteredAgents(filtered)
  }

  // Excel export function
  const exportToExcel = async () => {
    try {
      const dataToExport = filteredAgents.map(agent => ({
        'Agent ID': agent.id,
        'First Name': agent.firstName || '',
        'Last Name': agent.lastName || '',
        'Email': agent.email || '',
        'Phone Number': agent.phoneNumber || '',
        'State': agent.state || '',
        'LGA': agent.lga || '',
        'Ward': agent.ward || '',
        'Status': agent.isActive !== false ? 'Active' : 'Inactive',
        'Role': agent.role || '',
        'Registration Date': agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '',
        'Last Updated': agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : '',
        'Attendance Rate': attendanceData[agent.id] ? `${attendanceData[agent.id].attendanceRate}%` : 'N/A',
        'Present Days': attendanceData[agent.id] ? attendanceData[agent.id].presentDays : 0,
        'Total Days': attendanceData[agent.id] ? attendanceData[agent.id].totalDays : 0
      }))

      // Convert to CSV format
      const csvContent = convertToCSV(dataToExport)
      downloadCSV(csvContent, `agents_export_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting agents:', error)
      alert('Error exporting data')
    }
  }

  const convertToCSV = (data) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handler functions
  const handleResetPassword = async (agentId) => {
    if (confirm('Are you sure you want to reset this agent\'s password?')) {
      try {
        const response = await fetch(`/api/agents/${agentId}/reset-password`, {
          method: 'POST'
        });
        if (response.ok) {
          alert('Password reset email sent successfully');
        } else {
          alert('Failed to reset password');
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password');
      }
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (confirm('Are you sure you want to delete this agent? This will permanently delete both the database record and Firebase authentication. This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/agents/${agentId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const result = await response.json();
          setAgents(agents.filter(a => a.id !== agentId));
          
          // Show detailed success message
          let message = `Agent ${result.details.email} deleted successfully from database`;
          if (result.details.firebaseDeleted) {
            message += ' and Firebase authentication';
          } else if (result.warning) {
            message += ', but Firebase deletion failed or user was not found in Firebase';
          }
          alert(message);
          
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete agent');
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Error deleting agent');
      }
    }
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

        {/* Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredAgents.length}</div>
              <div className="text-sm text-gray-500">Showing Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{agents.length}</div>
              <div className="text-sm text-gray-500">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {agents.filter(a => a.isActive !== false).length}
              </div>
              <div className="text-sm text-gray-500">Active Agents</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="relative">
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

            {/* State Filter */}
            <select
              className="form-input"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="">All States</option>
              <option value="Lagos">Lagos</option>
              <option value="Kano">Kano</option>
              <option value="Rivers">Rivers</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Ogun">Ogun</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Agent</th>
                  <th className="table-header-cell">Contact</th>
                  <th className="table-header-cell">Location</th>
                  <th className="table-header-cell">Farmers Registered</th>
                  <th className="table-header-cell">Attendance (30d)</th>
                  <th className="table-header-cell">Last Login</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {capitalize(agent.displayName || `${agent.firstName} ${agent.lastName}`)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {capitalize(agent.role === 'agent' ? 'Enrollment Agent' : agent.role)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{agent.email}</div>
                      <div className="text-sm text-gray-500">{agent.phone}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{capitalize(agent.state)}</div>
                      <div className="text-sm text-gray-500">{capitalize(agent.lga)}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {agent.farmerStats?.totalRegistered || agent._count?.farmers || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.farmerStats?.activeThisMonth || 0} this month
                      </div>
                    </td>
                    <td className="table-cell">
                      {attendanceData[agent.id] ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendanceData[agent.id].attendanceRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {attendanceData[agent.id].presentDays}/{attendanceData[agent.id].totalDays} days
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Loading...</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{getTimeAgo(agent.lastLogin)}</div>
                      <div className="text-xs text-gray-500">{formatDate(agent.lastLogin)}</div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/agents/${agent.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link 
                          href={`/agents/${agent.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Agent"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button 
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Reset Password"
                          onClick={() => handleResetPassword(agent.id)}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          title="Delete Agent"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
              <p className="mt-1 text-sm text-gray-500">No agents match your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
