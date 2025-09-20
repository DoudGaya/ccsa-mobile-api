import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import map components with SSR disabled and avoid re-initialization
const DynamicMapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);
const DynamicTileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const DynamicPolygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);
const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function GISMap() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [farmData, setFarmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.0765, 8.6753]); // Nigeria center
  const [mapZoom, setMapZoom] = useState(6);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Stable map creation callback
  const whenCreated = useCallback((mapInstance) => {
    mapInstanceRef.current = mapInstance;
    setMapReady(true);
    console.log('Map instance created successfully');
  }, []);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load farm polygon data
  useEffect(() => {
    if (session) {
      loadFarmData();
    }
  }, [session]);

  const loadFarmData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/farms/geojson', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load farm data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.farms) {
        setFarmData(data.farms);
        
        // Auto-center map if farms are loaded
        if (data.farms.length > 0) {
          const bounds = calculateBounds(data.farms);
          setMapCenter([bounds.center.lat, bounds.center.lng]);
          setMapZoom(bounds.zoom);
        }
      } else {
        throw new Error(data.message || 'Failed to load farm data');
      }
    } catch (err) {
      console.error('Error loading farm data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate map bounds from farm polygons
  const calculateBounds = (farms) => {
    if (!farms.length) return { center: { lat: 9.0765, lng: 8.6753 }, zoom: 6 };

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    farms.forEach(farm => {
      if (farm.coordinates && farm.coordinates.length > 0) {
        farm.coordinates.forEach(coord => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const [lng, lat] = coord;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          }
        });
      }
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 10;
    if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 8;
    else if (maxDiff > 1) zoom = 9;
    else if (maxDiff > 0.5) zoom = 10;
    else zoom = 12;

    return {
      center: { lat: centerLat, lng: centerLng },
      zoom
    };
  };

  // Handle polygon click
  const handlePolygonClick = useCallback((farm) => {
    setSelectedFarm(farm);
    
    // Center map on clicked farm
    if (mapInstanceRef.current && farm.coordinates && farm.coordinates.length > 0) {
      const bounds = farm.coordinates.map(coord => [coord[1], coord[0]]);
      try {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      } catch (error) {
        console.warn('Could not fit bounds:', error);
      }
    }
  }, []);

  // Zoom to all farms
  const handleZoomToFarms = useCallback(() => {
    if (mapInstanceRef.current && farmData.length > 0) {
      const allBounds = [];
      farmData.forEach(farm => {
        if (farm.coordinates && farm.coordinates.length > 0) {
          farm.coordinates.forEach(coord => {
            allBounds.push([coord[1], coord[0]]);
          });
        }
      });
      
      if (allBounds.length > 0) {
        try {
          mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50] });
        } catch (error) {
          console.warn('Could not fit bounds to all farms:', error);
        }
      }
    }
  }, [farmData]);

  // Format area for display
  const formatArea = (area) => {
    if (!area) return 'N/A';
    if (area < 10000) return `${(area / 10000).toFixed(3)} hectares`;
    return `${(area / 10000).toFixed(2)} hectares`;
  };

  // Get polygon color based on farm properties
  const getPolygonColor = (farm) => {
    if (farm.status === 'verified') return '#10B981'; // Green
    if (farm.status === 'pending') return '#F59E0B'; // Yellow
    if (farm.crop) {
      // Color by crop type
      switch (farm.crop.toLowerCase()) {
        case 'rice': return '#3B82F6'; // Blue
        case 'maize': return '#EF4444'; // Red
        case 'wheat': return '#8B5CF6'; // Purple
        case 'beans': return '#F97316'; // Orange
        case 'cassava': return '#EC4899'; // Pink
        case 'yam': return '#14B8A6'; // Teal
        default: return '#6B7280'; // Gray
      }
    }
    return '#6B7280'; // Default gray
  };

  // Get polygon style based on selection
  const getPolygonStyle = (farm) => ({
    color: getPolygonColor(farm),
    weight: selectedFarm?.id === farm.id ? 4 : 2,
    fillColor: getPolygonColor(farm),
    fillOpacity: selectedFarm?.id === farm.id ? 0.6 : 0.3,
    dashArray: farm.status === 'pending' ? '5, 5' : null,
  });

  if (status === 'loading' || !isClient) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading map...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Farm GIS Map - CCSA</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>
      
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farm GIS Map</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Interactive map showing farm boundaries and details
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={loadFarmData}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Farms</dt>
                      <dd className="text-lg font-medium text-gray-900">{farmData.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {farmData.filter(f => f.status === 'verified').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {farmData.filter(f => f.status === 'pending').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Area</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatArea(farmData.reduce((sum, farm) => sum + (farm.area || 0), 0))}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Farm Data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Interactive Farm Map</h2>
              <p className="text-sm text-gray-500">Click on farm polygons to view details</p>
            </div>
            
            <div className="relative">
              <div style={{ height: '600px', width: '100%' }}>
                {isClient && (
                  <MapContainer
                    key={mapKey} // Force remount to avoid initialization errors
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                    whenCreated={(mapInstance) => {
                      mapRef.current = mapInstance;
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Satellite imagery option */}
                    {/* <TileLayer
                      attribution='Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
                      url="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_TOKEN"
                    /> */}
                    
                    {farmData.map((farm) => (
                      <Polygon
                        key={farm.id}
                        positions={farm.coordinates?.map(coord => [coord[1], coord[0]]) || []}
                        pathOptions={getPolygonStyle(farm)}
                        eventHandlers={{
                          click: () => handlePolygonClick(farm),
                          mouseover: (e) => {
                            e.target.setStyle({ weight: 4, fillOpacity: 0.5 });
                          },
                          mouseout: (e) => {
                            e.target.setStyle(getPolygonStyle(farm));
                          }
                        }}
                      >
                        <Popup maxWidth={300} closeButton={true}>
                          <div className="p-3 min-w-[280px]">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-bold text-lg text-gray-900 pr-2">
                                {farm.farmerName}'s Farm
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                farm.status === 'verified' ? 'bg-green-100 text-green-800' :
                                farm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {farm.status || 'Unknown'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Farmer:</span>
                                <p className="text-gray-900">{farm.farmerName || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Primary Crop:</span>
                                <p className="text-gray-900">{farm.crop || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Area:</span>
                                <p className="text-gray-900">{formatArea(farm.area)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Experience:</span>
                                <p className="text-gray-900">{farm.farmingExperience ? `${farm.farmingExperience} years` : 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Location:</span>
                                <p className="text-gray-900">{farm.state}, {farm.lga}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Ownership:</span>
                                <p className="text-gray-900">{farm.farmOwnership || 'N/A'}</p>
                              </div>
                              {farm.secondaryCrop && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Secondary Crop:</span>
                                  <p className="text-gray-900">{farm.secondaryCrop}</p>
                                </div>
                              )}
                              {farm.soilType && (
                                <div className="col-span-2">
                                  <span className="font-medium text-gray-600">Soil Type:</span>
                                  <p className="text-gray-900">{farm.soilType}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                              <p>Coordinates: {farm.coordinates?.length || 0} points</p>
                              <p>Farm ID: {farm.id}</p>
                            </div>
                          </div>
                        </Popup>
                      </Polygon>
                    ))}
                    
                    {/* Map Controls */}
                    <MapControls 
                      onZoomToFarms={handleZoomToFarms}
                      onRefresh={loadFarmData}
                      loading={loading}
                    />
                    
                    {/* Map Legend */}
                    <MapLegend farmData={farmData} />
                    
                    {/* Scale Control */}
                    <ScaleControl />
                  </MapContainer>
                )}
              </div>
              
              {loading && (
                <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading farm data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Map Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600 mr-2"></div>
                <span className="text-sm text-gray-700">Verified Farms</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-600 mr-2"></div>
                <span className="text-sm text-gray-700">Pending Farms</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-700">Rice Farms</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 border-2 border-red-600 mr-2"></div>
                <span className="text-sm text-gray-700">Maize Farms</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}