// Utility functions for geospatial calculations

/**
 * Calculate the area of a polygon using the Shoelace formula (for projected coordinates)
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @returns {number} Area in square meters
 */
export function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }

  // Convert lat/lng to projected coordinates (approximate for small areas)
  const projectedCoords = coordinates.map(coord => {
    const [lng, lat] = coord;
    // Simple equirectangular projection (good for small areas)
    const x = lng * 111320 * Math.cos(lat * Math.PI / 180); // meters
    const y = lat * 110540; // meters
    return [x, y];
  });

  // Shoelace formula
  let area = 0;
  const n = projectedCoords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += projectedCoords[i][0] * projectedCoords[j][1];
    area -= projectedCoords[j][0] * projectedCoords[i][1];
  }

  return Math.abs(area) / 2; // Square meters
}

/**
 * Calculate area using Haversine formula for more accurate results
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @returns {number} Area in square meters
 */
export function calculatePolygonAreaHaversine(coordinates) {
  if (!coordinates || coordinates.length < 3) {
    return 0;
  }

  const earthRadius = 6371000; // Earth's radius in meters
  
  // Close the polygon if not already closed
  const closedCoords = [...coordinates];
  if (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
      closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1]) {
    closedCoords.push(closedCoords[0]);
  }

  let area = 0;
  const n = closedCoords.length - 1;

  for (let i = 0; i < n; i++) {
    const [lng1, lat1] = closedCoords[i];
    const [lng2, lat2] = closedCoords[i + 1];
    
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLng = (lng2 - lng1) * Math.PI / 180;
    
    area += deltaLng * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  area = Math.abs(area * earthRadius * earthRadius / 2);
  return area; // Square meters
}

/**
 * Convert square meters to hectares
 * @param {number} squareMeters 
 * @returns {number} Area in hectares
 */
export function metersToHectares(squareMeters) {
  return squareMeters / 10000;
}

/**
 * Convert square meters to acres
 * @param {number} squareMeters 
 * @returns {number} Area in acres
 */
export function metersToAcres(squareMeters) {
  return squareMeters / 4047;
}

/**
 * Calculate farm area from GeoJSON polygon and return in multiple units
 * @param {Object} geoJsonPolygon - GeoJSON polygon object
 * @returns {Object} Area in different units
 */
export function calculateFarmArea(geoJsonPolygon) {
  try {
    if (!geoJsonPolygon || geoJsonPolygon.type !== 'Polygon') {
      return { squareMeters: 0, hectares: 0, acres: 0 };
    }

    // Get the exterior ring (first array in coordinates)
    const coordinates = geoJsonPolygon.coordinates[0];
    
    // Calculate area using the more accurate Haversine method
    const areaSquareMeters = calculatePolygonAreaHaversine(coordinates);
    
    return {
      squareMeters: Math.round(areaSquareMeters),
      hectares: Math.round(metersToHectares(areaSquareMeters) * 100) / 100, // 2 decimal places
      acres: Math.round(metersToAcres(areaSquareMeters) * 100) / 100 // 2 decimal places
    };
  } catch (error) {
    console.error('Error calculating farm area:', error);
    return { squareMeters: 0, hectares: 0, acres: 0 };
  }
}

/**
 * Validate GeoJSON polygon coordinates
 * @param {Object} geoJsonPolygon 
 * @returns {boolean}
 */
export function validateGeoJsonPolygon(geoJsonPolygon) {
  if (!geoJsonPolygon || typeof geoJsonPolygon !== 'object') {
    return false;
  }

  if (geoJsonPolygon.type !== 'Polygon') {
    return false;
  }

  if (!Array.isArray(geoJsonPolygon.coordinates) || geoJsonPolygon.coordinates.length === 0) {
    return false;
  }

  const exteriorRing = geoJsonPolygon.coordinates[0];
  if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
    return false;
  }

  // Check if polygon is closed (first and last coordinates should be the same)
  const first = exteriorRing[0];
  const last = exteriorRing[exteriorRing.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return false;
  }

  // Validate coordinate format
  for (const coord of exteriorRing) {
    if (!Array.isArray(coord) || coord.length < 2) {
      return false;
    }
    
    const [lng, lat] = coord;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return false;
    }
    
    // Basic coordinate range validation
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate centroid of a polygon
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @returns {Array} [longitude, latitude] of centroid
 */
export function calculatePolygonCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }

  let lngSum = 0;
  let latSum = 0;
  const count = coordinates.length;

  for (const [lng, lat] of coordinates) {
    lngSum += lng;
    latSum += lat;
  }

  return [lngSum / count, latSum / count];
}

export default {
  calculatePolygonArea,
  calculatePolygonAreaHaversine,
  calculateFarmArea,
  validateGeoJsonPolygon,
  calculatePolygonCentroid,
  metersToHectares,
  metersToAcres
};
