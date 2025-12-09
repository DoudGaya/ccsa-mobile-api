import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/authMiddleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import ProductionLogger from '../../../lib/productionLogger';
import { hasPermission } from '../../../lib/permissions';

/**
 * Optimized endpoint to get farmer statistics without fetching all records
 * Useful for dashboards and quick counts
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (session) {
      // Web admin user
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role,
        permissions: session.user.permissions || []
      };
      
      // Check farmers.read permission
      if (!hasPermission(req.user.permissions, 'farmers.read')) {
        return res.status(403).json({ error: 'Insufficient permissions to view farmer statistics' });
      }
    } else {
      // Mobile agent request
      await authMiddleware(req, res);
      
      if (res.headersSent) {
        return;
      }
      
      req.isAdmin = false;
    }

    const { state = '', cluster = '', status } = req.query;

    // Build base where clause
    const whereClause = {
      ...(req.isAdmin ? {} : { agentId: req.user?.uid }),
      ...(status && { status }),
      ...(state && { state }),
      ...(cluster && { clusterId: cluster }),
    };

    // Execute all count queries in parallel for better performance
    const [
      totalCount,
      statusCounts,
      stateCounts,
      recentCount,
    ] = await Promise.all([
      // Total farmers
      prisma.farmer.count({ where: whereClause }),
      
      // Count by status
      prisma.farmer.groupBy({
        by: ['status'],
        where: {
          ...(req.isAdmin ? {} : { agentId: req.user?.uid }),
          ...(state && { state }),
          ...(cluster && { clusterId: cluster }),
        },
        _count: true,
      }),
      
      // Count by state
      prisma.farmer.groupBy({
        by: ['state'],
        where: {
          ...(req.isAdmin ? {} : { agentId: req.user?.uid }),
          ...(status && { status }),
          ...(cluster && { clusterId: cluster }),
        },
        _count: true,
        orderBy: {
          _count: {
            state: 'desc'
          }
        },
        take: 10, // Top 10 states
      }),
      
      // Farmers registered in last 7 days
      prisma.farmer.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]);

    const stats = {
      total: totalCount,
      recent7Days: recentCount,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      byState: stateCounts.map(item => ({
        state: item.state || 'Unknown',
        count: item._count
      })),
    };

    ProductionLogger.info('Farmer stats fetched successfully', { 
      total: stats.total, 
      recent: stats.recent7Days 
    });

    return res.status(200).json(stats);
  } catch (error) {
    ProductionLogger.error('Error fetching farmer stats:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to fetch farmer statistics',
        message: error.message
      });
    }
  }
}
