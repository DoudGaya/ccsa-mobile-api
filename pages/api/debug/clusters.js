import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check cluster status
    const clusters = await prisma.cluster.findMany({
      include: {
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    const farmersWithoutCluster = await prisma.farmer.count({
      where: {
        clusterId: null
      }
    });

    const totalFarmers = await prisma.farmer.count();

    // Sample farmers to see their cluster assignment
    const sampleFarmers = await prisma.farmer.findMany({
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        clusterId: true,
        cluster: {
          select: {
            title: true
          }
        }
      }
    });

    res.status(200).json({
      clusters,
      farmersWithoutCluster,
      totalFarmers,
      sampleFarmers
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
}
