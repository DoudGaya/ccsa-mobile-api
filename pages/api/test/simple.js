import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  try {
    // Simple test to see if basic queries work
    const totalFarmers = await prisma.farmer.count()
    const totalUsers = await prisma.user.count()
    const totalAgents = await prisma.user.count({ where: { role: 'agent' } })
    
    res.status(200).json({
      success: true,
      counts: {
        totalFarmers,
        totalUsers,
        totalAgents
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
