import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import {
  MapIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

export default function Farms() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('')
  
  // Stats
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalLandSize: 0,
    avgLandSize: 0,
    topCrops: []
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchFarms()
  }, [session, status, router])

  const fetchFarms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/farms')
      if (!response.ok) {
        throw new Error('Failed to fetch farms')
      }
      
      const data = await response.json()
      const farmsData = data.farms || []
      setFarms(farmsData)
      
      // Calculate stats
      calculateStats(farmsData)
    } catch (err) {
      console.error('Error fetching farms:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (farmsData) => {
    const totalFarms = farmsData.length
    const totalLandSize = farmsData.reduce((sum, farm) => sum + (parseFloat(farm.farmSize) || 0), 0)
    const avgLandSize = totalFarms > 0 ? totalLandSize / totalFarms : 0
    
    // Get top crops
    const cropCounts = {}
    farmsData.forEach(farm => {
      if (farm.primaryCrop) {
        cropCounts[farm.primaryCrop] = (cropCounts[farm.primaryCrop] || 0) + 1
      }
    })
    
    const topCrops = Object.entries(cropCounts)
      .map(([crop, count]) => ({ crop, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    setStats({
      totalFarms,
      totalLandSize: Math.round(totalLandSize * 100) / 100,
      avgLandSize: Math.round(avgLandSize * 100) / 100,
      topCrops
    })
  }

  // Filter farms based on search and filters
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = !searchTerm || 
      farm.farmer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer?.nin?.includes(searchTerm) ||
      farm.primaryCrop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmState?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesState = !selectedState || farm.farmState === selectedState
    const matchesCrop = !selectedCrop || farm.primaryCrop === selectedCrop
    
    return matchesSearch && matchesState && matchesCrop
  })

  // Get unique values for filters
  const uniqueStates = [...new Set(farms.map(farm => farm.farmState).filter(Boolean))].sort()
  const uniqueCrops = [...new Set(farms.map(farm => farm.primaryCrop).filter(Boolean))].sort()

  const handleDeleteFarm = async (farmId) => {
    if (!confirm('Are you sure you want to delete this farm?')) return
    
    try {
      const response = await fetch(`/api/farms/${farmId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete farm')
      }
      
      setFarms(farms.filter(farm => farm.id !== farmId))
    } catch (err) {
      console.error('Error deleting farm:', err)
      alert('Failed to delete farm')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farms">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Farms">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading farms</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchFarms}
                className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Farm Management">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Farm Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and monitor farm data, locations, and agricultural information.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/farms/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Farm
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Farms</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalFarms}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Land (Hectares)</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalLandSize}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Land Size</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.avgLandSize} ha</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FunnelIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Top Crop</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.topCrops[0]?.crop || 'N/A'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search farmers, crops, states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                id="state"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="crop" className="block text-sm font-medium text-gray-700">
                Primary Crop
              </label>
              <select
                id="crop"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                <option value="">All Crops</option>
                {uniqueCrops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedState('')
                  setSelectedCrop('')
                }}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Farms Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {filteredFarms.length === 0 ? (
                  <div className="bg-white px-6 py-20 text-center">
                    <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No farms found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {farms.length === 0 
                        ? 'Get started by registering your first farm.'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                    {farms.length === 0 && (
                      <div className="mt-6">
                        <Link
                          href="/farms/new"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Farm
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Primary Crop
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farm Size (ha)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ownership
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFarms.map((farm) => (
                        <tr key={farm.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {farm.farmer?.firstName} {farm.farmer?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  NIN: {farm.farmer?.nin}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{farm.farmState}</div>
                            <div className="text-sm text-gray-500">{farm.farmLocalGovernment}</div>
                            <div className="text-sm text-gray-500">{farm.farmWard}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {farm.primaryCrop || 'N/A'}
                            </span>
                            {farm.secondaryCrop && (
                              <div className="mt-1">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {farm.secondaryCrop}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {farm.farmSize || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {farm.farmOwnership || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {farm.farmLatitude && farm.farmLongitude ? (
                              <div>
                                <div>Lat: {parseFloat(farm.farmLatitude).toFixed(4)}</div>
                                <div>Lng: {parseFloat(farm.farmLongitude).toFixed(4)}</div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <Link
                                href={`/farms/${farm.id}`}
                                className="text-green-600 hover:text-green-900"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              <Link
                                href={`/farms/${farm.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteFarm(farm.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Crops Summary */}
        {stats.topCrops.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Crops Distribution</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.topCrops.map((crop, index) => (
                <div key={crop.crop} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{crop.count}</div>
                  <div className="text-sm text-gray-600">{crop.crop}</div>
                  <div className="text-xs text-gray-500">
                    {((crop.count / stats.totalFarms) * 100).toFixed(1)}% of farms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
