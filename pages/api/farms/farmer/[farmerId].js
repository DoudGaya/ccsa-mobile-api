import { authMiddleware } from '../../../../lib/authMiddleware';
import { PrismaClient } from '@prisma/client';

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
    // Apply authentication middleware
    await authMiddleware(req, res);
    
    const { farmerId } = req.query;

    if (!farmerId) {
      return res.status(400).json({ error: 'Farmer ID is required' });
    }

    if (req.method === 'GET') {
      // Get all farms for a specific farmer
      const farms = await prisma.farm.findMany({
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
      
      return res.status(200).json({ farms });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Farmer farms API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
