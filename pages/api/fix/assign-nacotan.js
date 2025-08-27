import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Find or create NACOTAN cluster
    let nacotanCluster = await prisma.cluster.findFirst({
      where: {
        title: {
          contains: 'NACOTAN',
          mode: 'insensitive'
        }
      }
    });

    if (!nacotanCluster) {
      // Create NACOTAN cluster if it doesn't exist
      nacotanCluster = await prisma.cluster.create({
        data: {
          title: 'NACOTAN',
          description: 'National Association of Cocoa Farmers and Allied Association of Nigeria',
          clusterLeadFirstName: 'NACOTAN',
          clusterLeadLastName: 'Admin',
          clusterLeadEmail: 'admin@nacotan.org',
          clusterLeadPhone: '+234-000-000-0000',
          isActive: true
        }
      });
    }

    // Count farmers without cluster
    const farmersWithoutCluster = await prisma.farmer.count({
      where: {
        clusterId: null
      }
    });

    // Update all farmers with null clusterId to NACOTAN cluster
    const updateResult = await prisma.farmer.updateMany({
      where: {
        clusterId: null
      },
      data: {
        clusterId: nacotanCluster.id
      }
    });

    // Get updated cluster info
    const updatedCluster = await prisma.cluster.findUnique({
      where: { id: nacotanCluster.id },
      include: {
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${updateResult.count} farmers to NACOTAN cluster`,
      cluster: updatedCluster,
      farmersWithoutCluster,
      farmersUpdated: updateResult.count
    });

  } catch (error) {
    console.error('Error assigning farmers to cluster:', error);
    res.status(500).json({ error: error.message });
  }
}
