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

// Farm categories
const FARM_CATEGORIES = [
  { value: 'ARABLE', label: 'Arable' },
  { value: 'LIVESTOCK', label: 'Livestock' },
  { value: 'MIXED', label: 'Mixed' },
  { value: 'AQUACULTURE', label: 'Aquaculture' },
  { value: 'POULTRY', label: 'Poultry' },
  { value: 'HORTICULTURE', label: 'Horticulture' },
];

// Farm ownership types
const FARM_OWNERSHIP = [
  { value: 'OWNED', label: 'Owned' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'LEASED', label: 'Leased' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'COMMUNITY', label: 'Community' },
];

// Farming seasons
const FARM_SEASONS = [
  { value: 'WET', label: 'Wet Season' },
  { value: 'DRY', label: 'Dry Season' },
  { value: 'YEAR_ROUND', label: 'Year Round' },
];

// Crops list
const CROPS = [
  'Maize', 'Rice', 'Cassava', 'Yam', 'Cocoa', 'Oil Palm', 'Plantain', 'Banana',
  'Tomato', 'Pepper', 'Onion', 'Okra', 'Beans', 'Groundnut', 'Sesame', 'Cotton',
  'Sorghum', 'Millet', 'Cowpea', 'Soybean', 'Sweet Potato', 'Irish Potato',
];

// Livestock types
const LIVESTOCK_TYPES = [
  'Cattle', 'Goat', 'Sheep', 'Pig', 'Rabbit', 'Donkey', 'Horse', 'Camel',
];

// Poultry types
const POULTRY_TYPES = [
  'Chicken', 'Turkey', 'Duck', 'Goose', 'Guinea Fowl', 'Quail', 'Pigeon',
];

// Fish types
const FISH_TYPES = [
  'Tilapia', 'Catfish', 'Carp', 'Salmon', 'Trout', 'Snapper', 'Prawns', 'Crayfish',
];

// Horticulture types
const HORTICULTURE_TYPES = [
  'Vegetables', 'Fruits', 'Flowers', 'Ornamental Plants', 'Herbs', 'Spices',
];

// Soil types
const SOIL_TYPES = [
  'Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky',
];

// Soil fertility levels
const SOIL_FERTILITY_LEVELS = [
  'Very Low', 'Low', 'Medium', 'High', 'Very High',
];

// Yield seasons
const YIELD_SEASONS = [
  'Spring', 'Summer', 'Fall', 'Winter', 'Year Round',
];

// Landforms
const LANDFORMS = [
  'Plain', 'Valley', 'Hill', 'Mountain', 'Plateau', 'Wetland',
];

// Helper function to get category-specific options
const getCategoryOptions = (category) => {
  switch (category) {
    case 'LIVESTOCK':
      return LIVESTOCK_TYPES;
    case 'POULTRY':
      return POULTRY_TYPES;
    case 'AQUACULTURE':
      return FISH_TYPES;
    case 'HORTICULTURE':
      return HORTICULTURE_TYPES;
    case 'ARABLE':
    case 'MIXED':
    default:
      return CROPS;
  }
};

// Helper function to get category-specific labels
const getCategoryLabels = (category) => {
  switch (category) {
    case 'LIVESTOCK':
      return {
        primary: 'Primary Livestock',
        secondary: 'Secondary Livestock',
        helper: 'Select up to 5 additional livestock types raised on this farm'
      };
    case 'POULTRY':
      return {
        primary: 'Primary Poultry',
        secondary: 'Secondary Poultry',
        helper: 'Select up to 5 additional poultry types raised on this farm'
      };
    case 'AQUACULTURE':
      return {
        primary: 'Primary Fish/Aquatic Species',
        secondary: 'Secondary Fish/Aquatic Species',
        helper: 'Select up to 5 additional aquatic species farmed'
      };
    case 'HORTICULTURE':
      return {
        primary: 'Primary Horticultural Product',
        secondary: 'Secondary Horticultural Products',
        helper: 'Select up to 5 additional horticultural products grown'
      };
    case 'ARABLE':
    case 'MIXED':
    default:
      return {
        primary: 'Primary Crop',
        secondary: 'Secondary Crops',
        helper: 'Select up to 5 secondary crops that are also grown on this farm'
      };
  }
};

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
    // farmCategory: '', // Commented out until database migration
    primaryCrop: '',
    secondaryCrop: '', // String for now (comma-separated values)
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
    // landforms: '', // Commented out until database migration
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
        // farmCategory: data.farm.farmCategory || '',
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
        // landforms: data.farm.landforms || '',
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

  // State for managing secondary crops as tags
  const [secondaryCropsArray, setSecondaryCropsArray] = useState([])
  const [cropInput, setCropInput] = useState('')

  // Initialize secondary crops array from comma-separated string
  useEffect(() => {
    if (formData.secondaryCrop) {
      const crops = formData.secondaryCrop.split(',').map(c => c.trim()).filter(c => c)
      setSecondaryCropsArray(crops)
    }
  }, [farm])

  const addSecondaryCrop = (cropName) => {
    if (cropName && !secondaryCropsArray.includes(cropName) && secondaryCropsArray.length < 5) {
      const newCrops = [...secondaryCropsArray, cropName]
      setSecondaryCropsArray(newCrops)
      setFormData(prev => ({
        ...prev,
        secondaryCrop: newCrops.join(', ')
      }))
      setCropInput('')
    }
  }

  const removeSecondaryCrop = (cropName) => {
    const newCrops = secondaryCropsArray.filter(c => c !== cropName)
    setSecondaryCropsArray(newCrops)
    setFormData(prev => ({
      ...prev,
      secondaryCrop: newCrops.join(', ')
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
          <div className="bg-gradient-to-br from-white to-green-50/30 shadow-lg ring-1 ring-gray-900/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Basic Farm Information</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Essential details about the farm and production</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Farm Size */}
                <div className="space-y-2">
                  <label htmlFor="farmSize" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Farm Size <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      name="farmSize"
                      id="farmSize"
                      step="0.01"
                      placeholder="0.00"
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 pr-20 text-gray-900 font-medium hover:border-green-300"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded">hectares</span>
                    </div>
                  </div>
                </div>
                
                {/* Farm Ownership */}
                <div className="space-y-2">
                  <label htmlFor="farmOwnership" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Farm Ownership <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="farmOwnership"
                    id="farmOwnership"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 font-medium hover:border-green-300"
                    value={formData.farmOwnership}
                    onChange={handleInputChange}
                  >
                    <option value="">Select ownership type</option>
                    {FARM_OWNERSHIP.map(own => (
                      <option key={own.value} value={own.value}>{own.label}</option>
                    ))}
                  </select>
                </div>

                {/* Farming Season */}
                <div className="space-y-2">
                  <label htmlFor="farmingSeason" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Farming Season
                  </label>
                  <select
                    name="farmingSeason"
                    id="farmingSeason"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 font-medium hover:border-green-300"
                    value={formData.farmingSeason}
                    onChange={handleInputChange}
                  >
                    <option value="">Select season</option>
                    {FARM_SEASONS.map(season => (
                      <option key={season.value} value={season.value}>{season.label}</option>
                    ))}
                  </select>
                </div>

                {/* Farming Experience */}
                <div className="space-y-2">
                  <label htmlFor="farmingExperience" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Farming Experience
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="farmingExperience"
                      id="farmingExperience"
                      min="0"
                      placeholder="0"
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 pr-16 text-gray-900 font-medium hover:border-green-300"
                      value={formData.farmingExperience}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded">years</span>
                    </div>
                  </div>
                </div>

                {/* Primary Crop */}
                <div className="space-y-2">
                  <label htmlFor="primaryCrop" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Primary Crop <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="primaryCrop"
                    id="primaryCrop"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 font-medium hover:border-green-300"
                    value={formData.primaryCrop}
                    onChange={handleInputChange}
                  >
                    <option value="">Select primary crop</option>
                    {CROPS.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                {/* Secondary Crops - dropdown with tag management */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="secondaryCropSelect" className="flex items-center text-sm font-semibold text-gray-700">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    Secondary Crops
                    <span className="ml-2 text-xs font-normal text-gray-500">(Select from dropdown)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="secondaryCropSelect"
                      className="flex-1 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 hover:border-green-300"
                      value={cropInput}
                      onChange={(e) => {
                        setCropInput(e.target.value)
                        if (e.target.value) {
                          addSecondaryCrop(e.target.value)
                        }
                      }}
                    >
                      <option value="">Choose a crop to add...</option>
                      {CROPS.filter(crop => !secondaryCropsArray.includes(crop)).map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>
                  
                  {secondaryCropsArray.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      {secondaryCropsArray.map(crop => (
                        <span
                          key={crop}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-green-200 text-green-800 shadow-sm hover:shadow transition-shadow"
                        >
                          {crop}
                          <button
                            type="button"
                            onClick={() => removeSecondaryCrop(crop)}
                            className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-green-200 transition-colors"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {secondaryCropsArray.length}/5 crops selected
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="produceCategory" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    Produce Category
                  </label>
                  <select
                    name="produceCategory"
                    id="produceCategory"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 font-medium hover:border-green-300"
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
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 shadow-lg ring-1 ring-gray-900/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Location Information</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Geographical location and administrative area</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6 bg-white">
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

          {/* Soil & Environmental Information */}
          <div className="bg-gradient-to-br from-white to-amber-50/30 shadow-lg ring-1 ring-gray-900/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 4 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Soil & Environmental Data</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Soil characteristics and growing conditions</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="soilType" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    id="soilType"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 font-medium hover:border-amber-300"
                    value={formData.soilType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select soil type</option>
                    {SOIL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="soilPH" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Soil pH Level
                  </label>
                  <input
                    type="number"
                    name="soilPH"
                    id="soilPH"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder="6.5"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 font-medium hover:border-amber-300"
                    value={formData.soilPH}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Scale: 0-14 (7 is neutral)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="soilFertility" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Soil Fertility Level
                  </label>
                  <select
                    name="soilFertility"
                    id="soilFertility"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 font-medium hover:border-amber-300"
                    value={formData.soilFertility}
                    onChange={handleInputChange}
                  >
                    <option value="">Select fertility level</option>
                    {SOIL_FERTILITY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="yieldSeason" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Yield Season
                  </label>
                  <select
                    name="yieldSeason"
                    id="yieldSeason"
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-900 font-medium hover:border-amber-300"
                    value={formData.yieldSeason}
                    onChange={handleInputChange}
                  >
                    <option value="">Select yield season</option>
                    {YIELD_SEASONS.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
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
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8">
            <Link
              href={`/farms/${farm.id}`}
              className="group inline-flex items-center justify-center px-8 py-3.5 border-2 border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <XMarkIcon className="h-5 w-5 mr-2 group-hover:-translate-x-0.5 transition-transform" />
              Cancel Changes
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex items-center justify-center px-8 py-3.5 border-2 border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span className="animate-pulse">Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
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
