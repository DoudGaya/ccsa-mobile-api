import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check both users and agents tables
    const userCount = await prisma.user.count();
    const agentCount = await prisma.agent.count();
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true
      }
    });

    // Check clusters
    const clusters = await prisma.cluster.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    // Check farmers with null clusterId
    const farmersWithoutCluster = await prisma.farmer.count({
      where: {
        clusterId: null
      }
    });

    res.status(200).json({
      userCount,
      agentCount,
      users: users.slice(0, 5), // First 5 users
      agents: agents.slice(0, 5), // First 5 agents
      clusters,
      farmersWithoutCluster,
      totalFarmers: await prisma.farmer.count()
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
}
