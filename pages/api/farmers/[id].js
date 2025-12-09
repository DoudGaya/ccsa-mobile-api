import prisma from '../../../lib/prisma';
import { farmerSchema } from '../../../lib/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { authMiddleware } from '../../../lib/authMiddleware';
import ProductionLogger from '../../../lib/productionLogger';
import { hasPermission } from '../../../lib/permissions';

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
        role: session.user.role,
        permissions: session.user.permissions || []
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
        if (req.isAdmin && !hasPermission(req.user.permissions, 'farmers.read')) {
          return res.status(403).json({ error: 'Insufficient permissions to view farmer details' });
        }
        return await getFarmer(req, res, id);
      case 'PUT':
        if (req.isAdmin && !hasPermission(req.user.permissions, 'farmers.update')) {
          return res.status(403).json({ error: 'Insufficient permissions to update farmers' });
        }
        return await updateFarmer(req, res, id);
      case 'DELETE':
        if (req.isAdmin && !hasPermission(req.user.permissions, 'farmers.delete')) {
          return res.status(403).json({ error: 'Insufficient permissions to delete farmers' });
        }
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
    ProductionLogger.debug(`Updating farmer data for ID: ${id}`);
    ProductionLogger.debug('Request body:', req.body);

    const { referees, ...farmerData } = req.body;

    // Check if farmer exists
    const existingFarmer = await prisma.farmer.findUnique({
      where: { id },
      include: { referees: true },
    });

    if (!existingFarmer) {
      ProductionLogger.warn(`Farmer not found for update: ${id}`);
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Clean up the data: convert empty strings to null/undefined and filter out undefined values
    const cleanedData = {};
    for (const [key, value] of Object.entries(farmerData)) {
      if (value === '' || value === null) {
        // Skip empty strings and null values for optional fields
        if (!['nin', 'firstName', 'lastName', 'phone'].includes(key)) {
          continue;
        } else {
          // For required fields, keep empty strings so validation can catch them
          cleanedData[key] = value;
        }
      } else if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    ProductionLogger.debug('Cleaned data for validation:', cleanedData);

    // Validate farmer data
    let validatedFarmer;
    try {
      validatedFarmer = farmerSchema.parse(cleanedData);
    } catch (validationError) {
      ProductionLogger.error('Validation error:', validationError.errors);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validationError.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Check for unique constraints (excluding current farmer)
    const constraints = [];
    if (validatedFarmer.nin) constraints.push({ nin: validatedFarmer.nin });
    if (validatedFarmer.phone) constraints.push({ phone: validatedFarmer.phone });
    if (validatedFarmer.email) constraints.push({ email: validatedFarmer.email });
    if (validatedFarmer.bvn) constraints.push({ bvn: validatedFarmer.bvn });

    if (constraints.length > 0) {
      const duplicateFarmer = await prisma.farmer.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { OR: constraints },
          ],
        },
      });

      if (duplicateFarmer) {
        ProductionLogger.warn(`Duplicate farmer found during update for: ${id}`);
        return res.status(409).json({ 
          error: 'Another farmer already exists with the same NIN, phone, email, or BVN' 
        });
      }
    }

    // Remove undefined values from the final data
    const finalData = Object.fromEntries(
      Object.entries(validatedFarmer).filter(([_, value]) => value !== undefined)
    );

    ProductionLogger.debug('Final data for database update:', finalData);

    // Update farmer
    const farmer = await prisma.farmer.update({
      where: { id },
      data: {
        ...finalData,
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

    ProductionLogger.debug(`Successfully updated farmer: ${farmer.firstName} ${farmer.lastName}`);
    return res.status(200).json(farmer);
  } catch (error) {
    ProductionLogger.error('Error updating farmer:', error);
    console.error('Full error details:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function deleteFarmer(req, res, id) {
  try {
    ProductionLogger.debug(`Delete request for farmer ID: ${id} by user: ${req.user?.email}`);
    
    // Check if user is admin (only admins can delete farmers)
    if (!req.isAdmin) {
      ProductionLogger.warn(`Non-admin user ${req.user?.email} attempted to delete farmer`);
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only administrators can delete farmers'
      });
    }

    // Check if farmer exists and get related data
    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        farms: true,
        referees: true,
        certificates: true
      }
    });

    if (!farmer) {
      ProductionLogger.warn(`Farmer not found for deletion: ${id}`);
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Farmer not found'
      });
    }

    ProductionLogger.info(`Deleting farmer: ${farmer.firstName} ${farmer.lastName} (${id})`);
    ProductionLogger.debug(`Associated data: ${farmer.farms.length} farms, ${farmer.referees.length} referees, ${farmer.certificates.length} certificates`);

    // Delete in correct order due to foreign key constraints
    // 1. Delete all farms (cascade should handle this, but being explicit)
    if (farmer.farms.length > 0) {
      await prisma.farm.deleteMany({
        where: { farmerId: id }
      });
      ProductionLogger.debug(`Deleted ${farmer.farms.length} farms`);
    }

    // 2. Delete referees (should cascade but doing explicitly)
    if (farmer.referees.length > 0) {
      await prisma.referee.deleteMany({
        where: { farmerId: id }
      });
      ProductionLogger.debug(`Deleted ${farmer.referees.length} referees`);
    }

    // 3. Delete certificates (should cascade but doing explicitly)
    if (farmer.certificates.length > 0) {
      await prisma.certificate.deleteMany({
        where: { farmerId: id }
      });
      ProductionLogger.debug(`Deleted ${farmer.certificates.length} certificates`);
    }

    // 4. Finally delete the farmer
    await prisma.farmer.delete({
      where: { id },
    });

    ProductionLogger.info(`Successfully deleted farmer ${farmer.firstName} ${farmer.lastName} and all associated records`);

    return res.status(200).json({ 
      success: true,
      message: 'Farmer deleted successfully',
      deletedFarmer: {
        id: farmer.id,
        name: `${farmer.firstName} ${farmer.lastName}`,
        deletedRecords: {
          farms: farmer.farms.length,
          referees: farmer.referees.length,
          certificates: farmer.certificates.length
        }
      }
    });
  } catch (error) {
    ProductionLogger.error('Error deleting farmer:', error);
    console.error('Full error details:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
