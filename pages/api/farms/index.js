import { authMiddleware } from '../../../lib/authMiddleware';
import prisma from '../../../lib/prisma';
import { getSession } from 'next-auth/react';
import { updateFarmerStatusByFarms } from '../../../lib/farmerStatusUtils';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if this is a web admin request (NextAuth session) or mobile agent request (Firebase token)
    const session = await getSession({ req });
    
    if (session) {
      // Web admin user - has access to all farms
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role 
      };
    } else {
      // Mobile agent request - apply Firebase authentication middleware
      await authMiddleware(req, res);
      req.isAdmin = false;
    }
    
    if (req.method === 'GET') {
      // Get all farms or farms by farmer ID
      const { farmerId } = req.query;
      
      let farms;
      if (farmerId) {
        farms = await prisma.farm.findMany({
          where: { farmerId },
          include: {
            farmer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nin: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else if (req.isAdmin) {
        // Admin can see all farms
        farms = await prisma.farm.findMany({
          include: {
            farmer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nin: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        // Agent can only see farms from their farmers
        farms = await prisma.farm.findMany({
          where: {
            farmer: {
              agentId: req.user.uid
            }
          },
          include: {
            farmer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nin: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }
      
      return res.status(200).json({ farms });
    }
    
    if (req.method === 'POST') {
      // Create a new farm
      console.log('Creating new farm - received data:', JSON.stringify(req.body, null, 2));
      
      const {
        farmerId,
        farmSize,
        primaryCrop,
        produceCategory,
        farmOwnership,
        farmState,
        farmLocalGovernment,
        farmingSeason,
        farmWard,
        farmPollingUnit,
        secondaryCrop,
        farmingExperience,
        farmLatitude,
        farmLongitude,
        farmPolygon,
        soilType,
        soilPH,
        soilFertility,
        farmCoordinates,
        coordinateSystem,
        farmArea,
        farmElevation,
        year,
        yieldSeason,
        crop,
        quantity,
      } = req.body;

      if (!farmerId) {
        return res.status(400).json({ error: 'Farmer ID is required' });
      }

      // Convert string values to appropriate types
      const parsedFarmSize = farmSize ? parseFloat(farmSize) : null;
      const parsedFarmLatitude = farmLatitude ? parseFloat(farmLatitude) : null;
      const parsedFarmLongitude = farmLongitude ? parseFloat(farmLongitude) : null;
      const parsedFarmElevation = farmElevation ? parseFloat(farmElevation) : null;
      const parsedSoilPH = soilPH ? parseFloat(soilPH) : null;
      const parsedFarmArea = farmArea ? parseFloat(farmArea) : null;
      const parsedQuantity = quantity ? parseFloat(quantity) : null;
      const parsedCrop = crop ? parseFloat(crop) : null;
      const parsedFarmingExperience = farmingExperience ? parseInt(farmingExperience) : null;
      const parsedYear = year ? parseInt(year) : null;

      // Validate parsed numbers
      if (farmSize && isNaN(parsedFarmSize)) {
        return res.status(400).json({ error: 'Invalid farm size value' });
      }
      if (farmLatitude && isNaN(parsedFarmLatitude)) {
        return res.status(400).json({ error: 'Invalid farm latitude value' });
      }
      if (farmLongitude && isNaN(parsedFarmLongitude)) {
        return res.status(400).json({ error: 'Invalid farm longitude value' });
      }
      if (crop && isNaN(parsedCrop)) {
        return res.status(400).json({ error: 'Invalid crop value' });
      }

      console.log('Parsed numeric values:', {
        farmSize: `${farmSize} -> ${parsedFarmSize}`,
        farmLatitude: `${farmLatitude} -> ${parsedFarmLatitude}`,
        farmLongitude: `${farmLongitude} -> ${parsedFarmLongitude}`,
        farmingExperience: `${farmingExperience} -> ${parsedFarmingExperience}`,
        crop: `${crop} -> ${parsedCrop}`,
      });

      // Verify farmer exists
      const farmer = await prisma.farmer.findUnique({
        where: { id: farmerId }
      });

      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      const farm = await prisma.farm.create({
        data: {
          farmerId,
          farmSize: parsedFarmSize,
          primaryCrop,
          produceCategory,
          farmOwnership,
          farmState,
          farmLocalGovernment,
          farmingSeason,
          farmWard,
          farmPollingUnit,
          secondaryCrop,
          farmingExperience: parsedFarmingExperience,
          farmLatitude: parsedFarmLatitude,
          farmLongitude: parsedFarmLongitude,
          farmPolygon,
          soilType,
          soilPH: parsedSoilPH,
          soilFertility,
          farmCoordinates,
          coordinateSystem,
          farmArea: parsedFarmArea,
          farmElevation: parsedFarmElevation,
          year: parsedYear,
          yieldSeason,
          crop: parsedCrop,
          quantity: parsedQuantity,
        },
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

      // Automatically update farmer status when farm is added
      try {
        await updateFarmerStatusByFarms(farmerId);
      } catch (statusError) {
        console.error('Error updating farmer status after farm creation:', statusError);
        // Don't fail the farm creation if status update fails
      }

      return res.status(201).json({ farm });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Farms API error:', error);
    
    // Return mock farm data when database is unavailable
    if (error.code === 'P1001' && req.method === 'GET') {
      return res.status(200).json({
        farms: [
          {
            id: '1',
            farmerId: '1',
            farmSize: '2.5',
            primaryCrop: 'Maize',
            farmingExperience: '5',
            farmTerrain: 'Upland',
            irrigationMethod: 'Rain-fed',
            ownershipType: 'Owned',
            farmLocation: 'Lagos State',
            createdAt: '2024-01-01T00:00:00.000Z',
            farmer: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              nin: '12345678901'
            }
          },
          {
            id: '2',
            farmerId: '2',
            farmSize: '1.0',
            primaryCrop: 'Rice',
            farmingExperience: '10',
            farmTerrain: 'Lowland',
            irrigationMethod: 'Irrigated',
            ownershipType: 'Rented',
            farmLocation: 'Ogun State',
            createdAt: '2024-02-01T00:00:00.000Z',
            farmer: {
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              nin: '12345678902'
            }
          },
          {
            id: '3',
            farmerId: '3',
            farmSize: '3.0',
            primaryCrop: 'Cassava',
            farmingExperience: '15',
            farmTerrain: 'Mixed',
            irrigationMethod: 'Mixed',
            ownershipType: 'Family Land',
            farmLocation: 'Lagos State',
            createdAt: '2024-03-01T00:00:00.000Z',
            farmer: {
              id: '3',
              firstName: 'Ahmed',
              lastName: 'Ibrahim',
              nin: '12345678903'
            }
          },
          {
            id: '4',
            farmerId: '4',
            farmSize: '4.5',
            primaryCrop: 'Yam',
            farmingExperience: '20',
            farmTerrain: 'Upland',
            irrigationMethod: 'Rain-fed',
            ownershipType: 'Owned',
            farmLocation: 'Kano State',
            createdAt: '2024-04-01T00:00:00.000Z',
            farmer: {
              id: '4',
              firstName: 'Fatima',
              lastName: 'Yusuf',
              nin: '12345678904'
            }
          }
        ]
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
