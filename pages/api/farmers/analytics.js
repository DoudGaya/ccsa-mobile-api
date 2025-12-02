import prisma, { withRetry } from '../../../lib/prisma';
import ProductionLogger from '../../../lib/productionLogger';
import { withPerformanceMonitoring, withSecurityHeaders } from '../../../lib/middleware';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    ProductionLogger.info('Fetching farmers analytics data');

    // Use retry logic for all database queries
    const analyticsData = await withRetry(async () => {
      // Get total farmers count
      const totalFarmers = await prisma.farmer.count();

      // Get farmers by state
      const farmersByStateRaw = await prisma.farmer.groupBy({
        by: ['state'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      // Process and normalize state data
      const stateMap = new Map();
      
      farmersByStateRaw.forEach(item => {
        if (!item.state || item.state.trim() === '') return;
        
        const normalizedState = item.state.trim().toUpperCase();
        const currentCount = stateMap.get(normalizedState) || 0;
        stateMap.set(normalizedState, currentCount + item._count.id);
      });
      
      // Convert back to array and sort
      const farmersByState = Array.from(stateMap.entries())
        .map(([state, count]) => ({
          state: state.charAt(0) + state.slice(1).toLowerCase(), // Title Case for display
          _count: { id: count }
        }))
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10);

      // Get farmers by LGA for top states
      const farmersByLGA = await prisma.farmer.groupBy({
        by: ['lga', 'state'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // Get farmers by gender
      const farmersByGender = await prisma.farmer.groupBy({
        by: ['gender'],
        _count: {
          id: true
        }
      });

      // Get farmers by status
      const farmersByStatus = await prisma.farmer.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      // Get total farm area from related farms
      const farmStats = await prisma.farm.aggregate({
        _sum: {
          farmSize: true
        },
        _count: {
          id: true
        }
      });

      // Get top crops from farms
      const topCrops = await prisma.farm.groupBy({
        by: ['primaryCrop'],
        _count: {
          id: true
        },
        where: {
          primaryCrop: {
            not: null
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      });

      // Calculate progress metrics
      const verifiedFarmers = await prisma.farmer.count({
        where: { status: 'Verified' }
      });

      const farmersWithFarms = await prisma.farmer.count({
        where: {
          farms: {
            some: {}
          }
        }
      });

      return {
        totalFarmers,
        farmersByState,
        farmersByLGA,
        farmersByGender,
        farmersByStatus,
        farmStats,
        topCrops,
        verifiedFarmers,
        farmersWithFarms
      };
    }, 3, 500);

    const { 
      totalFarmers, 
      farmersByState, 
      farmersByLGA, 
      farmersByGender, 
      farmersByStatus, 
      farmStats, 
      topCrops, 
      verifiedFarmers, 
      farmersWithFarms 
    } = analyticsData;

    // Format the response
    const analytics = {
      overview: {
        totalFarmers,
        totalHectares: Math.round((farmStats._sum.farmSize || 0) * 100) / 100,
        totalFarms: farmStats._count.id || 0,
        averageFarmSize: farmStats._count.id > 0 
          ? Math.round(((farmStats._sum.farmSize || 0) / farmStats._count.id) * 100) / 100 
          : 0,
        verificationRate: totalFarmers > 0 
          ? Math.round((verifiedFarmers / totalFarmers) * 100) 
          : 0,
        farmRegistrationRate: totalFarmers > 0 
          ? Math.round((farmersWithFarms / totalFarmers) * 100) 
          : 0
      },
      topStates: farmersByState.map(item => ({
        state: item.state || 'Unknown',
        count: item._count.id,
        percentage: totalFarmers > 0 ? Math.round((item._count.id / totalFarmers) * 100) : 0
      })),
      topLGAs: farmersByLGA.map(item => ({
        lga: item.lga || 'Unknown',
        state: item.state || 'Unknown',
        count: item._count.id,
        percentage: totalFarmers > 0 ? Math.round((item._count.id / totalFarmers) * 100) : 0
      })),
      genderDistribution: farmersByGender.map(item => ({
        gender: item.gender || 'Unknown',
        count: item._count.id,
        percentage: totalFarmers > 0 ? Math.round((item._count.id / totalFarmers) * 100) : 0
      })),
      statusDistribution: farmersByStatus.map(item => ({
        status: item.status || 'Unknown',
        count: item._count.id,
        percentage: totalFarmers > 0 ? Math.round((item._count.id / totalFarmers) * 100) : 0
      })),
      topCrops: topCrops.map(item => ({
        crop: item.primaryCrop,
        count: item._count.id,
        percentage: farmStats._count.id > 0 
          ? Math.round((item._count.id / farmStats._count.id) * 100) 
          : 0
      }))
    };

    ProductionLogger.info(`Farmers analytics fetched: ${totalFarmers} farmers, ${farmStats._count.id} farms`);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    ProductionLogger.error('Error fetching farmers analytics:', error);
    
    // Handle database connection errors gracefully
    if (error.code === 'P1001') {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        details: 'The database server is unreachable. Please try again in a few moments.',
        code: 'DATABASE_CONNECTION_ERROR',
        success: false,
        analytics: {
          overview: {
            totalFarmers: 0,
            totalHectares: 0,
            totalFarms: 0,
            averageFarmSize: 0,
            verificationRate: 0,
            farmRegistrationRate: 0
          },
          topStates: [],
          topLGAs: [],
          genderDistribution: [],
          statusDistribution: [],
          topCrops: []
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch farmers analytics',
      details: error.message,
      success: false
    });
  }
}

export default withSecurityHeaders(
  withPerformanceMonitoring(handler)
);
