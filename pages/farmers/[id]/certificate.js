import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import QRCode from 'qrcode'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon as MailIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

export default function FarmerCertificate() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [farmer, setFarmer] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

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
      
      // Generate QR code
      await generateQRCode(data)
    } catch (error) {
      console.error('Error fetching farmer:', error)
      setError('Failed to load farmer details')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (farmerData) => {
    try {
      const qrData = {
        farmerId: farmerData.id,
        nin: farmerData.nin,
        name: `${farmerData.firstName} ${farmerData.lastName}`,
        phone: farmerData.phone,
        registrationDate: farmerData.createdAt,
        certificateId: `CCSA-${Date.now()}-${farmerData.id.slice(-6).toUpperCase()}`,
        verificationUrl: `${window.location.origin}/verify/${farmerData.id}`
      }

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    setGenerating(true)
    try {
      // You can integrate with a PDF generation library here
      // For now, we'll use the browser's print to PDF functionality
      window.print()
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Certificate">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Certificate">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 btn-secondary"
          >
            Go Back
          </button>
        </div>
      </Layout>
    )
  }

  if (!farmer) {
    return (
      <Layout title="Certificate">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Farmer not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 btn-secondary"
          >
            Go Back
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Certificate - ${farmer.firstName} ${farmer.lastName}`}>
      {/* Print/Download Actions - Hidden during print */}
      <div className="mb-6 print-hidden">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="btn-secondary"
          >
            ← Back to Farmer Details
          </button>
          <div className="space-x-3">
            <button
              onClick={handlePrint}
              className="btn-primary inline-flex items-center"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print Certificate
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="btn-secondary inline-flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Save as PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print-shadow-none print-rounded-none">
        {/* Certificate Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <span className="text-green-600 font-bold text-2xl">🇳🇬</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">CENTRE FOR CLIMATE SMART AGRICULTURE</h1>
          <p className="text-xl">Cosmopolitan University Abuja</p>
          <div className="mt-4 border-t border-white/20 pt-4">
            <h2 className="text-2xl font-semibold">FARMER REGISTRATION CERTIFICATE</h2>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Farmer Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {farmer.firstName} {farmer.middleName} {farmer.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID Number (NIN)</label>
                    <p className="text-lg font-mono text-gray-900">{farmer.nin}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-gray-900">
                      {farmer.dateOfBirth ? formatDate(farmer.dateOfBirth) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-gray-900">{farmer.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-gray-900">{farmer.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{farmer.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <p className="text-gray-900">{farmer.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Local Government Area</label>
                    <p className="text-gray-900">{farmer.lga || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ward</label>
                    <p className="text-gray-900">{farmer.ward || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{farmer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Farm Information */}
              {farmer.farms && farmer.farms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                    Farm Information
                  </h3>
                  <div className="space-y-4">
                    {farmer.farms.map((farm, index) => (
                      <div key={farm.id} className="bg-gray-50 p-4 rounded-md">
                        <h4 className="font-medium text-gray-900 mb-2">Farm #{index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Size:</span> {farm.farmSize} hectares
                          </div>
                          <div>
                            <span className="font-medium">Primary Crop:</span> {farm.primaryCrop}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span> {farm.farmState}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <p className="text-gray-900">{formatDate(farmer.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                      farmer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {farmer.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registered By</label>
                    <p className="text-gray-900">{farmer.agent?.displayName || 'System'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certificate ID</label>
                    <p className="text-gray-900 font-mono">CCSA-{Date.now().toString().slice(-8)}-{farmer.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code and Verification */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Digital Verification
                </h3>
                {qrCodeUrl && (
                  <div className="mb-4">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="mx-auto w-48 h-48 border"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to verify the authenticity of this certificate
                </p>
                <div className="text-xs text-gray-500">
                  <p>Certificate generated on:</p>
                  <p>{formatDate(new Date())}</p>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Official Certification
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Director's Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Official Seal</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-600 text-center">
                  <p>This certificate is valid and verifiable</p>
                  <p>through the CCSA verification system</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="bg-gray-100 px-8 py-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Centre for Climate Smart Agriculture</p>
            <p>Cosmopolitan University Abuja</p>
            <p>Certificate ID: CCSA-{Date.now().toString().slice(-8)}-{farmer.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
