import { authMiddleware } from '../../../lib/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let whereClause = {};
    let farmWhereClause = {};
    
    if (!req.isAdmin) {
      // If not admin, filter by agent
      whereClause = { agentId: req.user.uid };
      farmWhereClause = { farmer: whereClause };
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Basic counts
    const [totalFarmers, totalFarms, totalAgents, farmersThisMonth, farmersThisWeek, farmersToday] = await Promise.all([
      prisma.farmer.count({ where: whereClause }),
      prisma.farm.count({ where: req.isAdmin ? {} : farmWhereClause }),
      req.isAdmin ? prisma.agent.count() : 0,
      prisma.farmer.count({ where: { ...whereClause, createdAt: { gte: startOfMonth } } }),
      prisma.farmer.count({ where: { ...whereClause, createdAt: { gte: startOfWeek } } }),
      prisma.farmer.count({ where: { ...whereClause, createdAt: { gte: startOfDay } } })
    ]);

    // Location Distribution Analytics
    const [stateDistribution, lgaDistribution, wardDistribution, pollingUnitDistribution] = await Promise.all([
      // States distribution
      prisma.farmer.groupBy({
        by: ['state'],
        where: { ...whereClause, state: { not: null } },
        _count: { state: true },
        orderBy: { _count: { state: 'desc' } }
      }),
      
      // Local Government distribution
      prisma.farmer.groupBy({
        by: ['lga'],
        where: { ...whereClause, lga: { not: null } },
        _count: { lga: true },
        orderBy: { _count: { lga: 'desc' } },
        take: 20
      }),
      
      // Ward distribution
      prisma.farmer.groupBy({
        by: ['ward'],
        where: { ...whereClause, ward: { not: null } },
        _count: { ward: true },
        orderBy: { _count: { ward: 'desc' } },
        take: 15
      }),

      // Polling unit distribution (from farms)
      prisma.farm.groupBy({
        by: ['farmPollingUnit'],
        where: { ...farmWhereClause, farmPollingUnit: { not: null } },
        _count: { farmPollingUnit: true },
        orderBy: { _count: { farmPollingUnit: 'desc' } },
        take: 15
      })
    ]);

    // Demographics Analytics
    const [genderDistribution, ageDistribution, maritalStatusDistribution] = await Promise.all([
      // Gender distribution
      prisma.farmer.groupBy({
        by: ['gender'],
        where: { ...whereClause, gender: { not: null } },
        _count: { gender: true },
        orderBy: { _count: { gender: 'desc' } }
      }),

      // Age distribution (calculated from dateOfBirth)
      prisma.farmer.findMany({
        where: { ...whereClause, dateOfBirth: { not: null } },
        select: { dateOfBirth: true }
      }).then(farmers => {
        const ageGroups = {
          '18-25': 0,
          '26-35': 0,
          '36-45': 0,
          '46-55': 0,
          '56-65': 0,
          '65+': 0
        };
        
        farmers.forEach(farmer => {
          const age = Math.floor((now - new Date(farmer.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
          if (age <= 25) ageGroups['18-25']++;
          else if (age <= 35) ageGroups['26-35']++;
          else if (age <= 45) ageGroups['36-45']++;
          else if (age <= 55) ageGroups['46-55']++;
          else if (age <= 65) ageGroups['56-65']++;
          else ageGroups['65+']++;
        });
        
        return Object.entries(ageGroups).map(([range, count]) => ({
          ageRange: range,
          count
        }));
      }),

      // Marital status distribution
      prisma.farmer.groupBy({
        by: ['maritalStatus'],
        where: { ...whereClause, maritalStatus: { not: null } },
        _count: { maritalStatus: true },
        orderBy: { _count: { maritalStatus: 'desc' } }
      })
    ]);

    // Agricultural Analytics
    const [cropDistribution, farmSizeDistribution, farmOwnershipDistribution, farmingExperienceDistribution] = await Promise.all([
      // Top crops
      prisma.farm.groupBy({
        by: ['primaryCrop'],
        where: { ...farmWhereClause, primaryCrop: { not: null } },
        _count: { primaryCrop: true },
        orderBy: { _count: { primaryCrop: 'desc' } },
        take: 10
      }),

      // Farm size distribution
      prisma.farm.findMany({
        where: { ...farmWhereClause, farmSize: { not: null } },
        select: { farmSize: true }
      }).then(farms => {
        const sizeGroups = {
          'Small (0-2 hectares)': 0,
          'Medium (2-5 hectares)': 0,
          'Large (5-10 hectares)': 0,
          'Very Large (10+ hectares)': 0
        };
        
        farms.forEach(farm => {
          const size = farm.farmSize;
          if (size <= 2) sizeGroups['Small (0-2 hectares)']++;
          else if (size <= 5) sizeGroups['Medium (2-5 hectares)']++;
          else if (size <= 10) sizeGroups['Large (5-10 hectares)']++;
          else sizeGroups['Very Large (10+ hectares)']++;
        });
        
        return Object.entries(sizeGroups).map(([range, count]) => ({
          sizeRange: range,
          count
        }));
      }),

      // Farm ownership distribution
      prisma.farm.groupBy({
        by: ['farmOwnership'],
        where: { ...farmWhereClause, farmOwnership: { not: null } },
        _count: { farmOwnership: true },
        orderBy: { _count: { farmOwnership: 'desc' } }
      }),

      // Farming experience distribution
      prisma.farm.findMany({
        where: { ...farmWhereClause, farmingExperience: { not: null } },
        select: { farmingExperience: true }
      }).then(farms => {
        const experienceGroups = {
          'Beginner (0-2 years)': 0,
          'Intermediate (3-5 years)': 0,
          'Experienced (6-10 years)': 0,
          'Expert (10+ years)': 0
        };
        
        farms.forEach(farm => {
          const exp = farm.farmingExperience;
          if (exp <= 2) experienceGroups['Beginner (0-2 years)']++;
          else if (exp <= 5) experienceGroups['Intermediate (3-5 years)']++;
          else if (exp <= 10) experienceGroups['Experienced (6-10 years)']++;
          else experienceGroups['Expert (10+ years)']++;
        });
        
        return Object.entries(experienceGroups).map(([range, count]) => ({
          experienceRange: range,
          count
        }));
      })
    ]);

    // Growth Trend Analytics (last 12 months)
    const monthlyGrowth = await Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        
        return prisma.farmer.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }).then(count => ({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count,
          date: monthStart
        }));
      })
    );

    // Sort monthly growth chronologically
    monthlyGrowth.sort((a, b) => a.date - b.date);
    monthlyGrowth.forEach(item => delete item.date);

    const stats = {
      // Basic Statistics
      overview: {
        totalFarmers,
        totalFarms,
        totalAgents,
        farmersThisMonth,
        farmersThisWeek,
        farmersToday
      },

      // Location Distribution
      locationDistribution: {
        byState: stateDistribution.map(item => ({
          state: item.state,
          count: item._count.state
        })),
        byLocalGovernment: lgaDistribution.map(item => ({
          lga: item.lga,
          count: item._count.lga
        })),
        byWard: wardDistribution.map(item => ({
          ward: item.ward,
          count: item._count.ward
        })),
        byPollingUnit: pollingUnitDistribution.map(item => ({
          pollingUnit: item.farmPollingUnit,
          count: item._count.farmPollingUnit
        }))
      },

      // Demographics
      demographics: {
        byGender: genderDistribution.map(item => ({
          gender: item.gender,
          count: item._count.gender
        })),
        byAge: ageDistribution,
        byMaritalStatus: maritalStatusDistribution.map(item => ({
          status: item.maritalStatus,
          count: item._count.maritalStatus
        }))
      },

      // Agricultural Analytics
      agriculture: {
        topCrops: cropDistribution.map(item => ({
          crop: item.primaryCrop,
          count: item._count.primaryCrop
        })),
        farmSizeDistribution,
        farmOwnership: farmOwnershipDistribution.map(item => ({
          ownership: item.farmOwnership,
          count: item._count.farmOwnership
        })),
        farmingExperience: farmingExperienceDistribution
      },

      // Growth Trends
      growthTrend: {
        monthlyRegistrations: monthlyGrowth
      }
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
