import { useState, useEffect, useCallback } from 'react'
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFarmers, setFilteredFarmers] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    state: '',
    gender: '',
    status: 'active'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchFarmers(1, true) // Reset to first page
  }, [session, status, filters])

  useEffect(() => {
    filterFarmers()
  }, [farmers, searchTerm])

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !loading &&
        !loadingMore
      ) {
        loadMoreFarmers()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadingMore, page])

  const fetchFarmers = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        search: searchTerm,
        state: filters.state,
        status: filters.status
      })

      const response = await fetch(`/api/farmers?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        const newFarmers = data.farmers || []
        
        if (reset || pageNum === 1) {
          setFarmers(newFarmers)
        } else {
          setFarmers(prev => [...prev, ...newFarmers])
        }
        
        setHasMore(newFarmers.length === 20) // If we got fewer than 20, no more pages
        setPage(pageNum)
      } else {
        console.error('Failed to fetch farmers:', response.status)
        if (reset) setFarmers([])
      }
    } catch (error) {
      console.error('Error fetching farmers:', error)
      if (reset) setFarmers([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreFarmers = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFarmers(page + 1, false)
    }
  }, [page, loadingMore, hasMore])

  const filterFarmers = () => {
    // Client-side filtering for search term only
    const farmersArray = Array.isArray(farmers) ? farmers : []
    let filtered = farmersArray

    // Text search (client-side for real-time feedback)
    if (searchTerm) {
      filtered = filtered.filter(farmer =>
        farmer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.nin.includes(searchTerm) ||
        farmer.phone.includes(searchTerm) ||
        (farmer.email && farmer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredFarmers(filtered)
  }

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
    setPage(1)
    setHasMore(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
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
              onChange={(e) => handleFilterChange('state', e.target.value)}
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
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
                {filteredFarmers.map((farmer) => (
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
                          title="View Farmer Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/farmers/${farmer.id}/certificate`}
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

          {filteredFarmers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No farmers found matching your criteria.</p>
            </div>
          )}

          {/* Infinite scroll loading indicator */}
          {loadingMore && (
            <div className="text-center py-4 border-t">
              <div className="inline-flex items-center">
                <div className="spinner-small"></div>
                <span className="ml-2 text-gray-500">Loading more farmers...</span>
              </div>
            </div>
          )}

          {!hasMore && farmers.length > 0 && (
            <div className="text-center py-4 border-t">
              <p className="text-gray-500">All farmers loaded</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredFarmers.length}</div>
              <div className="text-sm text-gray-500">Showing Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{(Array.isArray(farmers) ? farmers : []).length}</div>
              <div className="text-sm text-gray-500">Total Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(Array.isArray(farmers) ? farmers : []).filter(f => f.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">Active Farmers</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
