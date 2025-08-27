import prisma from '../../../lib/prisma';
import ProductionLogger from '../../../lib/productionLogger';
import { withPerformanceMonitoring, withSecurityHeaders } from '../../../lib/middleware';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    ProductionLogger.info('Fetching farms analytics data');

    // Get total farms count and aggregate data
    const farmStats = await prisma.farm.aggregate({
      _count: {
        id: true
      },
      _sum: {
        farmSize: true
      },
      _avg: {
        farmSize: true
      }
    });

    // Get farms by state
    const farmsByState = await prisma.farm.groupBy({
      by: ['farmState'],
      _count: {
        id: true
      },
      _sum: {
        farmSize: true
      },
      where: {
        farmState: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get farms by LGA
    const farmsByLGA = await prisma.farm.groupBy({
      by: ['farmLocalGovernment', 'farmState'],
      _count: {
        id: true
      },
      _sum: {
        farmSize: true
      },
      where: {
        farmLocalGovernment: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get top primary crops
    const topPrimaryCrops = await prisma.farm.groupBy({
      by: ['primaryCrop'],
      _count: {
        id: true
      },
      _sum: {
        farmSize: true
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
      take: 10
    });

    // Get top secondary crops
    const topSecondaryCrops = await prisma.farm.groupBy({
      by: ['secondaryCrop'],
      _count: {
        id: true
      },
      _sum: {
        farmSize: true
      },
      where: {
        secondaryCrop: {
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

    // Get farm size distribution
    const farmSizeRanges = [
      { min: 0, max: 1, label: '0-1 hectares' },
      { min: 1, max: 5, label: '1-5 hectares' },
      { min: 5, max: 10, label: '5-10 hectares' },
      { min: 10, max: 50, label: '10-50 hectares' },
      { min: 50, max: 999999, label: '50+ hectares' }
    ];

    const farmSizeDistribution = await Promise.all(
      farmSizeRanges.map(async (range) => {
        const count = await prisma.farm.count({
          where: {
            farmSize: {
              gte: range.min,
              lt: range.max === 999999 ? undefined : range.max
            }
          }
        });
        return {
          range: range.label,
          count,
          percentage: farmStats._count.id > 0 ? Math.round((count / farmStats._count.id) * 100) : 0
        };
      })
    );

    // Get unique farmers with farms
    const uniqueFarmers = await prisma.farm.findMany({
      distinct: ['farmerId'],
      select: {
        farmerId: true
      }
    });

    // Format the response
    const analytics = {
      overview: {
        totalFarms: farmStats._count.id || 0,
        totalHectares: Math.round((farmStats._sum.farmSize || 0) * 100) / 100,
        averageFarmSize: Math.round((farmStats._avg.farmSize || 0) * 100) / 100,
        totalFarmers: uniqueFarmers.length,
        averageFarmsPerFarmer: uniqueFarmers.length > 0 
          ? Math.round((farmStats._count.id / uniqueFarmers.length) * 100) / 100 
          : 0
      },
      topStates: farmsByState.map(item => ({
        state: item.farmState,
        farmCount: item._count.id,
        totalHectares: Math.round((item._sum.farmSize || 0) * 100) / 100,
        percentage: farmStats._count.id > 0 ? Math.round((item._count.id / farmStats._count.id) * 100) : 0
      })),
      topLGAs: farmsByLGA.map(item => ({
        lga: item.farmLocalGovernment,
        state: item.farmState,
        farmCount: item._count.id,
        totalHectares: Math.round((item._sum.farmSize || 0) * 100) / 100,
        percentage: farmStats._count.id > 0 ? Math.round((item._count.id / farmStats._count.id) * 100) : 0
      })),
      topPrimaryCrops: topPrimaryCrops.map(item => ({
        crop: item.primaryCrop,
        farmCount: item._count.id,
        totalHectares: Math.round((item._sum.farmSize || 0) * 100) / 100,
        percentage: farmStats._count.id > 0 ? Math.round((item._count.id / farmStats._count.id) * 100) : 0
      })),
      topSecondaryCrops: topSecondaryCrops.map(item => ({
        crop: item.secondaryCrop,
        farmCount: item._count.id,
        totalHectares: Math.round((item._sum.farmSize || 0) * 100) / 100,
        percentage: farmStats._count.id > 0 ? Math.round((item._count.id / farmStats._count.id) * 100) : 0
      })),
      farmSizeDistribution
    };

    ProductionLogger.info(`Farms analytics fetched: ${farmStats._count.id} farms, ${analytics.overview.totalHectares} hectares`);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    ProductionLogger.error('Error fetching farms analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch farms analytics',
      details: error.message 
    });
  }
}

export default withSecurityHeaders(
  withPerformanceMonitoring(handler)
);
