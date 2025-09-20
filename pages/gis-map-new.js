import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import Leaflet components with no SSR
const LeafletMap = dynamic(() => import('../components/LeafletMapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading interactive map...</p>
      </div>
    </div>
  )
});

export default function GISMapNew() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [farmData, setFarmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

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

  const loadFarmData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try main API first
      let response = await fetch('/api/farms/geojson', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // If main API fails (e.g., auth or database issues), use test data
      if (!response.ok) {
        console.log('Main API failed, using test coordinate data for debugging...');
        response = await fetch('/api/farms/test-coordinates');
      }

      const data = await response.json();
      
      if (data.success && data.farms) {
        setFarmData(data.farms);
        
        if (data.metadata?.testMode) {
          setError('Using test data - database connection issues detected');
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
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    if (!farmData.length) return { total: 0, verified: 0, pending: 0, totalArea: 0 };
    
    return {
      total: farmData.length,
      verified: farmData.filter(f => f.status === 'verified').length,
      pending: farmData.filter(f => f.status === 'pending').length,
      totalArea: farmData.reduce((sum, farm) => sum + (farm.area || 0), 0)
    };
  }, [farmData]);

  // Format area for display
  const formatArea = (area) => {
    if (!area) return 'N/A';
    if (area < 10000) return `${(area / 10000).toFixed(3)} hectares`;
    return `${(area / 10000).toFixed(2)} hectares`;
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{stats.verified}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{formatArea(stats.totalArea)}</dd>
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
                <LeafletMap
                  farmData={farmData}
                  loading={loading}
                  selectedFarm={selectedFarm}
                  onFarmSelect={setSelectedFarm}
                  onRefresh={loadFarmData}
                />
              </div>
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