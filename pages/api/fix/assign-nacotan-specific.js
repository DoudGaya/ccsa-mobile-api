import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Find or create the specific NACOTAN cluster with the exact ID
    let nacotanCluster = await prisma.cluster.findFirst({
      where: {
        OR: [
          { id: 'cluster_nacotan_001' },
          { title: 'NACOTAN' }
        ]
      }
    });

    if (!nacotanCluster) {
      // Create NACOTAN cluster with specific ID
      nacotanCluster = await prisma.cluster.create({
        data: {
          id: 'cluster_nacotan_001', // Specific cluster ID
          title: 'NACOTAN',
          description: 'National Association of Cocoa Farmers and Allied Association of Nigeria - Main Cluster',
          clusterLeadFirstName: 'NACOTAN',
          clusterLeadLastName: 'Admin',
          clusterLeadEmail: 'admin@nacotan.org',
          clusterLeadPhone: '+234-000-000-0000',
          isActive: true
        }
      });
    } else if (nacotanCluster.id !== 'cluster_nacotan_001') {
      // Update existing cluster to have the correct ID if needed
      nacotanCluster = await prisma.cluster.update({
        where: { id: nacotanCluster.id },
        data: {
          id: 'cluster_nacotan_001',
          title: 'NACOTAN',
          description: 'National Association of Cocoa Farmers and Allied Association of Nigeria - Main Cluster'
        }
      });
    }

    // Count farmers without cluster or with different cluster
    const farmersToUpdate = await prisma.farmer.count({
      where: {
        OR: [
          { clusterId: null },
          { clusterId: { not: 'cluster_nacotan_001' } }
        ]
      }
    });

    // Update all farmers to be assigned to the NACOTAN cluster
    const updateResult = await prisma.farmer.updateMany({
      where: {
        OR: [
          { clusterId: null },
          { clusterId: { not: 'cluster_nacotan_001' } }
        ]
      },
      data: {
        clusterId: 'cluster_nacotan_001'
      }
    });

    // Get updated cluster info
    const updatedCluster = await prisma.cluster.findUnique({
      where: { id: 'cluster_nacotan_001' },
      include: {
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    // Get all clusters for reference
    const allClusters = await prisma.cluster.findMany({
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
      message: `Successfully assigned ${updateResult.count} farmers to cluster_nacotan_001`,
      cluster: updatedCluster,
      farmersToUpdate,
      farmersUpdated: updateResult.count,
      allClusters: allClusters
    });

  } catch (error) {
    console.error('Error assigning farmers to cluster_nacotan_001:', error);
    res.status(500).json({ error: error.message });
  }
}
