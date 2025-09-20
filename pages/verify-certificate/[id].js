import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import { 
  formatFullName, 
  formatLocation, 
  formatCropName, 
  toTitleCase,
  formatEmploymentStatus,
  formatMaritalStatus 
} from '../../lib/textUtils';
import { 
  ExclamationCircleIcon as AlertCircle, 
  CheckCircleIcon as CheckCircle, 
  UserIcon as User, 
  MapPinIcon as MapPin, 
  CubeIcon as Crop, 
  CalendarIcon as Calendar, 
  DocumentTextIcon as FileText,
  PrinterIcon as Printer 
} from '@heroicons/react/24/outline';

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { MapContainer, TileLayer, Marker, Popup, Polygon } = mod;
    return function CertificateMap({ center, zoom, farmData, farmerName }) {
      const position = center || [9.0765, 7.3986];
      
      return (
        <MapContainer 
          center={position} 
          zoom={zoom || 10} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Farm marker */}
          {center && (
            <Marker position={position}>
              <Popup>
                <div>
                  <h3 className="font-bold">{farmerName}'s Farm</h3>
                  {farmData && (
                    <div className="text-sm">
                      <p>Size: {farmData.farmSize} hectares</p>
                      <p>Crop: {farmData.primaryCrop}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Farm polygon if available */}
          {farmData?.farmPolygon && Array.isArray(farmData.farmPolygon) && (
            <Polygon 
              positions={farmData.farmPolygon.map(coord => [coord[1], coord[0]])} // Convert [lng, lat] to [lat, lng]
              color="#10B981"
              fillColor="#10B981"
              fillOpacity={0.3}
            />
          )}
        </MapContainer>
      );
    };
  }),
  { 
    ssr: false,
    loading: () => <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
  }
);

export default function VerifyCertificate() {
  const router = useRouter();
  const { id } = router.query;
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCertificate(id);
    }
  }, [id]);

  const fetchCertificate = async (certificateId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/verify/${certificateId}`);
      const data = await response.json();

      if (response.ok) {
        setCertificate(data);
      } else {
        setError(data.error || 'Certificate not found');
      }
    } catch (error) {
      setError('Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying certificate...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Head>
          <title>Certificate Verification - CCSA</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Certificate Verification - {certificate?.farmer?.firstName} {certificate?.farmer?.lastName} - CCSA</title>
        <meta name="description" content={`Verified certificate for ${certificate?.farmer?.firstName} ${certificate?.farmer?.lastName} - Climate-Smart Agriculture Program`} />
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Verification Status */}
          <div className="bg-white rounded-lg shadow-lg mb-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mr-4" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Certificate Verified</h1>
                  <p className="text-gray-600">This certificate is authentic and valid</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
              >
                <Printer className="h-5 w-5 mr-2" />
                Print Certificate
              </button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold">Certificate ID: {certificate.certificateId}</p>
              <p className="text-green-600 text-sm">Issued on {new Date(certificate.issuedDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Farmer Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Farmer Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatFullName(certificate.farmer.firstName, certificate.farmer.middleName, certificate.farmer.lastName)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900">{certificate.farmer.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900">{toTitleCase(certificate.farmer.gender) || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{certificate.farmer.email || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Date</label>
                  <p className="text-gray-900">
                    {new Date(certificate.farmer.registrationDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Total Farms</label>
                  <p className="text-blue-600 font-semibold">
                    {certificate.farmer.totalFarms} farm{certificate.farmer.totalFarms !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    certificate.farmer.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {toTitleCase(certificate.farmer.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Location Details</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">State</label>
                  <p className="text-lg font-semibold text-gray-900">{formatLocation(certificate.farmer.state)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Local Government Area</label>
                  <p className="text-gray-900">{formatLocation(certificate.farmer.lga)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ward</label>
                  <p className="text-gray-900">{formatLocation(certificate.farmer.ward) || 'Not specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{certificate.farmer.address || 'Not provided'}</p>
                </div>

                {certificate.farmer.pollingUnit && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Polling Unit</label>
                    <p className="text-gray-900">{formatLocation(certificate.farmer.pollingUnit)}</p>
                  </div>
                )}

                {certificate.farmer.latitude && certificate.farmer.longitude && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coordinates</label>
                    <p className="text-gray-900">
                      {certificate.farmer.latitude.toFixed(6)}, {certificate.farmer.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Farm Information */}
            {certificate.farm && (
              <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
                <div className="flex items-center mb-6">
                  <Crop className="h-6 w-6 text-yellow-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Farm Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Farm Size</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {certificate.farm.farmSize} hectares
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Primary Crop</label>
                    <p className="text-gray-900">{formatCropName(certificate.farm.primaryCrop)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Secondary Crop</label>
                    <p className="text-gray-900">{formatCropName(certificate.farm.secondaryCrop) || 'None'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Farm Ownership</label>
                    <p className="text-gray-900">{toTitleCase(certificate.farm.farmOwnership)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Farming Season</label>
                    <p className="text-gray-900">{toTitleCase(certificate.farm.farmingSeason)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Farming Experience</label>
                    <p className="text-gray-900">{certificate.farm.farmingExperience} years</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Soil Type</label>
                    <p className="text-gray-900">{toTitleCase(certificate.farm.soilType)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Soil Fertility</label>
                    <p className="text-gray-900">{toTitleCase(certificate.farm.soilFertility)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Yield</label>
                    <p className="text-gray-900">{certificate.farm.quantity} kg</p>
                  </div>
                </div>

                {certificate.farm.farmLatitude && certificate.farm.farmLongitude && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-500">Farm Coordinates</label>
                    <p className="text-gray-900">
                      {certificate.farm.farmLatitude.toFixed(6)}, {certificate.farm.farmLongitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            )}
          
          {/* Farm Map */}
          {certificate.farm && (certificate.farm.farmPolygon || certificate.farm.farmCoordinates || 
            (certificate.farm.farmLatitude && certificate.farm.farmLongitude)) && (
            <div className="bg-white rounded-lg shadow-lg mt-8 p-6 print:hidden">
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Farm Location</h2>
              </div>
              
              <div className="h-96 rounded-lg overflow-hidden">
                <DynamicMap
                  center={
                    certificate.farm.farmLatitude && certificate.farm.farmLongitude
                      ? [certificate.farm.farmLatitude, certificate.farm.farmLongitude]
                      : (certificate.farmer.latitude && certificate.farmer.longitude
                          ? [certificate.farmer.latitude, certificate.farmer.longitude]
                          : null)
                  }
                  zoom={15}
                  farmData={certificate.farm}
                  farmerName={`${certificate.farmer.firstName} ${certificate.farmer.lastName}`}
                />
              </div>
              
              {certificate.farm.farmPolygon && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Farm Area:</strong> {certificate.farm.farmSize} hectares
                    {certificate.farm.coordinateSystem && (
                      <span className="ml-2">({certificate.farm.coordinateSystem})</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Certificate Information */}
          <div className="bg-white rounded-lg shadow-lg mt-8 p-6">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Certificate Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Issuing Authority</label>
                <p className="text-gray-900">Centre for Climate-Smart Agriculture</p>
                <p className="text-gray-600 text-sm">Cosmopolitan University Abuja</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Program</label>
                <p className="text-gray-900">Climate-Smart Agriculture Program</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Certificate Type</label>
                <p className="text-gray-900">Farmer Registration Certificate</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Verification URL</label>
                <p className="text-blue-600 text-sm break-all">
                  {`http://192.168.0.5:3000/verify-certificate/${certificate.certificateId}`}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600 text-sm">
              This certificate has been digitally verified and is authentic. 
              For any inquiries, please contact the Centre for Climate-Smart Agriculture.
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .shadow-lg {
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
          }
          .bg-gray-50 {
            background-color: white !important;
          }
          .rounded-lg {
            border-radius: 0.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}
