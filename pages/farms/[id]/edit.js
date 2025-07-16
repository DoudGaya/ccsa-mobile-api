import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import Link from 'next/link'
import {
  MapIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function EditFarm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [farm, setFarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    farmSize: '',
    primaryCrop: '',
    secondaryCrop: '',
    produceCategory: '',
    farmOwnership: '',
    farmState: '',
    farmLocalGovernment: '',
    farmingSeason: '',
    farmWard: '',
    farmPollingUnit: '',
    farmingExperience: '',
    farmLatitude: '',
    farmLongitude: '',
    farmPolygon: '',
    soilType: '',
    soilPH: '',
    soilFertility: '',
    farmCoordinates: '',
    coordinateSystem: '',
    farmArea: '',
    farmElevation: '',
    year: '',
    yieldSeason: '',
    crop: '',
    quantity: '',
  })

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
      
      // Populate form data
      setFormData({
        farmSize: data.farm.farmSize || '',
        primaryCrop: data.farm.primaryCrop || '',
        secondaryCrop: data.farm.secondaryCrop || '',
        produceCategory: data.farm.produceCategory || '',
        farmOwnership: data.farm.farmOwnership || '',
        farmState: data.farm.farmState || '',
        farmLocalGovernment: data.farm.farmLocalGovernment || '',
        farmingSeason: data.farm.farmingSeason || '',
        farmWard: data.farm.farmWard || '',
        farmPollingUnit: data.farm.farmPollingUnit || '',
        farmingExperience: data.farm.farmingExperience || '',
        farmLatitude: data.farm.farmLatitude || '',
        farmLongitude: data.farm.farmLongitude || '',
        farmPolygon: typeof data.farm.farmPolygon === 'object' 
          ? JSON.stringify(data.farm.farmPolygon, null, 2) 
          : data.farm.farmPolygon || '',
        soilType: data.farm.soilType || '',
        soilPH: data.farm.soilPH || '',
        soilFertility: data.farm.soilFertility || '',
        farmCoordinates: typeof data.farm.farmCoordinates === 'object' 
          ? JSON.stringify(data.farm.farmCoordinates, null, 2) 
          : data.farm.farmCoordinates || '',
        coordinateSystem: data.farm.coordinateSystem || '',
        farmArea: data.farm.farmArea || '',
        farmElevation: data.farm.farmElevation || '',
        year: data.farm.year || '',
        yieldSeason: data.farm.yieldSeason || '',
        crop: data.farm.crop || '',
        quantity: data.farm.quantity || '',
      })
    } catch (err) {
      console.error('Error fetching farm:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      // Process form data to handle JSON fields
      const processedData = { ...formData }
      
      // Parse JSON fields if they're strings
      if (typeof processedData.farmPolygon === 'string' && processedData.farmPolygon.trim()) {
        try {
          processedData.farmPolygon = JSON.parse(processedData.farmPolygon)
        } catch (e) {
          // If it's not valid JSON, leave it as a string
        }
      }
      
      if (typeof processedData.farmCoordinates === 'string' && processedData.farmCoordinates.trim()) {
        try {
          processedData.farmCoordinates = JSON.parse(processedData.farmCoordinates)
        } catch (e) {
          // If it's not valid JSON, leave it as a string
        }
      }
      
      const response = await fetch(`/api/farms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update farm')
      }
      
      router.push(`/farms/${id}`)
    } catch (err) {
      console.error('Error updating farm:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Edit Farm">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    )
  }

  if (error && !farm) {
    return (
      <Layout title="Edit Farm">
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
              The farm you're trying to edit doesn't exist or has been removed.
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
    <Layout title={`Edit Farm - ${farm.farmer?.firstName} ${farm.farmer?.lastName}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/farms/${farm.id}`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Farm Details
              </Link>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Farm
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update farm information for {farm.farmer?.firstName} {farm.farmer?.lastName}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error updating farm</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Farm Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Basic Farm Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700">
                    Farm Size (hectares)
                  </label>
                  <input
                    type="number"
                    name="farmSize"
                    id="farmSize"
                    step="0.01"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmSize}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="primaryCrop" className="block text-sm font-medium text-gray-700">
                    Primary Crop
                  </label>
                  <input
                    type="text"
                    name="primaryCrop"
                    id="primaryCrop"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.primaryCrop}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="secondaryCrop" className="block text-sm font-medium text-gray-700">
                    Secondary Crop
                  </label>
                  <input
                    type="text"
                    name="secondaryCrop"
                    id="secondaryCrop"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.secondaryCrop}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="produceCategory" className="block text-sm font-medium text-gray-700">
                    Produce Category
                  </label>
                  <input
                    type="text"
                    name="produceCategory"
                    id="produceCategory"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.produceCategory}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmOwnership" className="block text-sm font-medium text-gray-700">
                    Farm Ownership
                  </label>
                  <select
                    name="farmOwnership"
                    id="farmOwnership"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmOwnership}
                    onChange={handleInputChange}
                  >
                    <option value="">Select ownership type</option>
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Lease">Lease</option>
                    <option value="Family Land">Family Land</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="farmingExperience" className="block text-sm font-medium text-gray-700">
                    Farming Experience (years)
                  </label>
                  <input
                    type="number"
                    name="farmingExperience"
                    id="farmingExperience"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmingExperience}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="farmState" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="farmState"
                    id="farmState"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmState}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmLocalGovernment" className="block text-sm font-medium text-gray-700">
                    Local Government
                  </label>
                  <input
                    type="text"
                    name="farmLocalGovernment"
                    id="farmLocalGovernment"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmLocalGovernment}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmWard" className="block text-sm font-medium text-gray-700">
                    Ward
                  </label>
                  <input
                    type="text"
                    name="farmWard"
                    id="farmWard"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmWard}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmPollingUnit" className="block text-sm font-medium text-gray-700">
                    Polling Unit
                  </label>
                  <input
                    type="text"
                    name="farmPollingUnit"
                    id="farmPollingUnit"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmPollingUnit}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coordinates */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Coordinates & Technical Data</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="farmLatitude" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="farmLatitude"
                    id="farmLatitude"
                    step="any"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmLatitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmLongitude" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="farmLongitude"
                    id="farmLongitude"
                    step="any"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmLongitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="farmElevation" className="block text-sm font-medium text-gray-700">
                    Elevation (meters)
                  </label>
                  <input
                    type="number"
                    name="farmElevation"
                    id="farmElevation"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmElevation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="coordinateSystem" className="block text-sm font-medium text-gray-700">
                    Coordinate System
                  </label>
                  <input
                    type="text"
                    name="coordinateSystem"
                    id="coordinateSystem"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.coordinateSystem}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="farmPolygon" className="block text-sm font-medium text-gray-700">
                    Farm Polygon (coordinates)
                  </label>
                  <textarea
                    name="farmPolygon"
                    id="farmPolygon"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmPolygon}
                    onChange={handleInputChange}
                    placeholder="Enter polygon coordinates..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Soil Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Soil Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-gray-700">
                    Soil Type
                  </label>
                  <input
                    type="text"
                    name="soilType"
                    id="soilType"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilType}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="soilPH" className="block text-sm font-medium text-gray-700">
                    Soil pH
                  </label>
                  <input
                    type="number"
                    name="soilPH"
                    id="soilPH"
                    step="0.1"
                    min="0"
                    max="14"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilPH}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="soilFertility" className="block text-sm font-medium text-gray-700">
                    Soil Fertility
                  </label>
                  <select
                    name="soilFertility"
                    id="soilFertility"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilFertility}
                    onChange={handleInputChange}
                  >
                    <option value="">Select fertility level</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Link
              href={`/farms/${farm.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
