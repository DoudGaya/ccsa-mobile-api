import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import {
  MapIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export default function FarmDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [farm, setFarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (id) {
      fetchFarm()
    }
  }, [session, status, router, id])

  const fetchFarm = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/farms/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Farm not found')
        }
        throw new Error('Failed to fetch farm details')
      }
      
      const data = await response.json()
      setFarm(data.farm)
    } catch (err) {
      console.error('Error fetching farm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFarm = async () => {
    if (!confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/farms/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete farm')
      }
      
      router.push('/farms')
    } catch (err) {
      console.error('Error deleting farm:', err)
      alert('Failed to delete farm')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farm Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Farm Details">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading farm</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={fetchFarm}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/farms"
                    className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    Back to Farms
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!farm) {
    return (
      <Layout title="Farm Not Found">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Farm not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The farm you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <Link
                href="/farms"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Farms
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Farm Details - ${farm.farmer?.firstName} ${farm.farmer?.lastName}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/farms"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Farms
              </Link>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/farms/${farm.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Farm
              </Link>
              <button
                onClick={handleDeleteFarm}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Farm
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Farm Details
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive information about this farm and its owner.
            </p>
          </div>
        </div>

        {/* Farm Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Farmer Information */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Farmer Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {farm.farmer?.firstName} {farm.farmer?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">NIN</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmer?.nin || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/farmers/${farm.farmer?.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Farmer Details →
                  </Link>
                </div>
              </div>
            </div>

            {/* Farm Information */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapIcon className="h-5 w-5 mr-2" />
                  Farm Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farm Size</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {farm.farmSize ? `${farm.farmSize} hectares` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Primary Crop</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.primaryCrop || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Secondary Crop</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.secondaryCrop || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Produce Category</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.produceCategory || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farm Ownership</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmOwnership || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farming Experience</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {farm.farmingExperience ? `${farm.farmingExperience} years` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farming Season</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmingSeason || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  Location Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">State</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmState || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Local Government</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmLocalGovernment || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Ward</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmWard || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Polling Unit</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmPollingUnit || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Soil Information */}
            {(farm.soilType || farm.soilPH || farm.soilFertility) && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 mr-2" />
                    Soil Information
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Soil Type</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.soilType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Soil pH</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.soilPH || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Soil Fertility</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.soilFertility || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Yield Information */}
            {(farm.year || farm.yieldSeason || farm.crop || farm.quantity) && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Yield Information
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Year</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Yield Season</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.yieldSeason || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Crop</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.crop || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Quantity</label>
                      <p className="mt-1 text-sm text-gray-900">{farm.quantity || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Coordinates */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Coordinates
                </h3>
              </div>
              <div className="px-6 py-4">
                {farm.farmLatitude && farm.farmLongitude ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Latitude</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {parseFloat(farm.farmLatitude).toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Longitude</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {parseFloat(farm.farmLongitude).toFixed(6)}
                      </p>
                    </div>
                    {farm.farmElevation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Elevation</label>
                        <p className="mt-1 text-sm text-gray-900">{farm.farmElevation}m</p>
                      </div>
                    )}
                    <div className="pt-3">
                      <a
                        href={`https://www.google.com/maps?q=${farm.farmLatitude},${farm.farmLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No coordinates available</p>
                )}
              </div>
            </div>

            {/* Farm Polygon */}
            {farm.farmPolygon && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Farm Polygon</h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-500 mb-3">Polygon coordinates:</p>
                  <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {typeof farm.farmPolygon === 'object' 
                        ? JSON.stringify(farm.farmPolygon, null, 2)
                        : farm.farmPolygon
                      }
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Technical Details
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Farm ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{farm.id}</p>
                </div>
                {farm.coordinateSystem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Coordinate System</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.coordinateSystem}</p>
                  </div>
                )}
                {farm.farmArea && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Farm Area</label>
                    <p className="mt-1 text-sm text-gray-900">{farm.farmArea}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {farm.createdAt ? new Date(farm.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {farm.updatedAt ? new Date(farm.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
