import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import { calculateMissingFarmSize } from '../lib/farmCalculations'
import hierarchicalData from '../data/hierarchical-data'
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
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function Farms() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedLGA, setSelectedLGA] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('')
  const [analytics, setAnalytics] = useState({
    overview: {
      totalFarms: 0,
      totalHectares: 0,
      averageFarmSize: 0,
      totalFarmers: 0
    },
    topStates: [],
    topLGAs: [],
    topPrimaryCrops: [],
    farmSizeDistribution: []
  })
  
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
    fetchAnalytics()
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
      
      // Calculate missing farm sizes using the utility
      const farmsWithCalculatedSizes = farmsData.map(farm => calculateMissingFarmSize(farm))
      
      setFarms(farmsWithCalculatedSizes)
      
      // Calculate stats
      calculateStats(farmsWithCalculatedSizes)
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

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/farms/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching farm analytics:', error)
    }
  }

  // Filter farms based on search and filters
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = !searchTerm || 
      farm.farmer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmer?.nin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.primaryCrop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmState?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmLocalGovernment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farmWard?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesState = !selectedState || farm.farmState?.toLowerCase() === selectedState.toLowerCase()
    const matchesLGA = !selectedLGA || farm.farmLocalGovernment?.toLowerCase() === selectedLGA.toLowerCase()
    const matchesCrop = !selectedCrop || farm.primaryCrop?.toLowerCase() === selectedCrop.toLowerCase()
    
    return matchesSearch && matchesState && matchesLGA && matchesCrop
  })

  // Get unique values for filters using hierarchical data where possible
  const getStatesFromHierarchicalData = () => {
    return hierarchicalData.map(item => ({
      value: item.state,
      label: item.state.charAt(0).toUpperCase() + item.state.slice(1)
    })).sort((a, b) => a.label.localeCompare(b.label))
  }

  const getLGAsForSelectedState = () => {
    if (!selectedState) return []
    const stateData = hierarchicalData.find(item => item.state.toLowerCase() === selectedState.toLowerCase())
    return stateData ? stateData.lgas.map(lga => ({
      value: lga.lga,
      label: lga.lga.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    })).sort((a, b) => a.label.localeCompare(b.label)) : []
  }

  const uniqueStates = getStatesFromHierarchicalData()
  const uniqueLGAs = getLGAsForSelectedState()
  const uniqueCrops = [...new Set(farms.map(farm => farm.primaryCrop).filter(Boolean))].sort()

  // Excel export function
  const exportToExcel = async () => {
    try {
      const dataToExport = filteredFarms.map(farm => ({
        'Farm ID': farm.id,
        'Farmer Name': `${farm.farmer?.firstName || ''} ${farm.farmer?.lastName || ''}`.trim(),
        'Farmer NIN': farm.farmer?.nin || '',
        'Farm Size (ha)': farm.farmSize || '',
        'Primary Crop': farm.primaryCrop || '',
        'Secondary Crop': farm.secondaryCrop || '',
        'State': farm.farmState || '',
        'LGA': farm.farmLocalGovernment || '',
        'Ward': farm.farmWard || '',
        'Farming Experience': farm.farmingExperience || '',
        'Farm Ownership': farm.farmOwnership || '',
        'Soil Type': farm.soilType || '',
        'Soil Fertility': farm.soilFertility || '',
        'Created Date': farm.createdAt ? new Date(farm.createdAt).toLocaleDateString() : '',
        'Latitude': farm.farmLatitude || '',
        'Longitude': farm.farmLongitude || ''
      }))

      // Convert to CSV format
      const csvContent = convertToCSV(dataToExport)
      downloadCSV(csvContent, `farms_export_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting farms:', error)
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
            {/* <Link
              href="/farms/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Farm
            </Link> */}
          </div>
        </div>

       <div className=' flex flex-col space-y-4'>
         {/* Enhanced Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analytics.overview.totalFarms.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Farms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{analytics.overview.totalHectares.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Hectares</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{analytics.overview.averageFarmSize}</div>
                <div className="text-sm text-gray-500">Avg Size (ha)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{analytics.overview.totalFarmers.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Unique Farmers</div>
              </div>
            </div>
          </div>

          {/* Top Primary Crops */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Primary Crops</h3>
            <div className="space-y-3">
              {analytics.topPrimaryCrops.slice(0, 5).map((crop, index) => (
                <div key={crop.crop} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{crop.crop}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{crop.farmCount}</div>
                    <div className="text-xs text-gray-500">{crop.totalHectares}ha</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top States */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top States by Farm Count</h3>
            <div className="">
              {analytics.topStates.slice(0, 10).map((state, index) => (
                <div key={state.state} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{state.state}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{state.farmCount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{state.totalHectares}ha ({state.percentage}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top LGAs */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Local Governments</h3>
            <div className="">
              {analytics.topLGAs.slice(0, 10).map((lga, index) => (
                <div key={`${lga.lga}-${lga.state}`} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{lga.lga}</div>
                      <div className="text-xs text-gray-500 capitalize">{lga.state} State</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{lga.farmCount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{lga.totalHectares}ha</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Farm Size Distribution */}
        {analytics.farmSizeDistribution.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Size Distribution</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {analytics.farmSizeDistribution.map((range) => (
                <div key={range.range} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{range.count}</div>
                  <div className="text-sm text-gray-600">{range.range}</div>
                  <div className="text-xs text-gray-500">{range.percentage}% of farms</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedLGA('') // Reset LGA when state changes
                }}
              >
                <option value="">All States</option>
                {uniqueStates.map(state => (
                  <option key={state.value} value={state.value}>{state.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lga" className="block text-sm font-medium text-gray-700">
                Local Government Area
              </label>
              <select
                id="lga"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={selectedLGA}
                onChange={(e) => setSelectedLGA(e.target.value)}
                disabled={!selectedState}
              >
                <option value="">All LGAs</option>
                {uniqueLGAs.map(lga => (
                  <option key={lga.value} value={lga.value}>{lga.label}</option>
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

            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedState('')
                  setSelectedLGA('')
                  setSelectedCrop('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
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
                          Coordinates
                        </th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience (years)
                        </th> */}
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
                            <div className="flex items-center">
                              <span className={farm.calculatedSize ? 'text-blue-600' : 'text-gray-900'}>
                                {farm.farmSize ? parseFloat(farm.farmSize).toFixed(2) : 'N/A'}
                              </span>
                              {farm.calculatedSize && (
                                <span className="ml-1 text-xs text-blue-500" title="Calculated from polygon">
                                  *
                                </span>
                              )}
                            </div>
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
      </div>
    </Layout>
  )
}
