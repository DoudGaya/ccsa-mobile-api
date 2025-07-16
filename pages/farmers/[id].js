import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

export default function FarmerDetails() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (id && session) {
      fetchFarmerDetails()
    }
  }, [id, session, status])

  const fetchFarmerDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/farmers/${id}`)
      if (!response.ok) throw new Error('Failed to fetch farmer details')
      const data = await response.json()
      setFarmer(data)
    } catch (error) {
      console.error('Error fetching farmer:', error)
      setError('Failed to load farmer details')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farmer Details">
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Farmer Details">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!farmer) {
    return (
      <Layout title="Farmer Details">
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Farmer not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested farmer could not be found.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`${farmer.firstName} ${farmer.lastName}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {farmer.firstName} {farmer.lastName}
                </h1>
                <p className="text-sm text-gray-500">Farmer ID: {farmer.id}</p>
              </div>
              <div className="flex space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  farmer.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {farmer.status}
                </span>
                <button className="btn-primary">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Generate Certificate
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID Number (NIN)</label>
                    <div className="mt-1 flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{farmer.nin}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <div className="mt-1 flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{farmer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 flex items-center">
                      <MailIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{farmer.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <span className="text-sm text-gray-900">{farmer.gender}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                    <span className="text-sm text-gray-900">{farmer.maritalStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Address Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <span className="text-sm text-gray-900">{farmer.state}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Local Government Area</label>
                    <span className="text-sm text-gray-900">{farmer.lga}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ward</label>
                    <span className="text-sm text-gray-900">{farmer.ward}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Polling Unit</label>
                    <span className="text-sm text-gray-900">{farmer.pollingUnit}</span>
                  </div>
                </div>
                {farmer.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Address</label>
                    <div className="mt-1 flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-sm text-gray-900">{farmer.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Bank Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BVN</label>
                    <div className="mt-1 flex items-center">
                      <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{farmer.bvn || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <span className="text-sm text-gray-900">{farmer.bankName || 'Not provided'}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <span className="text-sm text-gray-900">{farmer.accountNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <span className="text-sm text-gray-900">{farmer.accountName || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Referees */}
            {farmer.referees && farmer.referees.length > 0 && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Referees</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {farmer.referees.map((referee, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">Referee {index + 1}</h4>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {referee.name}
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {referee.phone}
                          </div>
                          <div>
                            <span className="font-medium">Relationship:</span> {referee.relationship}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Registration Info</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registered By</label>
                  <div className="mt-1 flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{farmer.agent?.displayName || 'Unknown Agent'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(farmer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(farmer.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Information */}
            {farmer.farmLocation && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Farm Information</h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Location</label>
                    <div className="mt-1 flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{farmer.farmLocation}</span>
                    </div>
                  </div>
                  {farmer.farmSize && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                      <span className="text-sm text-gray-900">{farmer.farmSize} hectares</span>
                    </div>
                  )}
                  {farmer.cropsGrown && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Crops Grown</label>
                      <span className="text-sm text-gray-900">{farmer.cropsGrown}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <button className="w-full btn-primary">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Download Certificate
                </button>
                <button className="w-full btn-secondary">
                  Edit Information
                </button>
                <button className="w-full btn-secondary">
                  View Farm Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
