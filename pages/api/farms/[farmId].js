import { authMiddleware } from '../../../lib/authMiddleware';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { auth } from '../../../lib/firebase-admin';
import ProductionLogger from '../../../lib/productionLogger';

// Helper function for Firebase authentication that doesn't send responses
async function validateFirebaseAuth(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return { success: false, error: 'No authorization header' };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...decodedToken
    };

    return { success: true };
  } catch (error) {
    ProductionLogger.error('Firebase auth validation error:', error.message);
    return { success: false, error: 'Invalid or expired token' };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if this is a web admin request (NextAuth session) or mobile agent request (Firebase token)  
    const session = await getServerSession(req, res);
    
    ProductionLogger.debug('Farm API - Session check', { 
      hasSession: !!session, 
      sessionUser: session?.user, 
      method: req.method,
      url: req.url 
    });
    
    if (session) {
      // Web admin user - has access to all farms
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role 
      };
      ProductionLogger.debug('Farm API - Using NextAuth session', { email: session.user.email });
    } else {
      // Mobile agent request - check for Firebase authentication
      ProductionLogger.debug('Farm API - No session, checking Firebase auth');
      const authResult = await validateFirebaseAuth(req);
      if (!authResult.success) {
        ProductionLogger.warn('Farm API - Firebase auth failed', { error: authResult.error });
        return res.status(401).json({ error: authResult.error });
      }
      req.isAdmin = false;
      ProductionLogger.debug('Farm API - Using Firebase auth', { uid: req.user.uid });
    }
    
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
      
      console.log('Updating farm - received data:', JSON.stringify(updateData, null, 2));
      
      // Remove farmerId from update data to prevent changing farm ownership
      delete updateData.farmerId;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      // Convert string values to appropriate types for numeric fields
      if (updateData.farmSize !== undefined) {
        updateData.farmSize = updateData.farmSize ? parseFloat(updateData.farmSize) : null;
        if (updateData.farmSize !== null && isNaN(updateData.farmSize)) {
          return res.status(400).json({ error: 'Invalid farm size value' });
        }
      }
      
      if (updateData.farmLatitude !== undefined) {
        updateData.farmLatitude = updateData.farmLatitude ? parseFloat(updateData.farmLatitude) : null;
        if (updateData.farmLatitude !== null && isNaN(updateData.farmLatitude)) {
          return res.status(400).json({ error: 'Invalid farm latitude value' });
        }
      }
      
      if (updateData.farmLongitude !== undefined) {
        updateData.farmLongitude = updateData.farmLongitude ? parseFloat(updateData.farmLongitude) : null;
        if (updateData.farmLongitude !== null && isNaN(updateData.farmLongitude)) {
          return res.status(400).json({ error: 'Invalid farm longitude value' });
        }
      }
      
      if (updateData.farmElevation !== undefined) {
        updateData.farmElevation = updateData.farmElevation ? parseFloat(updateData.farmElevation) : null;
      }
      
      if (updateData.soilPH !== undefined) {
        updateData.soilPH = updateData.soilPH ? parseFloat(updateData.soilPH) : null;
      }
      
      if (updateData.farmArea !== undefined) {
        updateData.farmArea = updateData.farmArea ? parseFloat(updateData.farmArea) : null;
      }
      
      if (updateData.quantity !== undefined) {
        updateData.quantity = updateData.quantity ? parseFloat(updateData.quantity) : null;
      }
      
      if (updateData.farmingExperience !== undefined) {
        updateData.farmingExperience = updateData.farmingExperience ? parseInt(updateData.farmingExperience) : null;
      }
      
      if (updateData.year !== undefined) {
        updateData.year = updateData.year ? parseInt(updateData.year) : null;
      }
      
      if (updateData.crop !== undefined) {
        updateData.crop = updateData.crop ? parseFloat(updateData.crop) : null;
        if (updateData.crop !== null && isNaN(updateData.crop)) {
          return res.status(400).json({ error: 'Invalid crop value' });
        }
      }

      console.log('Converted update data:', JSON.stringify(updateData, null, 2));

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
