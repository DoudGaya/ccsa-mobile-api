import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Starting analytics fetch...')
    
    // Goal: 2 Million farmers
    const GOAL_FARMERS = 2000000;

    // Get basic counts
    const totalFarmers = await prisma.farmer.count()
    const totalAgents = await prisma.user.count({ where: { role: 'agent' } })
    const totalClusters = await prisma.cluster.count()
    const totalFarms = await prisma.farm.count()

    console.log('Basic counts:', { totalFarmers, totalAgents, totalClusters, totalFarms })

    // Get farmers by state
    const farmersByStateRaw = await prisma.farmer.groupBy({
      by: ['state'],
      _count: { id: true }
    })

    // Merge case-sensitive states
    const stateMap = {}
    farmersByStateRaw.forEach(item => {
      const normalizedState = item.state?.toLowerCase()
      if (normalizedState) {
        if (!stateMap[normalizedState]) {
          stateMap[normalizedState] = {
            state: item.state.charAt(0).toUpperCase() + item.state.slice(1).toLowerCase(),
            count: 0
          }
        }
        stateMap[normalizedState].count += item._count.id
      }
    })

    const farmersByState = Object.values(stateMap).sort((a, b) => b.count - a.count)

    // Get farmers by gender
    const farmersByGenderRaw = await prisma.farmer.groupBy({
      by: ['gender'],
      _count: { id: true }
    })

    // Normalize gender data
    const genderMap = { Male: 0, Female: 0 }
    farmersByGenderRaw.forEach(item => {
      const gender = item.gender?.toLowerCase()
      if (gender === 'm' || gender === 'male') {
        genderMap.Male += item._count.id
      } else if (gender === 'f' || gender === 'female') {
        genderMap.Female += item._count.id
      }
    })

    const farmersByGender = Object.entries(genderMap).map(([gender, count]) => ({
      gender,
      count
    }))

    // Get clusters with farmer counts
    const clusters = await prisma.cluster.findMany({
      include: {
        _count: { select: { farmers: true } }
      }
    })

    const farmersByClusters = clusters.map(cluster => ({
      clusterTitle: cluster.title,
      clusterDescription: cluster.description,
      clusterLeadName: `${cluster.clusterLeadFirstName} ${cluster.clusterLeadLastName}`,
      count: cluster._count.farmers
    })).sort((a, b) => b.count - a.count)

    // Get monthly trends (simplified)
    const monthlyTrends = []
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - i)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      const count = await prisma.farmer.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      })
      
      monthlyTrends.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: count
      })
    }

    // Calculate progress
    const progressPercentage = totalFarmers > 0 ? (totalFarmers / GOAL_FARMERS) * 100 : 0

    const response = {
      overview: {
        totalFarmers,
        totalAgents,
        totalClusters,
        totalFarms,
        goal: GOAL_FARMERS,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remaining: Math.max(0, GOAL_FARMERS - totalFarmers)
      },
      geography: {
        byState: farmersByState
      },
      demographics: {
        byGender: farmersByGender
      },
      clusters: {
        byClusters: farmersByClusters
      },
      trends: {
        monthly: monthlyTrends
      },
      lastUpdated: new Date().toISOString()
    }

    console.log('Analytics response prepared:', Object.keys(response))
    res.status(200).json(response)

  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    })
  }
}
