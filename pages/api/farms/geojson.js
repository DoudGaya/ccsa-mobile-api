import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    console.log('🗺️ Loading farm GeoJSON data...');

    // Fetch farms with their coordinates and farmer information
    const farms = await prisma.farm.findMany({
      include: {
        farmer: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            state: true,
            lga: true,
            ward: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${farms.length} farms`);

    // Helpers
    const toNumberPair = (p) => Array.isArray(p) && p.length >= 2 ? [Number(p[0]), Number(p[1])] : null;
    const clampPairs = (arr) => (Array.isArray(arr) ? arr.map(toNumberPair).filter(Boolean) : []);
    const ensureClosed = (arr) => {
      if (!arr.length) return arr;
      const first = arr[0];
      const last = arr[arr.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) return arr;
      return [...arr, first];
    };

    const nigeriaBBox = { latMin: 3, latMax: 15, lngMin: 2, lngMax: 15.5 };
    const inNigeria = ([lng, lat]) => lat >= nigeriaBBox.latMin && lat <= nigeriaBBox.latMax && lng >= nigeriaBBox.lngMin && lng <= nigeriaBBox.lngMax;

    // Transform farms into consistent structure
    const transformedFarms = farms.map(farm => {
      let raw = [];

      // Parse coordinates from various shapes
      if (farm.farmCoordinates || farm.farmPolygon) {
        try {
          const coordinateData = farm.farmCoordinates || farm.farmPolygon;
          let parsed = coordinateData;
          if (typeof coordinateData === 'string') {
            parsed = JSON.parse(coordinateData);
          }

          if (Array.isArray(parsed)) {
            // Either [[a,b], ...] or [[[a,b],...]]
            if (Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])) {
              // Take first ring if multi-ring
              raw = parsed[0];
            } else {
              raw = parsed;
            }
          } else if (parsed && typeof parsed === 'object') {
            const coords = parsed.coordinates || parsed.geometry?.coordinates;
            if (Array.isArray(coords)) {
              // GeoJSON Polygon -> [ [ [lng,lat], ... ] ]
              raw = Array.isArray(coords[0]) && Array.isArray(coords[0][0]) ? coords[0] : coords;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse coordinates for farm ${farm.id}:`, error);
          raw = [];
        }
      }

      // If still empty, build small square around point
      if (raw.length === 0 && farm.farmLatitude && farm.farmLongitude) {
        const lat = Number(farm.farmLatitude);
        const lng = Number(farm.farmLongitude);
        const offset = 0.001;
        raw = [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset],
        ];
      }

      // Normalize numeric pairs and ensure closed ring
      let coordsLngLat = ensureClosed(clampPairs(raw)); // we treat this as [lng,lat]

      // If many points appear as [lat,lng] (i.e., swapping makes them fall into Nigeria), swap
      const hitsAsLngLat = coordsLngLat.filter(inNigeria).length;
      const swapped = ensureClosed(coordsLngLat.map(([lng, lat]) => [lat, lng]));
      const hitsAsSwapped = swapped.filter(inNigeria).length;
      if (hitsAsSwapped > hitsAsLngLat) {
        coordsLngLat = swapped; // original data was [lat,lng], convert to [lng,lat]
      }

      const coordsLatLng = coordsLngLat.map(([lng, lat]) => [lat, lng]);

      return {
        id: farm.id,
        name: `${farm.farmer?.firstName || 'Unknown'}'s Farm`,
        farmerName: farm.farmer ? 
          `${farm.farmer.firstName} ${farm.farmer.middleName || ''} ${farm.farmer.lastName}`.trim() : 
          'Unknown',
        farmerId: farm.farmerId,
        crop: farm.primaryCrop,
        area: farm.farmSize || farm.farmArea,
        coordinates: coordsLngLat, // always [lng,lat]
        coordinatesLatLng: coordsLatLng, // convenience for renderers
        status: farm.farmer?.status?.toLowerCase() === 'verified' ? 'verified' : 'pending',
        state: farm.farmState || farm.farmer?.state || '',
        lga: farm.farmLocalGovernment || farm.farmer?.lga || '',
        ward: farm.farmWard || farm.farmer?.ward || '',
        createdAt: farm.createdAt,
        updatedAt: farm.updatedAt,
        // Additional farm details
        secondaryCrop: farm.secondaryCrop,
        soilType: farm.soilType,
        farmingExperience: farm.farmingExperience,
        farmOwnership: farm.farmOwnership,
        farmingSeason: farm.farmingSeason,
        // Additional metadata for map display
        coordinatesCount: coordsLngLat.length,
        hasValidCoordinates: coordsLngLat.length >= 3, // Minimum for a polygon
      };
    });

    // Filter farms with valid coordinates for map display
    const validFarms = transformedFarms.filter(farm => farm.hasValidCoordinates);
    const invalidFarms = transformedFarms.filter(farm => !farm.hasValidCoordinates);

    console.log(`✅ ${validFarms.length} farms with valid coordinates`);
    console.log(`⚠️ ${invalidFarms.length} farms with invalid/missing coordinates`);

    // Calculate total statistics
    const totalArea = validFarms.reduce((sum, farm) => sum + (farm.area || 0), 0);
    const verifiedFarms = validFarms.filter(farm => farm.status === 'verified').length;
    const pendingFarms = validFarms.filter(farm => farm.status === 'pending').length;

    // Group by crop types
    const cropStats = validFarms.reduce((acc, farm) => {
      const crop = farm.crop || 'Unknown';
      acc[crop] = (acc[crop] || 0) + 1;
      return acc;
    }, {});

    // Create GeoJSON FeatureCollection format (optional, for standard GIS tools)
    const geoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: validFarms.map(farm => ({
        type: 'Feature',
        properties: {
          id: farm.id,
          name: farm.name,
          farmerName: farm.farmerName,
          farmerId: farm.farmerId,
          crop: farm.crop,
          area: farm.area,
          status: farm.status,
          state: farm.state,
          lga: farm.lga,
          ward: farm.ward,
          createdAt: farm.createdAt,
          updatedAt: farm.updatedAt,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [farm.coordinates] // [lng,lat]
        }
      }))
    };

    const response = {
      success: true,
      farms: validFarms, // For our custom map component
      geoJson: geoJsonFeatureCollection, // Standard GeoJSON format
      statistics: {
        total: validFarms.length,
        verified: verifiedFarms,
        pending: pendingFarms,
        totalArea: totalArea,
        cropStats: cropStats,
        invalidCoordinates: invalidFarms.length
      },
      metadata: {
        timestamp: new Date().toISOString(),
        totalFarmsInDb: farms.length,
        farmsWithValidCoordinates: validFarms.length,
        farmsWithInvalidCoordinates: invalidFarms.length
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error loading farm GeoJSON data:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to load farm data',
      error: error.message
    });
  }
}