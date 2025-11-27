import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import LocationSelect from '../components/LocationSelect'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

export default function Clusters() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [selectedState, setSelectedState] = useState('')
  const [selectedLGA, setSelectedLGA] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [selectedPollingUnit, setSelectedPollingUnit] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clusterLeadFirstName: '',
    clusterLeadLastName: '',
    clusterLeadEmail: '',
    clusterLeadPhone: '',
    clusterLeadNIN: '',
    clusterLeadState: '',
    clusterLeadLGA: '',
    clusterLeadWard: '',
    clusterLeadPollingUnit: '',
    clusterLeadPosition: '',
    clusterLeadAddress: '',
    clusterLeadDateOfBirth: '',
    clusterLeadGender: '',
    clusterLeadMaritalStatus: '',
    clusterLeadEmploymentStatus: '',
    clusterLeadBVN: '',
    clusterLeadBankName: '',
    clusterLeadAccountNumber: '',
    clusterLeadAccountName: '',
    clusterLeadAlternativePhone: '',
    clusterLeadWhatsAppNumber: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchClusters()
  }, [session, status, router])

  const fetchClusters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/clusters')
      if (!response.ok) {
        throw new Error('Failed to fetch clusters')
      }
      
      const data = await response.json()
      setClusters(data.clusters || [])
    } catch (err) {
      console.error('Error fetching clusters:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!formData.clusterLeadFirstName.trim()) {
      errors.clusterLeadFirstName = 'First name is required'
    }
    
    if (!formData.clusterLeadLastName.trim()) {
      errors.clusterLeadLastName = 'Last name is required'
    }
    
    if (!formData.clusterLeadEmail.trim()) {
      errors.clusterLeadEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clusterLeadEmail)) {
      errors.clusterLeadEmail = 'Invalid email format'
    }
    
    if (!formData.clusterLeadPhone.trim()) {
      errors.clusterLeadPhone = 'Phone is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      
      const url = selectedCluster ? `/api/clusters/${selectedCluster.id}` : '/api/clusters'
      const method = selectedCluster ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save cluster')
      }
      
      await fetchClusters()
      resetForm()
      setShowCreateModal(false)
      setShowEditModal(false)
    } catch (err) {
      console.error('Error saving cluster:', err)
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cluster) => {
    setSelectedCluster(cluster)
    setFormData({
      title: cluster.title,
      description: cluster.description || '',
      clusterLeadFirstName: cluster.clusterLeadFirstName,
      clusterLeadLastName: cluster.clusterLeadLastName,
      clusterLeadEmail: cluster.clusterLeadEmail,
      clusterLeadPhone: cluster.clusterLeadPhone,
      clusterLeadNIN: cluster.clusterLeadNIN || '',
      clusterLeadState: cluster.clusterLeadState || '',
      clusterLeadLGA: cluster.clusterLeadLGA || '',
      clusterLeadWard: cluster.clusterLeadWard || '',
      clusterLeadPollingUnit: cluster.clusterLeadPollingUnit || '',
      clusterLeadPosition: cluster.clusterLeadPosition || '',
      clusterLeadAddress: cluster.clusterLeadAddress || '',
      clusterLeadDateOfBirth: cluster.clusterLeadDateOfBirth || '',
      clusterLeadGender: cluster.clusterLeadGender || '',
      clusterLeadMaritalStatus: cluster.clusterLeadMaritalStatus || '',
      clusterLeadEmploymentStatus: cluster.clusterLeadEmploymentStatus || '',
      clusterLeadBVN: cluster.clusterLeadBVN || '',
      clusterLeadBankName: cluster.clusterLeadBankName || '',
      clusterLeadAccountNumber: cluster.clusterLeadAccountNumber || '',
      clusterLeadAccountName: cluster.clusterLeadAccountName || '',
      clusterLeadAlternativePhone: cluster.clusterLeadAlternativePhone || '',
      clusterLeadWhatsAppNumber: cluster.clusterLeadWhatsAppNumber || '',
    })
    // Set location states for editing
    setSelectedState(cluster.clusterLeadState || '')
    setSelectedLGA(cluster.clusterLeadLGA || '')
    setSelectedWard(cluster.clusterLeadWard || '')
    setSelectedPollingUnit(cluster.clusterLeadPollingUnit || '')
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDelete = async (cluster) => {
    if (!confirm(`Are you sure you want to delete "${cluster.title}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/clusters/${cluster.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete cluster')
      }
      
      await fetchClusters()
    } catch (err) {
      console.error('Error deleting cluster:', err)
      alert(err.message)
    }
  }

  // Location selection handlers
  const handleStateChange = (state) => {
    setSelectedState(state)
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
    setFormData({
      ...formData,
      clusterLeadState: state,
      clusterLeadLGA: '',
      clusterLeadWard: '',
      clusterLeadPollingUnit: ''
    })
  }

  const handleLGAChange = (lga) => {
    setSelectedLGA(lga)
    setSelectedWard('')
    setSelectedPollingUnit('')
    setFormData({
      ...formData,
      clusterLeadLGA: lga,
      clusterLeadWard: '',
      clusterLeadPollingUnit: ''
    })
  }

  const handleWardChange = (ward) => {
    setSelectedWard(ward)
    setSelectedPollingUnit('')
    setFormData({
      ...formData,
      clusterLeadWard: ward,
      clusterLeadPollingUnit: ''
    })
  }

  const handlePollingUnitChange = (pollingUnit) => {
    setSelectedPollingUnit(pollingUnit)
    setFormData({
      ...formData,
      clusterLeadPollingUnit: pollingUnit
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clusterLeadFirstName: '',
      clusterLeadLastName: '',
      clusterLeadEmail: '',
      clusterLeadPhone: '',
      clusterLeadNIN: '',
      clusterLeadState: '',
      clusterLeadLGA: '',
      clusterLeadWard: '',
      clusterLeadPollingUnit: '',
      clusterLeadPosition: '',
      clusterLeadAddress: '',
      clusterLeadDateOfBirth: '',
      clusterLeadGender: '',
      clusterLeadMaritalStatus: '',
      clusterLeadEmploymentStatus: '',
      clusterLeadBVN: '',
      clusterLeadBankName: '',
      clusterLeadAccountNumber: '',
      clusterLeadAccountName: '',
      clusterLeadAlternativePhone: '',
      clusterLeadWhatsAppNumber: '',
    })
    setSelectedState('')
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
    setFormErrors({})
    setSelectedCluster(null)
  }

  const filteredClusters = clusters.filter(cluster =>
    cluster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cluster.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cluster.clusterLeadFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cluster.clusterLeadLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cluster.clusterLeadEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <Layout title="Clusters">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Clusters">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading clusters</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchClusters}
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
    <Layout title="Clusters">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Clusters</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage farmer clusters and cluster leaders. A list of all clusters in your system including their details and assigned farmers.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Cluster
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clusters..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clusters Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClusters.map((cluster) => (
            <div key={cluster.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {cluster.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {cluster._count?.farmers || 0} farmers
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(cluster)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cluster)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {cluster.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {cluster.description}
                  </p>
                )}
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    {cluster.clusterLeadFirstName} {cluster.clusterLeadLastName}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {cluster.clusterLeadEmail}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {cluster.clusterLeadPhone}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClusters.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clusters</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No clusters match your search.' : 'Get started by creating a new cluster.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setShowCreateModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Cluster
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedCluster ? 'Edit Cluster' : 'Create New Cluster'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`mt-1 block w-full border ${formErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Cluster title"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Cluster description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Leader First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.clusterLeadFirstName}
                      onChange={(e) => setFormData({ ...formData, clusterLeadFirstName: e.target.value })}
                      className={`mt-1 block w-full border ${formErrors.clusterLeadFirstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="First name"
                    />
                    {formErrors.clusterLeadFirstName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.clusterLeadFirstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Leader Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.clusterLeadLastName}
                      onChange={(e) => setFormData({ ...formData, clusterLeadLastName: e.target.value })}
                      className={`mt-1 block w-full border ${formErrors.clusterLeadLastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Last name"
                    />
                    {formErrors.clusterLeadLastName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.clusterLeadLastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leader Email *
                  </label>
                  <input
                    type="email"
                    value={formData.clusterLeadEmail}
                    onChange={(e) => setFormData({ ...formData, clusterLeadEmail: e.target.value })}
                    className={`mt-1 block w-full border ${formErrors.clusterLeadEmail ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="leader@example.com"
                  />
                  {formErrors.clusterLeadEmail && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.clusterLeadEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leader Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.clusterLeadPhone}
                    onChange={(e) => setFormData({ ...formData, clusterLeadPhone: e.target.value })}
                    className={`mt-1 block w-full border ${formErrors.clusterLeadPhone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="+234 800 000 0000"
                  />
                  {formErrors.clusterLeadPhone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.clusterLeadPhone}</p>
                  )}
                </div>

                {/* Cluster Lead Additional Information */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Cluster Lead Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NIN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        NIN (National Identification Number)
                      </label>
                      <input
                        type="text"
                        value={formData.clusterLeadNIN}
                        onChange={(e) => setFormData({ ...formData, clusterLeadNIN: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12345678901"
                        maxLength="11"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Position/Title
                      </label>
                      <input
                        type="text"
                        value={formData.clusterLeadPosition}
                        onChange={(e) => setFormData({ ...formData, clusterLeadPosition: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Head of Agriculture"
                      />
                    </div>

                    {/* Location Selection */}
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Location Information</h4>
                      <LocationSelect
                        selectedState={selectedState}
                        selectedLGA={selectedLGA}
                        selectedWard={selectedWard}
                        onStateChange={handleStateChange}
                        onLGAChange={handleLGAChange}
                        onWardChange={handleWardChange}
                        onPollingUnitChange={handlePollingUnitChange}
                        errors={formErrors}
                        required={false}
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.clusterLeadDateOfBirth}
                        onChange={(e) => setFormData({ ...formData, clusterLeadDateOfBirth: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        value={formData.clusterLeadGender}
                        onChange={(e) => setFormData({ ...formData, clusterLeadGender: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {/* Marital Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Marital Status
                      </label>
                      <select
                        value={formData.clusterLeadMaritalStatus}
                        onChange={(e) => setFormData({ ...formData, clusterLeadMaritalStatus: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    {/* Employment Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employment Status
                      </label>
                      <select
                        value={formData.clusterLeadEmploymentStatus}
                        onChange={(e) => setFormData({ ...formData, clusterLeadEmploymentStatus: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Employed">Employed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Retired">Retired</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>

                    {/* Alternative Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Alternative Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.clusterLeadAlternativePhone}
                        onChange={(e) => setFormData({ ...formData, clusterLeadAlternativePhone: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+234 800 000 0000"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={formData.clusterLeadWhatsAppNumber}
                        onChange={(e) => setFormData({ ...formData, clusterLeadWhatsAppNumber: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>

                  {/* Address - Full Width */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      value={formData.clusterLeadAddress}
                      onChange={(e) => setFormData({ ...formData, clusterLeadAddress: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full residential address"
                    />
                  </div>

                  {/* Banking Information */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h5 className="text-md font-medium text-gray-800 mb-3">Banking Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* BVN */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          BVN (Bank Verification Number)
                        </label>
                        <input
                          type="text"
                          value={formData.clusterLeadBVN}
                          onChange={(e) => setFormData({ ...formData, clusterLeadBVN: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="12345678901"
                          maxLength="11"
                        />
                      </div>

                      {/* Bank Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={formData.clusterLeadBankName}
                          onChange={(e) => setFormData({ ...formData, clusterLeadBankName: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., First Bank of Nigeria"
                        />
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={formData.clusterLeadAccountNumber}
                          onChange={(e) => setFormData({ ...formData, clusterLeadAccountNumber: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1234567890"
                          maxLength="10"
                        />
                      </div>

                      {/* Account Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={formData.clusterLeadAccountName}
                          onChange={(e) => setFormData({ ...formData, clusterLeadAccountName: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Account holder name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowEditModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (selectedCluster ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
