import prisma from '../../../lib/prisma';
import { farmerSchema } from '../../../lib/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { authMiddleware } from '../../../lib/authMiddleware';
import ProductionLogger from '../../../lib/productionLogger';

// GET /api/farmers/[id] - Get farmer by ID
// PUT /api/farmers/[id] - Update farmer
// DELETE /api/farmers/[id] - Delete farmer
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
      // Web admin user - has access to all farmers
      ProductionLogger.debug(`Web admin access: ${session.user.email}`);
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role 
      };
    } else {
      // Mobile agent request - apply Firebase authentication middleware
      ProductionLogger.debug('Checking Firebase authentication for mobile agent');
      await authMiddleware(req, res);
      
      // Check if response was already sent by authMiddleware
      if (res.headersSent) {
        return;
      }
      
      req.isAdmin = false;
    }

    const { method } = req;
    const { id } = req.query;

    switch (method) {
      case 'GET':
        return await getFarmer(req, res, id);
      case 'PUT':
        return await updateFarmer(req, res, id);
      case 'DELETE':
        return await deleteFarmer(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Farmer API error:', error.message);
    
    // Don't send response if it was already sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getFarmer(req, res, id) {
  try {
    ProductionLogger.debug(`Fetching farmer data for ID: ${id}`);
    
    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        referees: true,
        certificates: true,
        farms: true,
        cluster: {
          select: {
            id: true,
            title: true,
            clusterLeadFirstName: true,
            clusterLeadLastName: true,
          },
        },
        agent: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!farmer) {
      ProductionLogger.warn(`Farmer not found in database for ID: ${id}`);
      return res.status(404).json({ error: 'Farmer not found' });
    }

    ProductionLogger.debug(`Found farmer data for: ${farmer.firstName} ${farmer.lastName}`);
    return res.status(200).json(farmer);
  } catch (error) {
    console.error('Error fetching farmer from database:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch farmer from database',
      details: error.message 
    });
  }
}

async function updateFarmer(req, res, id) {
  try {
    const { referees, ...farmerData } = req.body;

    // Check if farmer exists
    const existingFarmer = await prisma.farmer.findUnique({
      where: { id },
      include: { referees: true },
    });

    if (!existingFarmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Validate farmer data
    const validatedFarmer = farmerSchema.parse(farmerData);

    // Clean up the data to remove undefined values that could cause issues
    const cleanedData = Object.fromEntries(
      Object.entries(validatedFarmer).filter(([_, value]) => value !== undefined)
    );

    // Check for unique constraints (excluding current farmer)
    const duplicateFarmer = await prisma.farmer.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { nin: cleanedData.nin },
              { phone: cleanedData.phone },
              ...(cleanedData.email ? [{ email: cleanedData.email }] : []),
              ...(cleanedData.bvn ? [{ bvn: cleanedData.bvn }] : []),
            ],
          },
        ],
      },
    });

    if (duplicateFarmer) {
      return res.status(409).json({ 
        error: 'Another farmer already exists with the same NIN, phone, email, or BVN' 
      });
    }

    // Update farmer
    const farmer = await prisma.farmer.update({
      where: { id },
      data: {
        ...cleanedData,
        referees: {
          deleteMany: {},
          create: referees?.map(referee => ({
            firstName: referee.firstName,
            lastName: referee.lastName,
            phone: referee.phone,
            relationship: referee.relationship,
          })) || [],
        },
      },
      include: {
        referees: true,
        certificates: true,
        agent: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return res.status(200).json(farmer);
  } catch (error) {
    console.error('Error updating farmer:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteFarmer(req, res, id) {
  try {
    // Check if farmer exists
    const farmer = await prisma.farmer.findUnique({
      where: { id },
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Delete farmer (referees and certificates will be deleted due to cascade)
    await prisma.farmer.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Farmer deleted successfully' });
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
