import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Load Google Maps JS API on client only
const GoogleMap = dynamic(() => import('../components/GoogleMapPolygons'), { ssr: false });

export default function GISMapGoogle() {
  const router = useRouter();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/farms/geojson');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed loading farms');
      setFarms(data.farms || []);
    } catch (e) {
      setError(e.message);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBack = useCallback(() => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // If no history, go to dashboard
      router.push('/dashboard');
    }
  }, [router]);

  const center = useMemo(() => ({ lat: 9.0765, lng: 8.6753 }), []); // Nigeria

  return (
    <>
      <Head>
        <title>Farm GIS - CCSA</title>
        <meta name="description" content="Interactive GIS map showing farm locations and boundaries" />
      </Head>
      <div style={{ position: 'fixed', inset: 0 }}>
        <GoogleMap 
          center={center} 
          farms={farms} 
          loading={loading} 
          onReload={loadData} 
          onBack={handleBack}
        />
        {error && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background:'#fee2e2', color:'#991b1b', padding:'8px 12px', borderRadius:8, boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
            {error}
          </div>
        )}
      </div>
    </>
  );
}
