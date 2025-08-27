import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import ccsaCertLogo from '../../../public/certificate-logo.png'
import { usePermissions, PERMISSIONS } from '../../../components/PermissionProvider'
import { 
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function FarmerCertificate() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission } = usePermissions()
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

  // Generate certificate number
  const generateCertificateNumber = (farmerId, createdAt) => {
    const year = new Date(createdAt).getFullYear()
    const paddedId = String(farmerId).replace(/[^0-9]/g, '').slice(-6).padStart(6, '0')
    return `CCSA/${year}/${paddedId}`
  }

  // Generate barcode data
  const generateBarcodeData = (certificateNumber) => {
    return certificateNumber.replace(/\//g, '')
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'loading') return

    // Check permissions
    if (!hasPermission(PERMISSIONS.FARMERS_READ)) {
      router.push('/dashboard')
      return
    }

    if (id && session) {
      // Validate that id is not the literal "[id].js" or similar
      if (id === '[id].js' || id === '[id]' || id.includes('[') || id.includes(']')) {
        setError('Invalid farmer ID. Please use a valid farmer ID in the URL.')
        setLoading(false)
        return
      }
      
      fetchFarmerDetails()
    }
  }, [id, session, status, hasPermission])

  const fetchFarmerDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching farmer details for ID:', id)
      
      // Validate ID format
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid farmer ID provided')
      }
      
      // Use the main farmers API
      const response = await fetch(`/api/farmers/${encodeURIComponent(id)}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Farmer details received:', data)
        
        // Handle different response formats
        const farmerData = data.farmer || data
        
        if (farmerData && farmerData.id) {
          setFarmer(farmerData)
        } else {
          throw new Error('Invalid farmer data received from server')
        }
      } else {
        // Get the error details
        let errorMessage = `Failed to fetch farmer (${response.status}: ${response.statusText})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`
        }
        
        console.error('API Error:', errorMessage)
        
        // Provide user-friendly error messages for common cases
        if (response.status === 404) {
          errorMessage = `Farmer with ID "${id}" was not found. Please check the farmer ID and try again.`
        } else if (response.status === 401) {
          errorMessage = 'You are not authorized to view this farmer. Please sign in again.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to view this farmer details.'
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error fetching farmer:', error)
      setError(error.message || 'Failed to load farmer details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Farmer Certificate">
        <div className="animate-pulse">
          <div className="bg-white p-6">
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
        <div className="bg-red-50 border  border-red-200 rounded-md p-4">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-medium text-red-900">Certificate Not Available</h3>
            <p className="text-red-700 mb-4">{error || 'Farmer not found'}</p>
            {id && (
              <div className="text-sm text-red-600 mb-4">
                <p>Farmer ID: {id}</p>
                {(id === '[id].js' || id === '[id]' || id.includes('[') || id.includes(']')) && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-medium">URL Format Error:</p>
                    <p className="text-yellow-700">
                      The URL should contain an actual farmer ID, not "[id].js"
                    </p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Example: /certificates/farmer/123 or /certificates/farmer/cm1abcd1234
                    </p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => router.push('/farmers')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Farmers
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const certificateNumber = generateCertificateNumber(farmer.id, farmer.createdAt)
  const barcodeData = generateBarcodeData(certificateNumber)
  const issueDate = farmer.certificates?.[0]?.issuedDate || farmer.createdAt
  const expiryDate = farmer.certificates?.[0]?.expiryDate || new Date(new Date(farmer.createdAt).getTime() + 365*24*60*60*1000).toISOString()

  return (
    <Layout title={`Certificate - ${farmer.firstName} ${farmer.lastName}`}>
      <div className="min-h-screen bg-white">
        {/* Header Actions - Hidden on Print */}
        <div className="print:hidden bg-white border-b border-gray-200 mb-4">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Farmer Registration Certificate</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Certificate for {farmer.firstName} {farmer.lastName}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Certificate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Certificate - Optimized for Single Page */}
        <div className=" max-w-4xl mx-auto">
          <div className="bg-white" style={{ 
            width: '210mm', 
            height: '297mm',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            
            {/* Certificate Content */}
            <div className="certificate-content" style={{ 
              padding: '20mm 15mm', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}>
              
              {/* Header Section - Compact */}
              <div className="header-section mb-4">
                <div className="flex flex-col space-y-4 mb-6">
                  {/* Company Logo & Info */}
                  <div className="flex flex-col justify-center text-center items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-md border-2 border-green-800 mr-4">
                      <Image
                        src={ccsaCertLogo}
                        alt="CCSA Logo"
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                      {/* <div className="text-center">
                        <div className="text-white font-bold text-lg leading-tight">CCSA</div>
                        <div className="text-green-100 text-xs">NIGERIA</div>
                      </div> */}
                    </div>
                    
                    <div>
                      <h1 className="text-3xl font-bold text-green-800 leading-tight">
                        Centre for Climate-Smart Agriculture 
                      </h1>
                      <div className=' font-semibold mb-2 text-ccsa-blue text-xl'>Cosmopolitan University Abuja</div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>Tel: +234-806-224-9834 | Email: ccsa@cosmopolitan.edu.ng | ccsa.cosmopolitan.edu.ng</div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Number & Barcode */}
                  <div className=" flex justify-between border-y border-gray-200 ">
                   
                    <div className=" p-3 text-left rounded mb-2">
                      <div className="text-sm font-bold text-gray-800">
                        Certificate No: <span className="text-green-700">{certificateNumber}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Issued: {formatDate(issueDate)}
                      </div>
                      {/* <div className="text-xs text-gray-600">
                        Valid Until: {formatDate(expiryDate)}
                      </div> */}


                    </div>

                    {/* Compact Barcode */}
                    <div className=" border-gray-300 p-2 flex items-center justify-center">
                      <div className="font-mono text-xs text-center">
                        <div className="flex justify-center space-x-px mb-1">
                          {barcodeData.substring(0, 12).split('').map((char, index) => (
                            <div key={index} className="bg-black w-px h-4"></div>
                          ))}
                        </div>
                        <div className="text-black text-xs">{barcodeData.substring(0, 12)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <div className=" py-3 text-center rounded">
                  <h2 className="text-2xl font-bold text-gray-800 tracking-wide">
                    FARMER REGISTRATION CERTIFICATE
                  </h2>
                  <p className="text-sm text-green-700 mt-1">Centre for CLimate-Smart Agriculture (CCSA)</p>
                </div>
              </div>

              {/* Main Content - Compact */}
              <div className="main-content flex-1">
                {/* Certification Statement */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">This is to certify that</h3>
                  
                  <div className=" border-y-2 border-ccsa-blue p-4 mb-4">
                    <h2 className="text-3xl font-bold text-ccsa-blue tracking-wide">
                      {capitalize(farmer.firstName)} {farmer.middleName ? capitalize(farmer.middleName) + ' ' : ''}{capitalize(farmer.lastName)}
                    </h2>
                    <p className="text-base font-medium text-gray-700 mt-1">
                      NIN: <span className="font-bold">{farmer.nin}</span>
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-800 leading-relaxed mb-4">
                    is a duly registered farmer with <span className=' font-semibold'> The Centre for Climate-Smart Agriculture (CCSA), Cosmopolitan University Abuja, </span>
                    and is hereby authorized to participate in CCSA agricultural programs, initiatives, and benefits.
                  </p>
                </div>

                {/* Details Grid - Compact */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Personal Information */}
                  <div className="border border-gray-200 rounded p-3">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-200 pb-1">
                      Personal Information
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{farmer.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-semibold">{capitalize(farmer.gender)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DOB:</span>
                        <span className="font-semibold text-xs">{formatDate(farmer.dateOfBirth)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold">{capitalize(farmer.maritalStatus)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  <div className="border border-gray-200 rounded p-3">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-200 pb-1">
                      Location Details
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">State:</span>
                        <span className="font-semibold">{capitalize(farmer.state)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">LGA:</span>
                        <span className="font-semibold">{capitalize(farmer.lga)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ward:</span>
                        <span className="font-semibold">{capitalize(farmer.ward)}</span>
                      </div>
                      {farmer.cluster && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cluster:</span>
                          <span className="font-semibold text-xs">{farmer.cluster.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Farm Information */}
                  <div className="border border-gray-200 rounded p-3">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-200 pb-1">
                      Farm Information
                    </h4>
                    {farmer.farms && farmer.farms.length > 0 ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-semibold">{farmer.farms[0].farmSize} ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crop:</span>
                          <span className="font-semibold">{capitalize(farmer.farms[0].primaryCrop)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-semibold">{capitalize(farmer.farms[0].farmState)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">LGA:</span>
                          <span className="font-semibold text-xs">{capitalize(farmer.farms[0].farmLocalGovernment)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No farm data available</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - Signature Section */}
              <div className="footer-section">
                <div className=" flex justify-between mb-4">
                  {/* Issue Date */}
                 
                  
                  {/* Cluster Lead */}
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-1 mb-2 w-32 mx-auto">
                      <div className="h-8"></div>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">
                        {farmer.cluster ? 
                          `${farmer.cluster.clusterLeadFirstName} ${farmer.cluster.clusterLeadLastName}` : 
                          'Cluster Lead'
                        }
                      </p>
                      <p className="text-gray-600">Cluster Lead</p>
                    </div>
                  </div>
                  
                  {/* CCSA CEO */}
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-1 mb-2 w-32 mx-auto">
                      <div className="h-8"></div>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">Dr. Rislan Abulaziz Kanya</p>
                      <p className="text-gray-600">Chief Executive Officer</p>
                      <p className="text-gray-500">CCSA</p>
                    </div>
                  </div>
                </div>
                
                {/* Official Seal & Footer */}
              
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .certificate-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .certificate-content {
            padding: 15mm 10mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
          }
          
          .header-section {
            margin-bottom: 8mm !important;
          }
          
          .main-content {
            flex: 1 !important;
          }
          
          .footer-section {
            margin-top: auto !important;
          }
          
          /* Ensure single page */
          .certificate-page {
            page-break-inside: avoid;
            page-break-after: avoid;
            overflow: hidden;
          }
        }
      `}</style>
    </Layout>
  )
}
// import { useState, useEffect } from 'react'
// import { useSession } from 'next-auth/react'
// import { useRouter } from 'next/router'
// import Layout from '../../../components/Layout'
// import { usePermissions, PERMISSIONS } from '../../../components/PermissionProvider'
// import { 
//   DocumentTextIcon,
//   PrinterIcon,
//   ArrowDownTrayIcon,
//   BuildingOfficeIcon
// } from '@heroicons/react/24/outline'

// export default function FarmerCertificate() {
//   const { data: session, status } = useSession()
//   const router = useRouter()
//   const { hasPermission } = usePermissions()
//   const { id } = router.query
//   const [farmer, setFarmer] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   // Helper function to capitalize text
//   const capitalize = (text) => {
//     if (!text) return ''
//     return text.toString().toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
//   }

//   // Helper function to format date
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A'
//     return new Date(dateString).toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'long', 
//       year: 'numeric'
//     })
//   }

//   // Generate certificate number
//   const generateCertificateNumber = (farmerId, createdAt) => {
//     const year = new Date(createdAt).getFullYear()
//     const paddedId = String(farmerId).replace(/[^0-9]/g, '').slice(-6).padStart(6, '0')
//     return `CCSA/${year}/${paddedId}`
//   }

//   // Generate barcode data
//   const generateBarcodeData = (certificateNumber) => {
//     return certificateNumber.replace(/\//g, '')
//   }

//   useEffect(() => {
//     if (status === 'unauthenticated') {
//       router.push('/auth/signin')
//       return
//     }

//     if (status === 'loading') return

//     // Check permissions
//     if (!hasPermission(PERMISSIONS.FARMERS_READ)) {
//       router.push('/dashboard')
//       return
//     }

//     if (id && session) {
//       // Validate that id is not the literal "[id].js" or similar
//       if (id === '[id].js' || id === '[id]' || id.includes('[') || id.includes(']')) {
//         setError('Invalid farmer ID. Please use a valid farmer ID in the URL.')
//         setLoading(false)
//         return
//       }
      
//       fetchFarmerDetails()
//     }
//   }, [id, session, status, hasPermission])

//   const fetchFarmerDetails = async () => {
//     try {
//       setLoading(true)
//       setError(null)
      
//       console.log('Fetching farmer details for ID:', id)
      
//       // Validate ID format
//       if (!id || typeof id !== 'string' || id.trim() === '') {
//         throw new Error('Invalid farmer ID provided')
//       }
      
//       // Use the main farmers API
//       const response = await fetch(`/api/farmers/${encodeURIComponent(id)}`)
      
//       if (response.ok) {
//         const data = await response.json()
//         console.log('Farmer details received:', data)
        
//         // Handle different response formats
//         const farmerData = data.farmer || data
        
//         if (farmerData && farmerData.id) {
//           setFarmer(farmerData)
//         } else {
//           throw new Error('Invalid farmer data received from server')
//         }
//       } else {
//         // Get the error details
//         let errorMessage = `Failed to fetch farmer (${response.status}: ${response.statusText})`
//         try {
//           const errorData = await response.json()
//           errorMessage = errorData.error || errorMessage
//         } catch (e) {
//           // If response is not JSON, use status text
//           errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`
//         }
        
//         console.error('API Error:', errorMessage)
        
//         // Provide user-friendly error messages for common cases
//         if (response.status === 404) {
//           errorMessage = `Farmer with ID "${id}" was not found. Please check the farmer ID and try again.`
//         } else if (response.status === 401) {
//           errorMessage = 'You are not authorized to view this farmer. Please sign in again.'
//         } else if (response.status === 403) {
//           errorMessage = 'You do not have permission to view this farmer details.'
//         }
        
//         throw new Error(errorMessage)
//       }
//     } catch (error) {
//       console.error('Error fetching farmer:', error)
//       setError(error.message || 'Failed to load farmer details')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handlePrint = () => {
//     window.print()
//   }

//   if (status === 'loading' || loading) {
//     return (
//       <Layout title="Farmer Certificate">
//         <div className="animate-pulse">
//           <div className="bg-white p-6">
//             <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
//             <div className="space-y-3">
//               <div className="h-4 bg-gray-200 rounded w-full"></div>
//               <div className="h-4 bg-gray-200 rounded w-2/3"></div>
//             </div>
//           </div>
//         </div>
//       </Layout>
//     )
//   }

//   if (error || !farmer) {
//     return (
//       <Layout title="Farmer Certificate">
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="text-center">
//             <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
//             <h3 className="mt-2 text-lg font-medium text-red-900">Certificate Not Available</h3>
//             <p className="text-red-700 mb-4">{error || 'Farmer not found'}</p>
//             {id && (
//               <div className="text-sm text-red-600 mb-4">
//                 <p>Farmer ID: {id}</p>
//                 {(id === '[id].js' || id === '[id]' || id.includes('[') || id.includes(']')) && (
//                   <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
//                     <p className="text-yellow-800 font-medium">URL Format Error:</p>
//                     <p className="text-yellow-700">
//                       The URL should contain an actual farmer ID, not "[id].js"
//                     </p>
//                     <p className="text-yellow-700 text-xs mt-1">
//                       Example: /certificates/farmer/123 or /certificates/farmer/cm1abcd1234
//                     </p>
//                   </div>
//                 )}
//               </div>
//             )}
//             <button
//               onClick={() => router.push('/farmers')}
//               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//             >
//               Back to Farmers
//             </button>
//           </div>
//         </div>
//       </Layout>
//     )
//   }

//   const certificateNumber = generateCertificateNumber(farmer.id, farmer.createdAt)
//   const barcodeData = generateBarcodeData(certificateNumber)
//   const issueDate = farmer.certificates?.[0]?.issuedDate || farmer.createdAt
//   const expiryDate = farmer.certificates?.[0]?.expiryDate || new Date(new Date(farmer.createdAt).getTime() + 365*24*60*60*1000).toISOString()

//   return (
//     <Layout title={`Certificate - ${farmer.firstName} ${farmer.lastName}`}>
//       <div className="min-h-screen bg-white">
//         {/* Header Actions - Hidden on Print */}
//         <div className="print:hidden bg-white border-b border-gray-200 mb-4">
//           <div className="max-w-4xl mx-auto px-4 py-4">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-xl font-semibold text-gray-900">Farmer Registration Certificate</h1>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Certificate for {farmer.firstName} {farmer.lastName}
//                 </p>
//               </div>
//               <div className="flex space-x-3">
//                 <button
//                   onClick={() => router.back()}
//                   className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   ← Back
//                 </button>
//                 <button
//                   onClick={handlePrint}
//                   className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
//                 >
//                   <PrinterIcon className="h-4 w-4 mr-2" />
//                   Print Certificate
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Professional PDF-like Certificate */}
//         <div className="max-w-4xl mx-auto">
//           <div className="bg-white" style={{ 
//             width: '210mm', 
//             minHeight: '297mm',
//             margin: '0 auto',
//             fontFamily: 'Arial, sans-serif'
//           }}>
            
//             {/* Certificate Content */}
//             <div className="p-12 relative" style={{ minHeight: '297mm' }}>
              
//               {/* Header with Logo and Company Info */}
//               <div className="text-center mb-8">
//                 <div className="flex justify-center items-center mb-6">
//                   {/* Enhanced Company Logo */}
//                   <div className="w-24 h-24 relative mr-6">
//                     <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg border-4 border-green-800">
//                       <div className="text-center">
//                         <div className="text-white font-bold text-xl leading-tight">CCSA</div>
//                         <div className="text-green-100 text-xs font-medium">NIGERIA</div>
//                       </div>
//                     </div>
//                     {/* Official seal overlay */}
//                     <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
//                       <span className="text-white text-xs font-bold">★</span>
//                     </div>
//                   </div>
                  
//                   {/* Enhanced Company Details */}
//                   <div className="text-left">
//                     <h1 className="text-2xl font-bold text-green-800 leading-tight mb-2">
//                       CENTRE FOR CLIMATE CHANGE AND<br />
//                       SUSTAINABLE AGRICULTURE
//                     </h1>
//                     <div className="text-sm text-gray-700 space-y-1">
//                       <div className="flex items-center">
//                         <BuildingOfficeIcon className="h-4 w-4 mr-2 text-green-600" />
//                         <span className="font-medium">No. 15 Climate Change Avenue, Garki, Abuja, Nigeria</span>
//                       </div>
//                       <div className="flex items-center text-gray-600">
//                         <span className="ml-6">Tel: +234-9-461-4521</span>
//                         <span className="mx-2">|</span>
//                         <span>Email: info@ccsa.gov.ng</span>
//                         <span className="mx-2">|</span>
//                         <span>Website: www.ccsa.gov.ng</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Professional Certificate Title */}
//                 <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-r-4 border-green-600 py-4 my-6 rounded">
//                   <h2 className="text-2xl font-bold text-gray-800 tracking-wider uppercase">
//                     FARMER REGISTRATION CERTIFICATE
//                   </h2>
//                   <p className="text-sm text-green-700 mt-1 font-medium">
//                     MINISTRY OF AGRICULTURE AND RURAL DEVELOPMENT
//                   </p>
//                 </div>
                
//                 {/* Enhanced Certificate Number and Barcode */}
//                 <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg border">
//                   <div>
//                     <p className="text-lg font-bold text-gray-800 mb-1">
//                       Certificate No: <span className="text-green-700">{certificateNumber}</span>
//                     </p>
//                     <p className="text-sm text-gray-600">
//                       Issued: {formatDate(issueDate)} | Valid Until: {formatDate(expiryDate)}
//                     </p>
//                   </div>
                  
//                   {/* Enhanced Barcode representation */}
//                   <div className="text-center">
//                     <div className="bg-white border-2 border-gray-300 p-2 inline-block">
//                       {/* ASCII Barcode Pattern */}
//                       <div className="font-mono text-xs leading-none tracking-tighter">
//                         <div className="flex justify-center space-x-px">
//                           {barcodeData.split('').map((char, index) => (
//                             <div key={index} className="flex flex-col">
//                               <div className="bg-black w-px h-8"></div>
//                               <div className="bg-black w-px h-6"></div>
//                               <div className="bg-black w-px h-8"></div>
//                               <div className="w-px h-2"></div>
//                               <div className="bg-black w-px h-6"></div>
//                             </div>
//                           ))}
//                         </div>
//                         <div className="mt-2 text-black font-bold text-xs tracking-wider">
//                           {barcodeData}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-xs text-gray-500 mt-1">Verification Code</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Main Certification Content */}
//               <div className="text-center mb-8">
//                 <h3 className="text-xl font-semibold text-gray-800 mb-6">
//                   This is to certify that
//                 </h3>
                
//                 {/* Farmer Name Highlight */}
//                 <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-8 mx-auto max-w-2xl">
//                   <h2 className="text-3xl font-bold text-green-800 mb-3 tracking-wide">
//                     {capitalize(farmer.firstName)} {farmer.middleName ? capitalize(farmer.middleName) + ' ' : ''}{capitalize(farmer.lastName)}
//                   </h2>
//                   <p className="text-lg font-medium text-gray-700">
//                     NIN: <span className="font-bold">{farmer.nin}</span>
//                   </p>
//                 </div>
                
//                 {/* Certification Statement */}
//                 <p className="text-lg text-gray-800 leading-relaxed mb-8 max-w-4xl mx-auto">
//                   is a duly registered farmer with the Centre for Climate Change and Sustainable Agriculture (CCSA) 
//                   and is hereby authorized to participate in all CCSA agricultural programs, initiatives, and benefits 
//                   in accordance with our established guidelines and regulations.
//                 </p>
//               </div>

//               {/* Farmer Details Section */}
//               <div className="grid grid-cols-2 gap-8 mb-8">
//                 {/* Personal Information */}
//                 <div className="border border-gray-300 rounded-lg p-6">
//                   <h4 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-300 pb-2">
//                     Personal Information
//                   </h4>
//                   <div className="space-y-3 text-sm">
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Phone:</span>
//                       <span className="font-semibold">{farmer.phone}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Email:</span>
//                       <span className="font-semibold text-xs">{farmer.email || 'N/A'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Gender:</span>
//                       <span className="font-semibold">{capitalize(farmer.gender)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Date of Birth:</span>
//                       <span className="font-semibold">{formatDate(farmer.dateOfBirth)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Marital Status:</span>
//                       <span className="font-semibold">{capitalize(farmer.maritalStatus)}</span>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Location Details */}
//                 <div className="border border-gray-300 rounded-lg p-6">
//                   <h4 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-300 pb-2">
//                     Location Details
//                   </h4>
//                   <div className="space-y-3 text-sm">
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">State:</span>
//                       <span className="font-semibold">{capitalize(farmer.state)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">LGA:</span>
//                       <span className="font-semibold">{capitalize(farmer.lga)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium text-gray-600">Ward:</span>
//                       <span className="font-semibold">{capitalize(farmer.ward)}</span>
//                     </div>
//                     {farmer.cluster && (
//                       <div className="flex justify-between">
//                         <span className="font-medium text-gray-600">Cluster:</span>
//                         <span className="font-semibold">{farmer.cluster.title}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Farm Information */}
//               {farmer.farms && farmer.farms.length > 0 && (
//                 <div className="mb-8">
//                   <div className="border border-gray-300 rounded-lg p-6">
//                     <h4 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-300 pb-2">
//                       Farm Information
//                     </h4>
//                     <div className="grid grid-cols-2 gap-6 text-sm">
//                       <div className="space-y-3">
//                         <div className="flex justify-between">
//                           <span className="font-medium text-gray-600">Farm Size:</span>
//                           <span className="font-semibold">
//                             {farmer.farms[0].farmSize} hectares
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="font-medium text-gray-600">Primary Crop:</span>
//                           <span className="font-semibold">{capitalize(farmer.farms[0].primaryCrop)}</span>
//                         </div>
//                       </div>
//                       <div className="space-y-3">
//                         <div className="flex justify-between">
//                           <span className="font-medium text-gray-600">Farm State:</span>
//                           <span className="font-semibold">{capitalize(farmer.farms[0].farmState)}</span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="font-medium text-gray-600">Farm LGA:</span>
//                           <span className="font-semibold">{capitalize(farmer.farms[0].farmLocalGovernment)}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Signature Section */}
//               <div className="absolute bottom-12 left-12 right-12">
//                 <div className="grid grid-cols-3 gap-8 items-end">
//                   {/* Issue Date */}
//                   <div className="text-center">
//                     <div className="text-sm text-gray-600 space-y-2">
//                       <div>
//                         <p className="font-medium">Issue Date:</p>
//                         <p className="font-bold text-gray-800">{formatDate(issueDate)}</p>
//                       </div>
//                       <div>
//                         <p className="font-medium">Valid Until:</p>
//                         <p className="font-bold text-gray-800">{formatDate(expiryDate)}</p>
//                       </div>
//                     </div>
//                   </div>
                  
//                   {/* Cluster Lead Signature */}
//                   <div className="text-center">
//                     <div className="border-t-2 border-gray-800 pt-2 mb-2 w-40 mx-auto">
//                       <div className="h-12"></div>
//                     </div>
//                     <div className="text-sm">
//                       <p className="font-semibold text-gray-800">
//                         {farmer.cluster ? 
//                           `${farmer.cluster.clusterLeadFirstName} ${farmer.cluster.clusterLeadLastName}` : 
//                           'Cluster Lead'
//                         }
//                       </p>
//                       <p className="text-gray-600">Cluster Lead</p>
//                       <p className="text-xs text-gray-500">
//                         {farmer.cluster ? farmer.cluster.title : 'Local Cluster'}
//                       </p>
//                     </div>
//                   </div>
                  
//                   {/* CCSA CEO Signature */}
//                   <div className="text-center">
//                     <div className="border-t-2 border-gray-800 pt-2 mb-2 w-40 mx-auto">
//                       <div className="h-12"></div>
//                     </div>
//                     <div className="text-sm">
//                       <p className="font-semibold text-gray-800">Dr. Rislan Abulaziz Kanya</p>
//                       <p className="text-gray-600">Chief Executive Officer</p>
//                       <p className="text-xs text-gray-500">Centre for Climate Change & Sustainable Agriculture</p>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Official Seal */}
//                 <div className="text-center mt-6">
//                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-600 mx-auto">
//                     <div className="text-green-700 font-bold text-xs">OFFICIAL<br/>SEAL</div>
//                   </div>
//                 </div>
                
//                 {/* Footer Note */}
//                 <div className="text-center mt-4 text-xs text-gray-500">
//                   <p>This certificate is issued electronically and is valid when verified through CCSA systems.</p>
//                   <p>For verification, visit www.ccsa.gov.ng/verify or scan the barcode above.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Professional Print Styles */}
//       <style jsx>{`
//         @media print {
//           @page {
//             size: A4 portrait;
//             margin: 0;
//           }
          
//           html, body {
//             width: 210mm;
//             height: 297mm;
//             margin: 0 !important;
//             padding: 0 !important;
//             background: white !important;
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//             font-family: Arial, sans-serif !important;
//           }
          
//           .print\\:hidden {
//             display: none !important;
//           }
          
//           * {
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//           }
          
//           .certificate-page {
//             page-break-inside: avoid;
//             page-break-after: avoid;
//           }
//         }
//       `}</style>
//     </Layout>
//   )
// }
