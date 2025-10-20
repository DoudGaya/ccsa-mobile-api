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
    const { method } = req;

    // Allow GET requests without authentication (public access to clusters list)
    if (method === 'GET') {
      return await getClusters(req, res);
    }

    // For POST/PUT/DELETE, require authentication
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

    switch (method) {
      case 'POST':
        return await createCluster(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Clusters API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getClusters(req, res) {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const whereClause = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { clusterLeadFirstName: { contains: search, mode: 'insensitive' } },
        { clusterLeadLastName: { contains: search, mode: 'insensitive' } },
        { clusterLeadEmail: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [clusters, total] = await Promise.all([
      prisma.cluster.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { farmers: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.cluster.count({ where: whereClause })
    ]);

    return res.status(200).json({
      clusters,
      totalCount: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      // Legacy support for old format
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    return res.status(500).json({ error: 'Failed to fetch clusters' });
  }
}

async function createCluster(req, res) {
  try {
    const {
      title,
      description,
      clusterLeadFirstName,
      clusterLeadLastName,
      clusterLeadEmail,
      clusterLeadPhone,
      clusterLeadNIN,
      clusterLeadState,
      clusterLeadLGA,
      clusterLeadWard,
      clusterLeadPollingUnit,
      clusterLeadPosition,
      clusterLeadAddress,
      clusterLeadDateOfBirth,
      clusterLeadGender,
      clusterLeadMaritalStatus,
      clusterLeadEmploymentStatus,
      clusterLeadBVN,
      clusterLeadBankName,
      clusterLeadAccountNumber,
      clusterLeadAccountName,
      clusterLeadAlternativePhone,
      clusterLeadWhatsAppNumber
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

    // Check if cluster with same title already exists
    const existingCluster = await prisma.cluster.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } }
    });

    if (existingCluster) {
      return res.status(409).json({ error: 'Cluster with this title already exists' });
    }

    const cluster = await prisma.cluster.create({
      data: {
        title,
        description: description || '',
        clusterLeadFirstName,
        clusterLeadLastName,
        clusterLeadEmail,
        clusterLeadPhone,
        clusterLeadNIN,
        clusterLeadState,
        clusterLeadLGA,
        clusterLeadWard,
        clusterLeadPollingUnit,
        clusterLeadPosition,
        clusterLeadAddress,
        clusterLeadDateOfBirth: clusterLeadDateOfBirth ? new Date(clusterLeadDateOfBirth) : null,
        clusterLeadGender,
        clusterLeadMaritalStatus,
        clusterLeadEmploymentStatus,
        clusterLeadBVN,
        clusterLeadBankName,
        clusterLeadAccountNumber,
        clusterLeadAccountName,
        clusterLeadAlternativePhone,
        clusterLeadWhatsAppNumber,
      },
      include: {
        _count: {
          select: { farmers: true }
        }
      }
    });

    return res.status(201).json(cluster);
  } catch (error) {
    console.error('Error creating cluster:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cluster with this information already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to create cluster' });
  }
}
