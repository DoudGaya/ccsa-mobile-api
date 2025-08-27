/**
 * Farm Size Calculation Utilities for Dashboard
 * Calculates farm sizes when not available in the database
 */

/**
 * Calculate polygon area using the Shoelace formula
 * @param {Array} coordinates - Array of coordinate objects with latitude/longitude
 * @returns {number} Area in square meters
 */
export function calculatePolygonArea(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
    return 0;
  }

  // Convert coordinates to proper format
  const points = coordinates.map(coord => {
    // Handle different coordinate formats
    if (coord.latitude !== undefined && coord.longitude !== undefined) {
      return { lat: parseFloat(coord.latitude), lng: parseFloat(coord.longitude) };
    } else if (coord.lat !== undefined && coord.lng !== undefined) {
      return { lat: parseFloat(coord.lat), lng: parseFloat(coord.lng) };
    } else if (Array.isArray(coord) && coord.length >= 2) {
      return { lat: parseFloat(coord[1]), lng: parseFloat(coord[0]) }; // GeoJSON format [lng, lat]
    }
    return null;
  }).filter(point => point !== null);

  if (points.length < 3) {
    return 0;
  }

  // Close the polygon if not already closed
  if (points[0].lat !== points[points.length - 1].lat || 
      points[0].lng !== points[points.length - 1].lng) {
    points.push({ ...points[0] });
  }

  // Calculate area using Shoelace formula
  let area = 0;
  const n = points.length - 1; // Exclude the closing point

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    
    // Convert to radians
    const lat1 = points[i].lat * Math.PI / 180;
    const lng1 = points[i].lng * Math.PI / 180;
    const lat2 = points[j].lat * Math.PI / 180;
    const lng2 = points[j].lng * Math.PI / 180;
    
    // Use spherical excess formula for more accurate area calculation
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area) * 6378137 * 6378137 / 2; // Earth radius squared / 2
  
  return area; // Returns area in square meters
}

/**
 * Convert square meters to hectares
 * @param {number} squareMeters 
 * @returns {number} Area in hectares
 */
export function squareMetersToHectares(squareMeters) {
  return squareMeters / 10000;
}

/**
 * Calculate farm size from polygon and return in hectares
 * @param {Array} farmPolygon - Array of coordinate objects
 * @returns {number} Farm size in hectares (rounded to 2 decimal places)
 */
export function calculateFarmSizeFromPolygon(farmPolygon) {
  if (!farmPolygon || !Array.isArray(farmPolygon)) {
    return 0;
  }

  const areaInSquareMeters = calculatePolygonArea(farmPolygon);
  const areaInHectares = squareMetersToHectares(areaInSquareMeters);
  
  return Math.round(areaInHectares * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate and update farm size if missing
 * @param {Object} farm - Farm object with potential farmPolygon
 * @returns {Object} Farm object with calculated farmSize if applicable
 */
export function calculateMissingFarmSize(farm) {
  // If farm size is already available, return as-is
  if (farm.farmSize && farm.farmSize > 0) {
    return farm;
  }

  // If we have polygon data, calculate the size
  if (farm.farmPolygon && Array.isArray(farm.farmPolygon)) {
    const calculatedSize = calculateFarmSizeFromPolygon(farm.farmPolygon);
    
    if (calculatedSize > 0) {
      return {
        ...farm,
        farmSize: calculatedSize,
        calculatedSize: true // Flag to indicate this was calculated
      };
    }
  }

  // Return original farm if no calculation possible
  return farm;
}

/**
 * Update farmer status based on their farm count
 * @param {Object} farmer - Farmer object
 * @param {number} farmCount - Number of farms associated with farmer
 * @returns {string} Updated status
 */
export function calculateFarmerStatus(farmer, farmCount) {
  // If status is already validated or verified, don't change it
  if (farmer.status === 'Validated' || farmer.status === 'Verified') {
    return farmer.status;
  }

  // If farmer has farms, status should be FarmCaptured
  if (farmCount > 0) {
    return 'FarmCaptured';
  }

  // Default status for new farmers
  return 'Enrolled';
}

/**
 * Calculate total hectares from an array of farms
 * @param {Array} farms - Array of farm objects
 * @returns {number} Total hectares
 */
export function calculateTotalHectares(farms) {
  if (!farms || !Array.isArray(farms)) {
    return 0;
  }

  const total = farms.reduce((sum, farm) => {
    const farmWithSize = calculateMissingFarmSize(farm);
    return sum + (farmWithSize.farmSize || 0);
  }, 0);

  return Math.round(total * 100) / 100; // Round to 2 decimal places
}
