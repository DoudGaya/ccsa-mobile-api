import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import Link from 'next/link'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  CalendarIcon,
  UsersIcon,
  PencilIcon,
  ChartBarIcon,
  MapPinIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function AgentDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  
  // State management
  const [agent, setAgent] = useState(null)
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    recentRegistrations: 0
  })
  const [attendance, setAttendance] = useState([])
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    missedDays: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Effects
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (id && session) {
      fetchAgentDetails()
      fetchAttendanceData()
    }
  }, [id, session, status])

  // API Functions
  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      
      // Try the primary API endpoint first
      let response = await fetch(`/api/agents/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setAgent(data)
        
        // Set stats from the real data
        setStats({
          totalFarmers: data.farmerStats?.totalRegistered || data._count?.farmers || 0,
          activeFarmers: data.farmerStats?.activeThisMonth || 0,
          recentRegistrations: data.farmerStats?.activeThisWeek || 0
        })
      } else {
        // Fallback to secondary API endpoint
        const fallbackResponse = await fetch(`/api/agents-details/${id}`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setAgent(fallbackData)
          setStats({
            totalFarmers: fallbackData.farmerStats?.totalRegistered || fallbackData._count?.farmers || 0,
            activeFarmers: fallbackData.farmerStats?.activeThisMonth || 0,
            recentRegistrations: fallbackData.farmerStats?.activeThisWeek || 0
          })
        } else {
          throw new Error('Failed to fetch agent details')
        }
      }
    } catch (error) {
      console.error('Error fetching agent details:', error)
      setError('Failed to load agent details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(`/api/attendance?agentId=${id}&limit=30`)
      
      if (response.ok) {
        const data = await response.json()
        const records = data.records || []
        setAttendance(records)
        
        // Calculate attendance statistics
        const totalDays = records.length
        const presentDays = records.filter(record => 
          record.checkInTime && record.checkOutTime
        ).length
        const missedDays = Math.max(0, 30 - totalDays)
        const attendanceRate = totalDays > 0 ? ((presentDays / Math.max(totalDays, 30)) * 100) : 0
        
        setAttendanceStats({
          totalDays,
          presentDays,
          missedDays,
          attendanceRate: Math.round(attendanceRate)
        })
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error)
    }
  }

  // Helper functions
  const capitalizeFirstLetter = (string) => {
    if (!string) return ''
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  const calculateHoursWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A'
    const checkInTime = new Date(checkIn)
    const checkOutTime = new Date(checkOut)
    const hours = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    return hours.toFixed(1)
  }

  const getAttendanceStatus = (record) => {
    if (record.checkOutTime) return { status: 'Complete', color: 'green' }
    if (record.checkInTime) return { status: 'In Progress', color: 'yellow' }
    return { status: 'Absent', color: 'red' }
  }

  // Loading state
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

  // Error state
  if (error) {
    return (
      <Layout title="Agent Details">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Agent not found state
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

  // Main render
  return (
    <Layout title={agent.displayName || `${agent.firstName} ${agent.lastName}`}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {agent.displayName || `${agent.firstName} ${agent.lastName}`}
                </h1>
                <p className="text-sm text-gray-500">Agent ID: {agent.id}</p>
              </div>
              <div className="flex space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agent.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
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
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Agent Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Agent Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <div className="mt-1 flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{agent.displayName || 'Not set'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 flex items-center">
                      <MailIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{agent.email}</span>
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
            {(agent.state || agent.lga) && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Location Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agent.state && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <div className="mt-1 flex items-center">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{agent.state}</span>
                        </div>
                      </div>
                    )}
                    {agent.lga && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Local Government Area</label>
                        <span className="text-sm text-gray-900">{agent.lga}</span>
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
                        <p className="text-2xl font-bold text-blue-900">{stats.totalFarmers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Active Farmers</p>
                        <p className="text-2xl font-bold text-green-900">{stats.activeFarmers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">This Month</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.recentRegistrations}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Farmers Table */}
            {agent.farmers && agent.farmers.length > 0 && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Registered Farmers ({agent.farmers.length})
                  </h2>
                </div>
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Farmer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {agent.farmers.map((farmer) => (
                          <tr key={farmer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {capitalizeFirstLetter(farmer.firstName)} {capitalizeFirstLetter(farmer.lastName)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    NIN: {farmer.nin}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{farmer.phone}</div>
                              {farmer.email && (
                                <div className="text-sm text-gray-500">{farmer.email}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {capitalizeFirstLetter(farmer.state)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {capitalizeFirstLetter(farmer.lga)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (farmer.status || 'active') === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {capitalizeFirstLetter(farmer.status || 'active')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(farmer.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/farmers/${farmer.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4 inline" />
                              </Link>
                              <Link 
                                href={`/certificates/farmer/${farmer.id}`}
                                className="text-green-600 hover:text-green-900"
                                title="View Certificate"
                              >
                                <DocumentTextIcon className="h-4 w-4 inline" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* View All Link */}
                  {agent.farmers.length >= 10 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <Link 
                        href={`/farmers?agent=${agent.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View all farmers registered by this agent →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Farmers Message */}
            {agent.farmers && agent.farmers.length === 0 && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Registered Farmers</h2>
                </div>
                <div className="px-6 py-12 text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No farmers registered</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This agent hasn't registered any farmers yet.
                  </p>
                </div>
              </div>
            )}

            {/* Attendance Records */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Recent Attendance Records ({attendance.length})
                </h2>
              </div>
              
              {attendance.length > 0 ? (
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-in Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-out Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours Worked
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance.map((record) => {
                          const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
                          const checkOutTime = record.checkOutTime ? new Date(record.checkOutTime) : null;
                          const hoursWorked = calculateHoursWorked(record.checkInTime, record.checkOutTime);
                          const attendanceStatus = getAttendanceStatus(record);
                          
                          return (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checkInTime ? checkInTime.toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checkInTime ? checkInTime.toLocaleTimeString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checkOutTime ? checkOutTime.toLocaleTimeString() : 'Still working'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {hoursWorked} {hoursWorked !== 'N/A' ? 'hours' : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.checkInLocation && (
                                  <div className="flex items-center">
                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                    <span className="truncate max-w-xs">
                                      {record.checkInLocation.latitude?.toFixed(4)}, {record.checkInLocation.longitude?.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  attendanceStatus.color === 'green' 
                                    ? 'bg-green-100 text-green-800'
                                    : attendanceStatus.color === 'yellow'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {attendanceStatus.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This agent hasn't logged any attendance yet.
                  </p>
                </div>
              )}
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
                    agent.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
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
                <button className={`w-full ${agent.isActive ? 'btn-danger' : 'btn-success'}`}>
                  {agent.isActive ? 'Deactivate' : 'Activate'} Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}