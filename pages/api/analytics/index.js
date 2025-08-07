import { authMiddleware } from '../../../lib/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if this is a web admin request (NextAuth session) or mobile agent request (Firebase token)
    const session = await getSession({ req });
    
    if (session) {
      // Web admin user - has access to all analytics
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

    let whereClause = {};
    if (!req.isAdmin) {
      // If not admin, filter by agent
      whereClause = { agentId: req.user.uid };
    }

    // Get total farmers count
    const totalFarmers = await prisma.farmer.count({
      where: whereClause
    });

    // Get total farms count
    const totalFarms = await prisma.farm.count({
      where: req.isAdmin ? {} : {
        farmer: whereClause
      }
    });

    // Get farmers registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const farmersThisMonth = await prisma.farmer.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Get farmers registered this week
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const farmersThisWeek = await prisma.farmer.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfWeek
        }
      }
    });

    // Get farmers registered today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const farmersToday = await prisma.farmer.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfDay
        }
      }
    });

    // Get top crops
    const topCrops = await prisma.farm.groupBy({
      by: ['primaryCrop'],
      where: req.isAdmin ? {
        primaryCrop: {
          not: null
        }
      } : {
        farmer: whereClause,
        primaryCrop: {
          not: null
        }
      },
      _count: {
        primaryCrop: true
      },
      orderBy: {
        _count: {
          primaryCrop: 'desc'
        }
      },
      take: 5
    });

    const formattedTopCrops = topCrops.map(crop => ({
      crop: crop.primaryCrop,
      count: crop._count.primaryCrop
    }));

    const stats = {
      totalFarmers,
      totalFarms,
      farmersThisMonth,
      farmersThisWeek,
      farmersToday,
      topCrops: formattedTopCrops
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function apiHandler(req, res) {
  try {
    // Check if this is a web admin request (NextAuth session) or mobile agent request (Firebase token)
    const session = await getSession({ req });
    
    if (session) {
      // Web admin user - has access to all analytics
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

    return await handler(req, res);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
