import { useMemo, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';

/*
Contract:
- props.center: { lat, lng }
- props.farms: [{ id, coordinates: [[lng,lat], ...], crop, status, farmerName, state, lga }]
- props.loading: boolean
- props.onReload: fn
Notes:
- We expect farm.coordinates as [lng,lat]; convert to {lat,lng}
- Fit bounds to all polygons
*/

const containerStyle = { width: '100%', height: '100%' };

function colorForFarm(farm) {
  if (farm.status === 'verified') return '#10B981';
  if (farm.status === 'pending') return '#F59E0B';
  if (farm.crop) {
    switch ((farm.crop || '').toLowerCase()) {
      case 'rice': return '#3B82F6';
      case 'maize': return '#EF4444';
      case 'cassava': return '#EC4899';
      case 'wheat': return '#8B5CF6';
      case 'beans': return '#F97316';
      case 'yam': return '#14B8A6';
    }
  }
  return '#6B7280';
}

export default function GoogleMapPolygons({ center, farms, loading, onReload, onBack }) {
  const mapRef = useRef(null);

  const polygons = useMemo(() => {
    return (farms || [])
      .map(farm => {
        let coordinates = [];
        
        // Use coordinatesLatLng if available (already in [lat,lng] format)
        if (Array.isArray(farm.coordinatesLatLng) && farm.coordinatesLatLng.length >= 3) {
          coordinates = farm.coordinatesLatLng;
        }
        // Otherwise use coordinates and convert from [lng,lat] to [lat,lng]
        else if (Array.isArray(farm.coordinates) && farm.coordinates.length >= 3) {
          coordinates = farm.coordinates.map(([lng, lat]) => [lat, lng]);
        }

        if (!Array.isArray(coordinates) || coordinates.length < 3) return { farm, path: [] };

        const path = coordinates
          .filter(c => Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null)
          .map(([lat, lng]) => ({
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }))
          .filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lng) && 
                      p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180);
        
        // Log successful polygon creation for debugging
        if (path.length >= 3) {
          console.log(`✅ Farm ${farm.id} (${farm.farmerName}) polygon created with ${path.length} points:`, 
                     `First point: ${path[0].lat.toFixed(6)}, ${path[0].lng.toFixed(6)}`);
        }
        
        return { farm, path };
      })
      .filter(({ path }) => path.length >= 3);
  }, [farms]);

  // Fit bounds when polygons change
  useEffect(() => {
    if (!mapRef.current || polygons.length === 0) return;
    const map = mapRef.current;
    const bounds = new window.google.maps.LatLngBounds();
    polygons.forEach(({ path }) => path.forEach(pt => bounds.extend(pt)));
    map.fitBounds(bounds, 32);
  }, [polygons]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <LoadScript googleMapsApiKey={apiKey} loadingElement={<div style={{width:'100%',height:'100%'}} /> }>
      <GoogleMap
        onLoad={(map) => { mapRef.current = map; }}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={6}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        }}
      >
        {polygons.map(({ farm, path }) => (
          <Polygon
            key={farm.id}
            paths={path}
            options={{
              strokeColor: colorForFarm(farm),
              strokeWeight: 2,
              fillColor: colorForFarm(farm),
              fillOpacity: 0.35,
            }}
          />
        ))}
      </GoogleMap>

      {/* Top-right minimal controls */}
      <div style={{ position:'absolute', top:12, right:12, zIndex:1, display:'flex', gap:8 }}>
        {onBack && (
          <button 
            onClick={onBack} 
            style={{ 
              background:'#fff', 
              border:'1px solid #e5e7eb', 
              padding:'6px 10px', 
              borderRadius:8, 
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
              display:'flex',
              alignItems:'center',
              gap:'4px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        )}
        <button onClick={onReload} style={{ background:'#fff', border:'1px solid #e5e7eb', padding:'6px 10px', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          Reload
        </button>
      </div>
    </LoadScript>
  );
}
