import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import LocationSelect from '../../../components/LocationSelect'
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
  
  // Location state management
  const [selectedState, setSelectedState] = useState('')
  const [selectedLGA, setSelectedLGA] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [selectedPollingUnit, setSelectedPollingUnit] = useState('')
  
  const [formData, setFormData] = useState({
    farmSize: '',
    primaryCrop: '',
    secondaryCrop: '',
    produceCategory: '',
    farmOwnership: '',
    farmingSeason: '',
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
      
      // Populate location data
      setSelectedState(data.farm.farmState || '')
      setSelectedLGA(data.farm.farmLocalGovernment || '')
      setSelectedWard(data.farm.farmWard || '')
      setSelectedPollingUnit(data.farm.farmPollingUnit || '')
      
      // Populate form data
      setFormData({
        farmSize: data.farm.farmSize || '',
        primaryCrop: data.farm.primaryCrop || '',
        secondaryCrop: data.farm.secondaryCrop || '',
        produceCategory: data.farm.produceCategory || '',
        farmOwnership: data.farm.farmOwnership || '',
        farmingSeason: data.farm.farmingSeason || '',
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

  // Location change handlers
  const handleStateChange = (state) => {
    setSelectedState(state)
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
  }

  const handleLGAChange = (lga) => {
    setSelectedLGA(lga)
    setSelectedWard('')
    setSelectedPollingUnit('')
  }

  const handleWardChange = (ward) => {
    setSelectedWard(ward)
    setSelectedPollingUnit('')
  }

  const handlePollingUnitChange = (pollingUnit) => {
    setSelectedPollingUnit(pollingUnit)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      // Process form data to handle JSON fields and include location data
      const processedData = { 
        ...formData,
        farmState: selectedState,
        farmLocalGovernment: selectedLGA,
        farmWard: selectedWard,
        farmPollingUnit: selectedPollingUnit,
      }
      
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
          {/* Progress indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <PencilIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Editing Farm Information</p>
                <p className="text-xs text-blue-600">Fill in all required fields marked with *</p>
              </div>
            </div>
          </div>
          {/* Basic Farm Information */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Basic Farm Information</h3>
              <p className="text-sm text-gray-600 mt-1">General details about the farm and its produce</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700">
                    Farm Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="farmSize"
                      id="farmSize"
                      step="0.01"
                      placeholder="Enter farm size"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm pr-16"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">hectares</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="primaryCrop" className="block text-sm font-medium text-gray-700">
                    Primary Crop <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="primaryCrop"
                    id="primaryCrop"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.primaryCrop}
                    onChange={handleInputChange}
                  >
                    <option value="">Select primary crop</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Yam">Yam</option>
                    <option value="Cassava">Cassava</option>
                    <option value="Cocoa">Cocoa</option>
                    <option value="Palm Oil">Palm Oil</option>
                    <option value="Plantain">Plantain</option>
                    <option value="Banana">Banana</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Pepper">Pepper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="secondaryCrop" className="block text-sm font-medium text-gray-700">
                    Secondary Crop
                  </label>
                  <select
                    name="secondaryCrop"
                    id="secondaryCrop"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.secondaryCrop}
                    onChange={handleInputChange}
                  >
                    <option value="">Select secondary crop</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Yam">Yam</option>
                    <option value="Cassava">Cassava</option>
                    <option value="Cocoa">Cocoa</option>
                    <option value="Palm Oil">Palm Oil</option>
                    <option value="Plantain">Plantain</option>
                    <option value="Banana">Banana</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Pepper">Pepper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="produceCategory" className="block text-sm font-medium text-gray-700">
                    Produce Category
                  </label>
                  <select
                    name="produceCategory"
                    id="produceCategory"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.produceCategory}
                    onChange={handleInputChange}
                  >
                    <option value="">Select category</option>
                    <option value="Cereals">Cereals</option>
                    <option value="Tubers">Tubers</option>
                    <option value="Legumes">Legumes</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Cash Crops">Cash Crops</option>
                    <option value="Spices">Spices</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmOwnership" className="block text-sm font-medium text-gray-700">
                    Farm Ownership <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="farmOwnership"
                    id="farmOwnership"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmOwnership}
                    onChange={handleInputChange}
                  >
                    <option value="">Select ownership type</option>
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Lease">Lease</option>
                    <option value="Family Land">Family Land</option>
                    <option value="Government">Government</option>
                    <option value="Cooperative">Cooperative</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmingExperience" className="block text-sm font-medium text-gray-700">
                    Farming Experience
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="farmingExperience"
                      id="farmingExperience"
                      placeholder="Enter years"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm pr-16"
                      value={formData.farmingExperience}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
              <p className="text-sm text-gray-600 mt-1">Select the farm's geographical location</p>
            </div>
            <div className="px-6 py-6">
              <LocationSelect
                selectedState={selectedState}
                selectedLGA={selectedLGA}
                selectedWard={selectedWard}
                onStateChange={handleStateChange}
                onLGAChange={handleLGAChange}
                onWardChange={handleWardChange}
                onPollingUnitChange={handlePollingUnitChange}
                required={true}
              />
            </div>
          </div>

          {/* Coordinates & Technical Data */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Coordinates & Technical Data</h3>
              <p className="text-sm text-gray-600 mt-1">GPS coordinates and technical information about the farm</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="farmLatitude" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="farmLatitude"
                    id="farmLatitude"
                    step="any"
                    placeholder="e.g., 6.5244"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmLatitude}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmLongitude" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="farmLongitude"
                    id="farmLongitude"
                    step="any"
                    placeholder="e.g., 3.3792"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmLongitude}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmElevation" className="block text-sm font-medium text-gray-700">
                    Elevation
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="farmElevation"
                      id="farmElevation"
                      placeholder="Enter elevation"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm pr-16"
                      value={formData.farmElevation}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">meters</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmArea" className="block text-sm font-medium text-gray-700">
                    Farm Area
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="farmArea"
                      id="farmArea"
                      step="0.01"
                      placeholder="Calculated area"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm pr-16"
                      value={formData.farmArea}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">sq m</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="coordinateSystem" className="block text-sm font-medium text-gray-700">
                    Coordinate System
                  </label>
                  <select
                    name="coordinateSystem"
                    id="coordinateSystem"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.coordinateSystem}
                    onChange={handleInputChange}
                  >
                    <option value="">Select coordinate system</option>
                    <option value="WGS84">WGS84 (GPS)</option>
                    <option value="UTM">UTM</option>
                    <option value="Local Grid">Local Grid</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <label htmlFor="farmPolygon" className="block text-sm font-medium text-gray-700">
                    Farm Polygon Coordinates
                  </label>
                  <textarea
                    name="farmPolygon"
                    id="farmPolygon"
                    rows={4}
                    placeholder="Enter polygon coordinates (JSON format)"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmPolygon}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">
                    {`Enter coordinates in JSON format, e.g., [{"lat": 6.5244, "lng": 3.3792}, ...]`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Soil Information */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Soil & Environmental Data</h3>
              <p className="text-sm text-gray-600 mt-1">Soil characteristics and environmental conditions</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="soilType" className="block text-sm font-medium text-gray-700">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    id="soilType"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select soil type</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Silt">Silt</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Silt Loam">Silt Loam</option>
                    <option value="Peat">Peat</option>
                    <option value="Chalk">Chalk</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="soilPH" className="block text-sm font-medium text-gray-700">
                    Soil pH Level
                  </label>
                  <input
                    type="number"
                    name="soilPH"
                    id="soilPH"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="e.g., 6.5"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilPH}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">Scale: 0-14 (7 is neutral)</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="soilFertility" className="block text-sm font-medium text-gray-700">
                    Soil Fertility Level
                  </label>
                  <select
                    name="soilFertility"
                    id="soilFertility"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.soilFertility}
                    onChange={handleInputChange}
                  >
                    <option value="">Select fertility level</option>
                    <option value="Very Low">Very Low</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="farmingSeason" className="block text-sm font-medium text-gray-700">
                    Farming Season
                  </label>
                  <select
                    name="farmingSeason"
                    id="farmingSeason"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.farmingSeason}
                    onChange={handleInputChange}
                  >
                    <option value="">Select season</option>
                    <option value="Dry Season">Dry Season</option>
                    <option value="Wet Season">Wet Season</option>
                    <option value="Both Seasons">Both Seasons</option>
                    <option value="Year Round">Year Round</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Cultivation Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    id="year"
                    min="2020"
                    max="2030"
                    placeholder="e.g., 2024"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={formData.year}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Expected Yield
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      step="0.01"
                      placeholder="Expected yield"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm pr-16"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">tonnes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Link
              href={`/farms/${farm.id}`}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel Changes
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Changes...
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
