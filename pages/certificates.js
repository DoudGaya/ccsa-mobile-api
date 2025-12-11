import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { usePermissions, PermissionGate, PERMISSIONS } from '../components/PermissionProvider'
import { 
  DocumentTextIcon,
  DownloadIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function Certificates() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [certificates, setCertificates] = useState([])
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFarmer, setSelectedFarmer] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Check permissions
    if (!hasPermission(PERMISSIONS.FARMERS_READ)) {
      router.push('/dashboard')
      return
    }
    
    fetchData()
  }, [session, status, hasPermission])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [certificatesRes, farmersRes] = await Promise.all([
        fetch('/api/certificates'),
        fetch('/api/farmers')
      ])

      if (certificatesRes.ok) {
        const certificatesData = await certificatesRes.json()
        // Handle both array and paginated response formats
        if (Array.isArray(certificatesData)) {
          setCertificates(certificatesData)
        } else if (certificatesData.certificates) {
          setCertificates(certificatesData.certificates)
        } else {
          setCertificates([])
        }
      } else {
        setCertificates([])
      }

      if (farmersRes.ok) {
        const farmersData = await farmersRes.json()
        // Handle both array and paginated response formats
        if (Array.isArray(farmersData)) {
          setFarmers(farmersData)
        } else if (farmersData.farmers) {
          setFarmers(farmersData.farmers)
        } else if (farmersData.data) {
          setFarmers(farmersData.data)
        } else {
          setFarmers([])
        }
      } else {
        setFarmers([])
      }
    } catch (error) {
      setError('Failed to fetch data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = async (farmerId) => {
    try {
      setGenerating(true)
      setError('')
      setSuccess('')
      
      console.log('Generating certificate for farmer ID:', farmerId)
      
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, application/json'
        },
        body: JSON.stringify({ farmerId })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        // Check if response is PDF or JSON
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/pdf')) {
          // Download the PDF
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          
          // Get filename from response headers if available
          const contentDisposition = response.headers.get('content-disposition')
          let filename = 'CCSA-Certificate.pdf'
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }
          
          a.download = filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          setSuccess('Certificate generated and downloaded successfully!')
        } else {
          // Handle JSON response
          const data = await response.json()
          if (data.error) {
            throw new Error(data.error)
          } else {
            setSuccess('Certificate generation completed!')
          }
        }
        
        fetchData() // Refresh data
      } else {
        // Handle error responses
        let errorMessage = `Failed to generate certificate (${response.status})`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`
        }
        
        console.error('API Error:', errorMessage)
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Certificate generation error:', error)
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.')
      } else if (error.message.includes('NetworkError')) {
        setError('Network error occurred. Please check your connection and try again.')
      } else {
        setError(error.message || 'An error occurred while generating the certificate')
      }
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async (certificateId) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `CCSA-Certificate-${certificateId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Failed to download certificate')
      }
    } catch (error) {
      setError('An error occurred while downloading the certificate')
    }
  }

  // Filter data
  const filteredFarmers = (Array.isArray(farmers) ? farmers : []).filter(farmer => {
    const matchesSearch = farmer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.nin?.includes(searchTerm) ||
                         farmer.phone?.includes(searchTerm)
    return matchesSearch
  })

  const filteredCertificates = (Array.isArray(certificates) ? certificates : []).filter(cert => {
    const farmer = (Array.isArray(farmers) ? farmers : []).find(f => f.id === cert.farmerId)
    if (!farmer) return false
    
    const matchesSearch = farmer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificateId?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <Layout title="Certificates">
        <TableLoader rows={10} cols={7} />
      </Layout>
    )
  }

  return (
    <Layout title="Farmer Certificates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Farmer Certificates</h1>
            <p className="text-gray-600 mt-1">Generate and manage farmer certificates</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{Array.isArray(certificates) ? certificates.length : 0}</h3>
                <p className="text-sm text-gray-500">Total Certificates</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {Array.isArray(certificates) ? certificates.filter(c => c.status === 'active').length : 0}
                </h3>
                <p className="text-sm text-gray-500">Active Certificates</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{Array.isArray(farmers) ? farmers.length : 0}</h3>
                <p className="text-sm text-gray-500">Registered Farmers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {Array.isArray(certificates) ? certificates.filter(c => {
                    const issueDate = new Date(c.issuedDate)
                    const today = new Date()
                    const diffTime = Math.abs(today - issueDate)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return diffDays <= 30
                  }).length : 0}
                </h3>
                <p className="text-sm text-gray-500">Issued This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search farmers or certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Generate Certificates
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Issued Certificates
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Generate Certificates Tab */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Certificate</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFarmers.map((farmer) => {
                      const existingCert = Array.isArray(certificates) ? certificates.find(c => c.farmerId === farmer.id) : null
                      
                      return (
                        <tr key={farmer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {farmer.firstName} {farmer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{farmer.email || farmer.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {farmer.nin}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {farmer.state}, {farmer.lga}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(farmer.registrationDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {existingCert ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Certificate Issued
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending Certificate
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <PermissionGate permission={PERMISSIONS.FARMERS_READ}>
                                <Link
                                  href={`/certificates/farmer/${farmer.id}`}
                                  className="text-green-600 hover:text-green-900 text-xs"
                                >
                                  View Certificate
                                </Link>
                              </PermissionGate>
                              <PermissionGate permission={PERMISSIONS.FARMERS_UPDATE}>
                                <button
                                  onClick={() => generateCertificate(farmer.id)}
                                  disabled={generating}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                >
                                  {generating ? 'Generating...' : existingCert ? 'Regenerate' : 'Generate'}
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}