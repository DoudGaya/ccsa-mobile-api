import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get detailed monthly trends with actual counts
    const monthlyTrends = [];
    const monthlyData = {};
    
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const count = await prisma.farmer.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      });
      
      const monthKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      monthlyTrends.push({
        month: monthKey,
        count: count,
        date: startDate.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      monthlyData[monthKey] = count;
    }

    // Get actual farmer registration dates
    const allFarmers = await prisma.farmer.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Group farmers by month
    const farmersByMonth = {};
    allFarmers.forEach(farmer => {
      const monthKey = farmer.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!farmersByMonth[monthKey]) {
        farmersByMonth[monthKey] = [];
      }
      farmersByMonth[monthKey].push(farmer);
    });

    res.status(200).json({
      monthlyTrends,
      monthlyData,
      farmersByMonth,
      recentFarmers: allFarmers,
      totalFarmers: await prisma.farmer.count()
    });

  } catch (error) {
    console.error('Monthly trends debug error:', error);
    res.status(500).json({ error: error.message });
  }
}
