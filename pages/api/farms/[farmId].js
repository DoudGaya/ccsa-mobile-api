import { authMiddleware } from '../../../lib/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

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
      const updateData = req.body;
      
      // Remove farmerId from update data to prevent changing farm ownership
      delete updateData.farmerId;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

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
