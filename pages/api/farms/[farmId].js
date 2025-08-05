import { authMiddleware } from '../../../lib/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { calculateFarmArea, validateGeoJsonPolygon } from '../../../lib/geoUtils';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Auth check temporarily disabled for development/production debugging
    console.log('Farm by ID API - proceeding without auth check');
    req.isAdmin = true; // Allow access for now
    req.user = { 
      uid: 'temp-user', 
      email: 'temp@example.com',
      role: 'admin' 
    };
    
    const { farmId } = req.query;

    if (!farmId) {
      return res.status(400).json({ error: 'Farm ID is required' });
    }

    if (req.method === 'GET') {
      // Get a specific farm
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: {
          farmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nin: true,
            }
          }
        }
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }
      
      return res.status(200).json({ farm });
    }

    if (req.method === 'PUT') {
      // Update a farm
      const updateData = { ...req.body };
      
      // Remove farmerId from update data to prevent changing farm ownership
      delete updateData.farmerId;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      // Calculate farm area from polygon if provided
      if (updateData.farmPolygon && typeof updateData.farmPolygon === 'object') {
        // Validate the polygon
        if (validateGeoJsonPolygon(updateData.farmPolygon)) {
          const areaCalculation = calculateFarmArea(updateData.farmPolygon);
          updateData.farmSize = areaCalculation.hectares; // Set farm size in hectares
          updateData.farmArea = areaCalculation.squareMeters; // Store area in square meters
          
          console.log('🧮 Updated farm area:', {
            hectares: areaCalculation.hectares,
            squareMeters: areaCalculation.squareMeters,
            acres: areaCalculation.acres
          });
        } else {
          console.warn('⚠️ Invalid GeoJSON polygon provided in update');
        }
      }

      // Convert numeric fields
      if (updateData.farmSize) updateData.farmSize = parseFloat(updateData.farmSize);
      if (updateData.farmingExperience) updateData.farmingExperience = parseInt(updateData.farmingExperience);
      if (updateData.farmLatitude) updateData.farmLatitude = parseFloat(updateData.farmLatitude);
      if (updateData.farmLongitude) updateData.farmLongitude = parseFloat(updateData.farmLongitude);
      if (updateData.soilPH) updateData.soilPH = parseFloat(updateData.soilPH);
      if (updateData.farmArea) updateData.farmArea = parseFloat(updateData.farmArea);
      if (updateData.farmElevation) updateData.farmElevation = parseFloat(updateData.farmElevation);
      if (updateData.year) updateData.year = parseFloat(updateData.year);
      if (updateData.crop) updateData.crop = parseFloat(updateData.crop);
      if (updateData.quantity) updateData.quantity = parseFloat(updateData.quantity);

      const farm = await prisma.farm.update({
        where: { id: farmId },
        data: updateData,
        include: {
          farmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nin: true,
            }
          }
        }
      });

      return res.status(200).json({ farm });
    }

    if (req.method === 'DELETE') {
      // Delete a farm
      await prisma.farm.delete({
        where: { id: farmId }
      });

      return res.status(200).json({ message: 'Farm deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Farm API error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A farm with this information already exists' });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Farm not found' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
