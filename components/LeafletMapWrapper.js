import { useEffect, useRef, useState } from 'react';

// This component handles Leaflet map creation and avoids initialization conflicts
export default function LeafletMapWrapper({ farmData, loading, selectedFarm, onFarmSelect, onRefresh }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map only once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet only on client side
    let mounted = true;
    
    const initializeMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix for default markers
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mounted || !mapRef.current) return;

        // Clear any existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Create new map instance
        const map = L.default.map(mapRef.current, {
          center: [9.0765, 8.6753], // Nigeria center
          zoom: 6,
          zoomControl: true,
        });

        // Add tile layer
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
        
        if (mounted) {
          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update farm polygons when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !farmData.length) return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Add farm polygons
    const bounds = [];
    
    farmData.forEach((farm) => {
      if (!farm.coordinates || farm.coordinates.length < 3) return;

      try {
        // Validate and convert coordinates for Leaflet (swap lat/lng if needed)
        const positions = farm.coordinates
          .filter(coord => Array.isArray(coord) && coord.length >= 2 && coord[0] != null && coord[1] != null)
          .map(coord => {
            const [first, second] = coord;
            // Ensure we have valid numbers
            const num1 = parseFloat(first);
            const num2 = parseFloat(second);
            
            if (isNaN(num1) || isNaN(num2)) {
              console.warn(`Invalid coordinate pair in farm ${farm.id}:`, coord);
              return null;
            }
            
            // Return as [lat, lng] for Leaflet
            return [num2, num1]; // Assuming input is [lng, lat], we swap to [lat, lng]
          })
          .filter(pos => pos !== null);

        // Skip if we don't have enough valid coordinates
        if (positions.length < 3) {
          console.warn(`Farm ${farm.id} has insufficient valid coordinates:`, positions.length);
          return;
        }
      
      // Determine polygon color
      let color = '#6B7280'; // Default gray
      if (farm.status === 'verified') color = '#10B981'; // Green
      else if (farm.status === 'pending') color = '#F59E0B'; // Yellow
      else if (farm.crop) {
        switch (farm.crop.toLowerCase()) {
          case 'rice': color = '#3B82F6'; break; // Blue
          case 'maize': color = '#EF4444'; break; // Red
          case 'wheat': color = '#8B5CF6'; break; // Purple
          case 'beans': color = '#F97316'; break; // Orange
          case 'cassava': color = '#EC4899'; break; // Pink
          case 'yam': color = '#14B8A6'; break; // Teal
        }
      }

      // Create polygon
      const polygon = L.polygon(positions, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.3,
        dashArray: farm.status === 'pending' ? '5, 5' : null,
      }).addTo(map);

      // Add popup
      const formatArea = (area) => {
        if (!area) return 'N/A';
        if (area < 10000) return `${(area / 10000).toFixed(3)} hectares`;
        return `${(area / 10000).toFixed(2)} hectares`;
      };

      polygon.bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">
            ${farm.farmerName}'s Farm
          </h3>
          <div style="font-size: 14px; line-height: 1.4;">
            <p style="margin: 4px 0;"><strong>Farmer:</strong> ${farm.farmerName || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Crop:</strong> ${farm.crop || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Area:</strong> ${formatArea(farm.area)}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> 
              <span style="padding: 2px 6px; border-radius: 12px; font-size: 12px; ${
                farm.status === 'verified' ? 'background-color: #D1FAE5; color: #065F46;' :
                farm.status === 'pending' ? 'background-color: #FEF3C7; color: #92400E;' :
                'background-color: #F3F4F6; color: #374151;'
              }">
                ${farm.status || 'Unknown'}
              </span>
            </p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${farm.state}, ${farm.lga}</p>
            <p style="margin: 4px 0;"><strong>Coordinates:</strong> ${farm.coordinates.length} points</p>
          </div>
        </div>
      `);

      // Add click event
      polygon.on('click', () => {
        onFarmSelect && onFarmSelect(farm);
      });

      // Add hover effects
      polygon.on('mouseover', function() {
        this.setStyle({ weight: 4, fillOpacity: 0.6 });
      });

      polygon.on('mouseout', function() {
        this.setStyle({ weight: 2, fillOpacity: 0.3 });
      });

      // Collect bounds
      positions.forEach(pos => bounds.push(pos));
      
      } catch (error) {
        console.error(`Error creating polygon for farm ${farm.id}:`, error);
      }
    });

    // Fit map to show all farms
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch (error) {
        console.warn('Could not fit bounds:', error);
      }
    }

  }, [farmData, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading farm data...</p>
          </div>
        </div>
      )}
      
      {!loading && !mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}
      
      {!loading && farmData.length === 0 && mapLoaded && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Farm Data</h3>
            <p className="text-gray-600">No farms with coordinate data found.</p>
          </div>
        </div>
      )}

      {/* Map controls */}
      {mapLoaded && farmData.length > 0 && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <button
            onClick={onRefresh}
            className="bg-white p-2 rounded shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Refresh farm data"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}