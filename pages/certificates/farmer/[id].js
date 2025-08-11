import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { 
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

export default function FarmerCertificate() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper function to capitalize text
  const capitalize = (text) => {
    if (!text) return ''
    return text.toString().toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    })
  }

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
      
      // Use the real API first
      let response = await fetch(`/api/farmers/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Real farmer details received:', data)
        // Handle both direct farmer object and nested farmer object
        const farmerData = data.farmer || data
        setFarmer(farmerData)
      } else {
        console.log('Real API failed, trying fallback...')
        // Only use fallback if real API fails
        const fallbackResponse = await fetch(`/api/farmers-details/${id}`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          console.log('Fallback farmer details received:', fallbackData)
          const farmerData = fallbackData.farmer || fallbackData
          setFarmer(farmerData)
        } else {
          throw new Error('Both APIs failed to fetch farmer details')
        }
      }
    } catch (error) {
      console.error('Error fetching farmer:', error)
      setError('Failed to load farmer details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Convert to PDF and download
    window.print()
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farmer Certificate">
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !farmer) {
    return (
      <Layout title="Farmer Certificate">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-medium text-red-900">Certificate Not Available</h3>
            <p className="text-red-700">{error || 'Farmer not found'}</p>
          </div>
        </div>
      </Layout>
    )
  }

  const certificate = farmer.certificates?.[0]

  return (
    <Layout title={`Certificate - ${farmer.firstName} ${farmer.lastName}`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold text-gray-900">Farmer Registration Certificate</h1>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-green-200">
          <div className="certificate-content p-8" style={{ minHeight: '800px' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-green-500 pb-6 mb-8">
              <div className="flex justify-center items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                CENTRE FOR CLIMATE CHANGE AND SUSTAINABLE AGRICULTURE
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-1">
                FARMER REGISTRATION CERTIFICATE
              </h2>
              <p className="text-lg text-gray-600">
                Certificate No: {certificate?.certificateNumber || `CCSA/2024/${String(farmer.id).padStart(4, '0')}`}
              </p>
            </div>

            {/* Main Content */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                This is to certify that
              </h3>
              <div className="border-2 border-green-400 rounded-lg p-6 mb-6 bg-green-50">
                <h2 className="text-3xl font-bold text-green-800 mb-2">
                  {capitalize(farmer.firstName)} {capitalize(farmer.middleName)} {capitalize(farmer.lastName)}
                </h2>
                <p className="text-lg text-gray-700">
                  NIN: {farmer.nin}
                </p>
              </div>
              <p className="text-lg text-gray-800 leading-relaxed mb-6">
                is a duly registered farmer with the Centre for Climate Change and Sustainable Agriculture (CCSA) 
                and is authorized to participate in all CCSA agricultural programs and initiatives.
              </p>
            </div>

            {/* Farmer Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">Personal Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Phone:</span> {farmer.phone}</p>
                  <p><span className="font-medium">Email:</span> {farmer.email}</p>
                  <p><span className="font-medium">Gender:</span> {capitalize(farmer.gender)}</p>
                  <p><span className="font-medium">Date of Birth:</span> {formatDate(farmer.dateOfBirth)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">Location Details</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">State:</span> {capitalize(farmer.state)}</p>
                  <p><span className="font-medium">LGA:</span> {capitalize(farmer.lga)}</p>
                  <p><span className="font-medium">Ward:</span> {capitalize(farmer.ward)}</p>
                  <p><span className="font-medium">Polling Unit:</span> {farmer.pollingUnit}</p>
                </div>
              </div>
            </div>

            {/* Farm Information */}
            {farmer.farms && farmer.farms.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">Primary Farm Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="font-medium">Farm Name:</span> {capitalize(farmer.farms[0].farmName)}</p>
                    <p><span className="font-medium">Farm Size:</span> {farmer.farms[0].farmSize} {capitalize(farmer.farms[0].farmSizeUnit || 'hectares')}</p>
                    <p><span className="font-medium">Primary Crop:</span> {capitalize(farmer.farms[0].cropType)}</p>
                    <p><span className="font-medium">Location:</span> {capitalize(farmer.farms[0].location)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-300">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mt-8" style={{ width: '200px' }}>
                  <p className="font-semibold">Director General</p>
                  <p className="text-sm text-gray-600">CCSA</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Issue Date:</span> {formatDate(certificate?.issueDate || farmer.createdAt)}</p>
                  <p><span className="font-medium">Valid Until:</span> {formatDate(certificate?.expiryDate || new Date(new Date(farmer.createdAt).getTime() + 365*24*60*60*1000).toISOString())}</p>
                </div>
                <div className="border-t-2 border-gray-400 pt-2" style={{ width: '200px' }}>
                  <p className="font-semibold">Official Seal</p>
                  <p className="text-sm text-gray-600">CCSA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-content, .certificate-content * {
            visibility: visible;
          }
          .certificate-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  )
}
