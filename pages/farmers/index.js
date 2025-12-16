import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { usePermissions, PermissionGate, PERMISSIONS } from '../../components/PermissionProvider'
import hierarchicalData from '../../data/hierarchical-data'
import { TableLoader } from '../../components/PageLoader'
import { 
  MagnifyingGlassIcon as SearchIcon,
  EyeIcon,
  DocumentTextIcon,
  PencilIcon,
  FunnelIcon as FilterIcon,
  ArrowDownTrayIcon,
  MapIcon,
} from '@heroicons/react/24/outline'

export default function Farmers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const [farmers, setFarmers] = useState([]) // All farmers from API
  const [loading, setLoading] = useState(true) // Only for initial load
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    state: '',
    gender: '',
    status: 'all',
    cluster: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [analytics, setAnalytics] = useState({
    overview: {
      totalFarmers: 0,
      totalHectares: 0,
      totalFarms: 0,
      verificationRate: 0,
      farmRegistrationRate: 0
    },
    topStates: [],
    topLGAs: [],
    topCrops: []
  })
  const [availableStates, setAvailableStates] = useState([])
  const [availableClusters, setAvailableClusters] = useState([])

  useEffect(() => {
    console.log('Farmers Page - Effect triggered:', { 
      status, 
      session: !!session, 
      permissionsLoading,
      hasPermission: typeof hasPermission 
    })
    
    if (status === 'loading') {
      console.log('Farmers Page - Session still loading')
      return
    }
    
    if (permissionsLoading) {
      console.log('Farmers Page - Permissions still loading')
      return
    }
    
    if (!session) {
      console.log('Farmers Page - No session, redirecting to signin')
      router.push('/auth/signin')
      return
    }
    
    console.log('Farmers Page - Session exists:', {
      userId: session.user?.id,
      email: session.user?.email,
      role: session.user?.role
    })
    
    // Check permissions
    const hasFarmersRead = hasPermission(PERMISSIONS.FARMERS_READ)
    console.log('Farmers Page - Permission check:', {
      farmersReadPermission: PERMISSIONS.FARMERS_READ,
      hasFarmersRead,
      hasPermissionFunction: typeof hasPermission
    })
    
    if (!hasFarmersRead) {
      console.log('Farmers Page - No FARMERS_READ permission, redirecting to dashboard')
      router.push('/dashboard')
      return
    }
    
    console.log('Farmers Page - All checks passed, fetching farmers')
    fetchFarmers()
    fetchAnalytics()
    fetchAvailableStates()
    fetchAvailableClusters()
  }, [session, status, hasPermission, permissionsLoading])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm, filters.state, filters.gender, filters.status, filters.cluster, filters.startDate, filters.endDate])

  const updateFarmerStatus = async (farmerId, newStatus) => {
    try {
      const response = await fetch('/api/farmers/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId,
          status: newStatus
        })
      })

      if (response.ok) {
        // Update the local farmers list
        setFarmers(prevFarmers => 
          prevFarmers.map(farmer => 
            farmer.id === farmerId 
              ? { ...farmer, status: newStatus }
              : farmer
          )
        )
        
        // Also update filtered farmers if they exist
        setFilteredFarmers(prevFiltered =>
          prevFiltered.map(farmer =>
            farmer.id === farmerId
              ? { ...farmer, status: newStatus }
              : farmer
          )
        )
      } else {
        throw new Error('Failed to update farmer status')
      }
    } catch (error) {
      console.error('Error updating farmer status:', error)
      alert('Failed to update farmer status. Please try again.')
    }
  }

  const fetchFarmers = async () => {
    try {
      setLoading(true)
      
      // Fetch ALL farmers once - we'll filter client-side for instant results
      const response = await fetch('/api/farmers?limit=10000')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Farmers data received:', data.farmers?.length || 0, 'farmers')
        setFarmers(data.farmers || [])
      } else {
        console.log('Real API failed, trying fallback...')
        // Only use fallback if real API fails
        const fallbackResponse = await fetch('/api/farmers-fallback?limit=1000')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          console.log('Fallback farmers data received:', fallbackData)
          setFarmers(fallbackData.farmers || fallbackData)
          setPagination(prev => ({
            ...prev,
            total: (fallbackData.farmers || fallbackData).length,
            pages: 1
          }))
        } else {
          console.error('Both APIs failed')
          setFarmers([])
        }
      }
    } catch (error) {
      console.error('Error fetching farmers, trying fallback:', error)
      try {
        const response = await fetch('/api/farmers-fallback?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setFarmers(data.farmers || data)
          setPagination(prev => ({
            ...prev,
            total: (data.farmers || data).length,
            pages: 1
          }))
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
        setFarmers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/farmers/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else if (response.status === 503) {
        // Database temporarily unavailable
        console.warn('Database temporarily unavailable for analytics')
        setAnalytics({
          overview: {
            totalFarmers: 0,
            totalHectares: 0,
            totalFarms: 0,
            verificationRate: 0,
            farmRegistrationRate: 0
          },
          topStates: [],
          topLGAs: [],
          topCrops: []
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set empty analytics to prevent UI from crashing
      setAnalytics({
        overview: {
          totalFarmers: 0,
          totalHectares: 0,
          totalFarms: 0,
          verificationRate: 0,
          farmRegistrationRate: 0
        },
        topStates: [],
        topLGAs: [],
        topCrops: []
      })
    }
  }

  // Excel export function
  const exportToExcel = async () => {
    try {
      // Get all farmers data for export (not just current page)
      const params = new URLSearchParams({
        limit: '10000', // Large number to get all farmers
      })
      
      // Add current filters to export
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.state) {
        params.append('state', filters.state)
      }
      if (filters.gender) {
        params.append('gender', filters.gender)
      }
      if (filters.cluster) {
        params.append('cluster', filters.cluster)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/farmers?${params}`)
      let allFarmers = []
      
      if (response.ok) {
        const data = await response.json()
        allFarmers = data.farmers || []
      } else {
        // Fallback to current farmers if API fails
        allFarmers = farmers
      }

      const dataToExport = allFarmers.map(farmer => ({
        'Farmer ID': farmer.id,
        'First Name': farmer.firstName || '',
        'Last Name': farmer.lastName || '',
        'NIN': farmer.nin || '',
        'Phone Number': farmer.phoneNumber || '',
        'Email': farmer.email || '',
        'Gender': farmer.gender || '',
        'Date of Birth': farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString() : '',
        'State': farmer.state || '',
        'LGA': farmer.lga || '',
        'Cluster': farmer.cluster?.title || '',
        'Cluster Lead': farmer.cluster ? `${farmer.cluster.clusterLeadFirstName} ${farmer.cluster.clusterLeadLastName}` : '',
        'Ward': farmer.ward || '',
        'Status': farmer.status || '',
        'Agent ID': farmer.agentId || '',
        'Registration Date': farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : '',
        'Last Updated': farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleDateString() : '',
        'Total Farms': farmer.farms?.length || 0,
        'Bank Name': farmer.bankName || '',
        'Account Number': farmer.accountNumber || '',
        'BVN': farmer.bvn || ''
      }))

      // Convert to CSV format
      const csvContent = convertToCSV(dataToExport)
      downloadCSV(csvContent, `farmers_export_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting farmers:', error)
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

  const fetchAvailableStates = async () => {
    try {
      const response = await fetch('/api/locations/states')
      if (response.ok) {
        const data = await response.json()
        setAvailableStates(data.states || [])
      }
    } catch (error) {
      console.error('Error fetching states:', error)
      // Fallback to some default states
      setAvailableStates([
        { name: 'Abia', code: 'AB' },
        { name: 'Adamawa', code: 'AD' },
        { name: 'Akwa Ibom', code: 'AK' },
        { name: 'Anambra', code: 'AN' },
        { name: 'Bauchi', code: 'BA' },
        { name: 'Bayelsa', code: 'BY' },
        { name: 'Benue', code: 'BN' },
        { name: 'Borno', code: 'BO' },
        { name: 'Cross River', code: 'CR' },
        { name: 'Delta', code: 'DE' },
        { name: 'Ebonyi', code: 'EB' },
        { name: 'Edo', code: 'ED' },
        { name: 'Ekiti', code: 'EK' },
        { name: 'Enugu', code: 'EN' },
        { name: 'FCT', code: 'FC' },
        { name: 'Gombe', code: 'GO' },
        { name: 'Imo', code: 'IM' },
        { name: 'Jigawa', code: 'JI' },
        { name: 'Kaduna', code: 'KD' },
        { name: 'Kano', code: 'KN' },
        { name: 'Katsina', code: 'KT' },
        { name: 'Kebbi', code: 'KE' },
        { name: 'Kogi', code: 'KO' },
        { name: 'Kwara', code: 'KW' },
        { name: 'Lagos', code: 'LA' },
        { name: 'Nasarawa', code: 'NA' },
        { name: 'Niger', code: 'NI' },
        { name: 'Ogun', code: 'OG' },
        { name: 'Ondo', code: 'ON' },
        { name: 'Osun', code: 'OS' },
        { name: 'Oyo', code: 'OY' },
        { name: 'Plateau', code: 'PL' },
        { name: 'Rivers', code: 'RI' },
        { name: 'Sokoto', code: 'SO' },
        { name: 'Taraba', code: 'TA' },
        { name: 'Yobe', code: 'YO' },
        { name: 'Zamfara', code: 'ZA' }
      ])
    }
  }

  const fetchAvailableClusters = async () => {
    try {
      const response = await fetch('/api/clusters?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setAvailableClusters(data.clusters || [])
      }
    } catch (error) {
      console.error('Error fetching clusters:', error)
      setAvailableClusters([])
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Client-side filtering - like users page (instant, no loading state)
  const filteredFarmers = farmers.filter(farmer => {
    // Search filter
    const matchesSearch = !searchTerm || 
      farmer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.nin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${farmer.firstName} ${farmer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    // State filter
    const matchesState = !filters.state || farmer.state === filters.state

    // Gender filter
    const matchesGender = !filters.gender || farmer.gender === filters.gender

    // Status filter
    const matchesStatus = filters.status === 'all' || farmer.status === filters.status

    // Cluster filter
    const matchesCluster = !filters.cluster || farmer.clusterId === filters.cluster

    // Date range filter
    let matchesDate = true
    if (filters.startDate || filters.endDate) {
      const farmerDate = new Date(farmer.createdAt)
      if (filters.startDate) {
        matchesDate = matchesDate && farmerDate >= new Date(filters.startDate)
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setDate(endDate.getDate() + 1) // Include end date
        matchesDate = matchesDate && farmerDate < endDate
      }
    }

    return matchesSearch && matchesState && matchesGender && matchesStatus && matchesCluster && matchesDate
  })

  // Pagination on filtered results (client-side)
  const paginatedFarmers = filteredFarmers.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  )

  const totalPages = Math.ceil(filteredFarmers.length / pagination.limit)

  if (status === 'loading' || permissionsLoading || loading) {
    return (
      <Layout title="Farmers">
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
    <Layout title="Farmers Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Farmers</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and view all registered farmers in the system.
            </p>
          </div>
        </div>

        {/* Enhanced Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-start p-3 rounded-md bg-stone-200 py-3">
                <div className="text-3xl font-bold text-gray-900">{analytics.overview.totalFarmers.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Registered Farmers</div>
              </div>
              <div className="text-start p-3 rounded-md bg-stone-200 py-3">
                <div className="text-3xl font-bold text-gray-900">{analytics.overview.totalHectares.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Hectares</div>
              </div>
              <div className="text-start p-3 rounded-md bg-stone-200 py-3">
                <div className="text-3xl font-bold text-gray-900">{analytics.overview.verificationRate}%</div>
                <div className="text-sm text-gray-500">Verified Farmers</div>
              </div>
              <div className="text-start p-3 rounded-md bg-stone-200 py-3">
                <div className="text-3xl font-bold text-gray-900">{analytics.overview.farmRegistrationRate}%</div>
                <div className="text-sm text-gray-500">Farms Captured</div>
              </div>
            </div>
          </div>

          {/* Top Crops */}
          <div className="lg:col-span-3 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Top Crops / Animals</h3>
            </div>
            <div className="p-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {analytics.topCrops.slice(0, 12).map((crop, index) => (
                <div key={crop.crop} className="flex flex-col p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-bold text-gray-900">{crop.count}</span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{crop.percentage}%</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 truncate" title={crop.crop}>{crop.crop}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top States */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Top States</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {analytics.topStates.slice(0, 10).map((state, index) => (
                <div key={state.state} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{state.state}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{state.count.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{state.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top LGAs */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Top Local Governments</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {analytics.topLGAs.slice(0, 10).map((lga, index) => (
                <div key={`${lga.lga}-${lga.state}`} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-4">{index + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{lga.lga}</div>
                      <div className="text-xs text-gray-500 capitalize">{lga.state} State</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{lga.count.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{lga.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Page Summary */}
        <div className=" shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Page Summary</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{paginatedFarmers.length}</div>
              <div className="text-sm text-gray-500">Farmers on Page</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredFarmers.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{searchTerm || filters.state || filters.gender || filters.cluster ? 'Filtered' : 'Total'} Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pagination.page}</div>
              <div className="text-sm text-gray-500">Current Page</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pagination.pages}</div>
              <div className="text-sm text-gray-500">Total Pages</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
            <PermissionGate permission={PERMISSIONS.FARMERS_EXPORT}>
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export to Excel
              </button>
            </PermissionGate>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search farmers..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* State Filter */}
            <select
              className="form-input"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="">All States</option>
              {availableStates.map(state => (
                <option key={state.name} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              className="form-input"
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="Enrolled">Enrolled</option>
              <option value="FarmCaptured">Farm Captured</option>
              <option value="Validated">Validated</option>
              <option value="Verified">Verified</option>
            </select>

            {/* Cluster Filter */}
            <select
              className="form-input"
              value={filters.cluster}
              onChange={(e) => setFilters({ ...filters, cluster: e.target.value })}
            >
              <option value="">All Clusters</option>
              {availableClusters.map(cluster => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.title} ({cluster._count?.farmers || 0} farmers)
                </option>
              ))}
            </select>

            {/* Date Filters */}
            <div className="flex space-x-2 items-center">
              <div className="flex-1">
                <label htmlFor="startDate" className="sr-only">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="flex-1">
                <label htmlFor="endDate" className="sr-only">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Farmers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">NIN</th>
                  <th className="table-header-cell">Phone</th>
                  <th className="table-header-cell">State</th>
                  <th className="table-header-cell">LGA</th>
                  <th className="table-header-cell">Cluster</th>
                  <th className="table-header-cell">Registration Date</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {paginatedFarmers.map((farmer) => (
                  <tr key={farmer.id}>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">
                        {farmer.firstName} {farmer.middleName} {farmer.lastName}
                      </div>
                      <div className="text-gray-500">{farmer.email}</div>
                    </td>
                    <td className="table-cell">{farmer.nin}</td>
                    <td className="table-cell">{farmer.phone || farmer.phoneNumber}</td>
                    <td className="table-cell uppercase">{farmer.state}</td>
                    <td className="table-cell uppercase">{farmer.lga || farmer.localGovernment}</td>
                    <td className="table-cell">
                      {farmer.cluster ? (
                        <div>
                          <div className="font-medium text-gray-900">{farmer.cluster.title}</div>
                          <div className="text-gray-500 text-xs">
                            Lead: {farmer.cluster.clusterLeadFirstName} {farmer.cluster.clusterLeadLastName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No cluster assigned</span>
                      )}
                    </td>
                    <td className="table-cell">{formatDate(farmer.createdAt)}</td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          farmer.status === 'Verified'
                            ? 'bg-green-100 text-green-800'
                            : farmer.status === 'Validated'
                            ? 'bg-blue-100 text-blue-800'
                            : farmer.status === 'FarmCaptured'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {farmer.status}
                        </span>
                        {hasPermission(PERMISSIONS.FARMERS_UPDATE) && (
                          <select
                            className="text-xs border rounded px-1 py-0.5"
                            value={farmer.status}
                            onChange={(e) => updateFarmerStatus(farmer.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Enrolled">Enrolled</option>
                            <option value="FarmCaptured">Farm Captured</option>
                            <option value="Validated">Validated</option>
                            <option value="Verified">Verified</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/farmers/${farmer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <PermissionGate permission={PERMISSIONS.FARMERS_UPDATE}>
                          <Link
                            href={`/farmers/${farmer.id}/edit`}
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit Farmer"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                        </PermissionGate>
                        <Link
                          href={`/certificates/farmer/${farmer.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="View Certificate"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/farms?farmerId=${farmer.id}`}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Farmer's Farms"
                        >
                          <MapIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {farmers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No farmers found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> pages ({filteredFarmers.length} {searchTerm || filters.state || filters.gender || filters.cluster ? 'filtered' : 'total'} farmers)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, pagination.page - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      
      </div>
    </Layout>
  )
}
