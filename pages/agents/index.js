import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { PermissionGate, PERMISSIONS } from '../../components/PermissionProvider'
import { TableLoader } from '../../components/PageLoader'
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
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  })
  const [currentPage, setCurrentPage] = useState(1)

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
    
    fetchAgents(currentPage)
  }, [session, status, currentPage])

  // Fetch attendance data after agents are loaded
  useEffect(() => {
    if (agents.length > 0) {
      fetchAttendanceData()
    }
  }, [agents])

  useEffect(() => {
    // Filter agents instantly when search or filters change
    filterAgents()
  }, [agents, searchTerm, filters.state, filters.status])

  const fetchAgents = async (page = 1) => {
    try {
      setLoading(true)
      const offset = (page - 1) * pagination.limit
      
      // Try main API first with pagination params
      let response = await fetch(`/api/agents?limit=${pagination.limit}&offset=${offset}`)
      
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || data)
        if (data.pagination) {
          setPagination(data.pagination)
        }
        if (data.total !== undefined) {
          setPagination(prev => ({ ...prev, total: data.total }))
        }
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
        <div className="space-y-6">
          <TableLoader />
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

        {/* Analytics Summary */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agent Performance Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">Overview of agent activity and performance metrics</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Agents */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Agents</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{pagination.total || agents.length}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {filteredAgents.length} showing
                    </p>
                  </div>
                  <div className="bg-blue-200 rounded-full p-3">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Active Agents */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Agents</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {agents.filter(a => a.isActive !== false).length}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {((agents.filter(a => a.isActive !== false).length / (agents.length || 1)) * 100).toFixed(0)}% of total
                    </p>
                  </div>
                  <div className="bg-green-200 rounded-full p-3">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Farmers Registered */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Farmers Registered</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {agents.reduce((sum, agent) => sum + (agent.farmerStats?.totalRegistered || agent._count?.farmers || 0), 0)}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Avg: {agents.length > 0 ? Math.round(agents.reduce((sum, agent) => sum + (agent.farmerStats?.totalRegistered || agent._count?.farmers || 0), 0) / agents.length) : 0} per agent
                    </p>
                  </div>
                  <div className="bg-purple-200 rounded-full p-3">
                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Attendance */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Avg Attendance</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {Object.keys(attendanceData).length > 0
                        ? Math.round(Object.values(attendanceData).reduce((sum, data) => sum + data.attendanceRate, 0) / Object.values(attendanceData).length)
                        : 0}%
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Last 30 days
                    </p>
                  </div>
                  <div className="bg-orange-200 rounded-full p-3">
                    <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Performance Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Top Performer</div>
                <div className="text-lg font-semibold text-gray-900">
                  {agents.length > 0
                    ? capitalize(agents.reduce((top, agent) => 
                        (agent.farmerStats?.totalRegistered || agent._count?.farmers || 0) > 
                        (top.farmerStats?.totalRegistered || top._count?.farmers || 0) ? agent : top
                      ).displayName || 'N/A')
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {agents.length > 0
                    ? `${agents.reduce((top, agent) => 
                        (agent.farmerStats?.totalRegistered || agent._count?.farmers || 0) > 
                        (top.farmerStats?.totalRegistered || top._count?.farmers || 0) ? agent : top
                      ).farmerStats?.totalRegistered || agents.reduce((top, agent) => 
                        (agent.farmerStats?.totalRegistered || agent._count?.farmers || 0) > 
                        (top.farmerStats?.totalRegistered || top._count?.farmers || 0) ? agent : top
                      )._count?.farmers || 0} farmers`
                    : '0 farmers'}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Active This Month</div>
                <div className="text-lg font-semibold text-gray-900">
                  {agents.reduce((sum, agent) => sum + (agent.farmerStats?.activeThisMonth || 0), 0)}
                </div>
                <div className="text-xs text-gray-500">New registrations</div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Inactive Agents</div>
                <div className="text-lg font-semibold text-red-600">
                  {agents.filter(a => a.isActive === false).length}
                </div>
                <div className="text-xs text-gray-500">
                  Requires attention
                </div>
              </div>
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

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasMore}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    !pagination.hasMore
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{pagination.offset + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        const totalPages = Math.ceil(pagination.total / pagination.limit)
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1)
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        )
                      })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!pagination.hasMore}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        !pagination.hasMore
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
