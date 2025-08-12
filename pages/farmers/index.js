import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon as SearchIcon,
  EyeIcon,
  DocumentTextIcon,
  FunnelIcon as FilterIcon 
} from '@heroicons/react/24/outline'

export default function Farmers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFarmers, setFilteredFarmers] = useState([])
  const [filters, setFilters] = useState({
    state: '',
    gender: '',
    status: 'active'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchFarmers()
  }, [session, status, pagination.page])

  useEffect(() => {
    // Reset to first page when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchFarmers()
    }
  }, [searchTerm, filters])

  const fetchFarmers = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filters.state) params.append('state', filters.state)
      
      // Use the real API first
      const response = await fetch(`/api/farmers?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Real farmers data received:', data)
        setFarmers(data.farmers || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farmers">
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

          {/* Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{farmers.length}</div>
              <div className="text-sm text-gray-500">Current Page</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
              <div className="text-sm text-gray-500">Total Farmers</div>
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
              <option value="Kano">Kano</option>
              <option value="Lagos">Lagos</option>
              <option value="Kaduna">Kaduna</option>
              {/* Add more states as needed */}
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
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
                  <th className="table-header-cell">Registration Date</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {farmers.map((farmer) => (
                  <tr key={farmer.id}>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">
                        {farmer.firstName} {farmer.middleName} {farmer.lastName}
                      </div>
                      <div className="text-gray-500">{farmer.email}</div>
                    </td>
                    <td className="table-cell">{farmer.nin}</td>
                    <td className="table-cell">{farmer.phone}</td>
                    <td className="table-cell">{farmer.state}</td>
                    <td className="table-cell">{farmer.lga}</td>
                    <td className="table-cell">{formatDate(farmer.createdAt)}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        farmer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {farmer.status}
                      </span>
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
                        <Link
                          href={`/certificates/farmer/${farmer.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="View Certificate"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
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
        {pagination.pages > 1 && (
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
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> pages ({pagination.total} total farmers)
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
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i
                    if (pageNum > pagination.pages) return null
                    
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
                    disabled={pagination.page >= pagination.pages}
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
