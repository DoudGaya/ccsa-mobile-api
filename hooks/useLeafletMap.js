import { useEffect, useRef } from 'react';

// Custom hook to handle Leaflet map lifecycle properly
export function useLeafletMap() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Cleanup function to properly destroy map instances
  const cleanup = () => {
    if (mapRef.current) {
      try {
        mapRef.current.remove();
        mapRef.current = null;
      } catch (error) {
        console.warn('Error cleaning up map:', error);
      }
    }
  };

  // Effect to handle cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return {
    mapRef,
    containerRef,
    cleanup
  };
}

// Helper to safely execute map operations
export function safeMapOperation(mapRef, operation) {
  if (mapRef.current && mapRef.current._map) {
    try {
      return operation(mapRef.current);
    } catch (error) {
      console.warn('Map operation failed:', error);
      return null;
    }
  }
  return null;
}