import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get system statistics
    const [
      totalUsers,
      totalAdmins,
      totalAgents,
      totalFarmers,
      totalFarms,
      totalCertificates,
      recentUsers,
      recentFarms,
      recentCertificates
    ] = await Promise.all([
      // Count total users
      prisma.user.count(),
      
      // Count admins
      prisma.user.count({
        where: { 
          OR: [
            { role: 'admin' },
            { role: 'super_admin' }
          ]
        }
      }),
      
      // Count agents
      prisma.user.count({
        where: { role: 'agent' }
      }),
      
      // Count farmers
      prisma.farmer.count(),
      
      // Count farms
      prisma.farm.count(),
      
      // Count certificates
      prisma.certificate.count(),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent farms (last 7 days)
      prisma.farm.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent certificates (last 7 days)
      prisma.certificate.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get database status
    const dbStatus = await checkDatabaseStatus();

    const stats = {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        agents: totalAgents,
        recent: recentUsers
      },
      farmers: {
        total: totalFarmers
      },
      farms: {
        total: totalFarms,
        recent: recentFarms
      },
      certificates: {
        total: totalCertificates,
        recent: recentCertificates
      },
      system: {
        database: dbStatus,
        uptime: process.uptime(),
        version: process.version,
        memory: process.memoryUsage()
      }
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch system statistics',
      stats: {
        users: { total: 0, admins: 0, agents: 0, recent: 0 },
        farmers: { total: 0 },
        farms: { total: 0, recent: 0 },
        certificates: { total: 0, recent: 0 },
        system: {
          database: 'error',
          uptime: 0,
          version: process.version,
          memory: process.memoryUsage()
        }
      }
    });
  }
}

async function checkDatabaseStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    console.error('Database connection error:', error);
    return 'error';
  }
}
