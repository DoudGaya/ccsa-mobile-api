import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authMiddleware } from '../../../lib/authMiddleware';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if this is a web admin request (NextAuth session) or mobile agent request (Firebase token)
    const session = await getServerSession(req, res, authOptions);
    
    if (session) {
      // Web admin user - has access to all clusters
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role 
      };
    } else {
      // Mobile agent request - apply Firebase authentication middleware
      await authMiddleware(req, res);
      
      // Check if response was already sent by authMiddleware
      if (res.headersSent) {
        return;
      }
      
      req.isAdmin = false;
    }

    const { id } = req.query;
    const { method } = req;

    switch (method) {
      case 'GET':
        return await getCluster(req, res, id);
      case 'PUT':
        return await updateCluster(req, res, id);
      case 'DELETE':
        return await deleteCluster(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Cluster API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCluster(req, res, id) {
  try {
    const cluster = await prisma.cluster.findUnique({
      where: { id },
      include: {
        farmers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nin: true,
            phone: true,
            email: true,
            state: true,
            lga: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { farmers: true }
        }
      }
    });

    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    return res.status(200).json(cluster);
  } catch (error) {
    console.error('Error fetching cluster:', error);
    return res.status(500).json({ error: 'Failed to fetch cluster' });
  }
}

async function updateCluster(req, res, id) {
  try {
    const {
      title,
      description,
      clusterLeadFirstName,
      clusterLeadLastName,
      clusterLeadEmail,
      clusterLeadPhone,
      isActive
    } = req.body;

    // Validate required fields
    if (!title || !clusterLeadFirstName || !clusterLeadLastName || !clusterLeadEmail || !clusterLeadPhone) {
      return res.status(400).json({ 
        error: 'Title, cluster lead first name, last name, email, and phone are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clusterLeadEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if cluster exists
    const existingCluster = await prisma.cluster.findUnique({
      where: { id }
    });

    if (!existingCluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if title is being changed and if new title already exists
    if (title !== existingCluster.title) {
      const duplicateCluster = await prisma.cluster.findFirst({
        where: { 
          title: { equals: title, mode: 'insensitive' },
          id: { not: id }
        }
      });

      if (duplicateCluster) {
        return res.status(409).json({ error: 'Cluster with this title already exists' });
      }
    }

    const cluster = await prisma.cluster.update({
      where: { id },
      data: {
        title,
        description: description || '',
        clusterLeadFirstName,
        clusterLeadLastName,
        clusterLeadEmail,
        clusterLeadPhone,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        _count: {
          select: { farmers: true }
        }
      }
    });

    return res.status(200).json(cluster);
  } catch (error) {
    console.error('Error updating cluster:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cluster with this information already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to update cluster' });
  }
}

async function deleteCluster(req, res, id) {
  try {
    // Check if cluster exists
    const cluster = await prisma.cluster.findUnique({
      where: { id },
      include: {
        _count: {
          select: { farmers: true }
        }
      }
    });

    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if cluster has farmers
    if (cluster._count.farmers > 0) {
      return res.status(400).json({ 
        error: `Cannot delete cluster with assigned farmers. Please reassign ${cluster._count.farmers} farmers first.` 
      });
    }

    await prisma.cluster.delete({
      where: { id }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Cluster deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting cluster:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete cluster due to foreign key constraints. Please ensure all related data is removed first.' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to delete cluster' });
  }
}
