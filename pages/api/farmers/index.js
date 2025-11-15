import prisma, { withRetry } from '../../../lib/prisma';
import { farmerSchema, refereeSchema } from '../../../lib/validation';
import { authMiddleware } from '../../../lib/authMiddleware';
import { getSession } from 'next-auth/react';
import { asyncHandler, corsMiddleware } from '../../../lib/errorHandler';
import ProductionLogger from '../../../lib/productionLogger';

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
    const session = await getSession({ req });
    
    if (session) {
      // Web admin user - has access to all farmers
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
    
    const { method } = req;

    switch (method) {
      case 'GET':
        return await getFarmers(req, res);
      case 'POST':
        return await createFarmer(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Farmers API error:', error);
    
    // Don't send response if it was already sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

async function getFarmers(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      state = '', 
      cluster = '',
      status // No default - mobile agents should see all their farmers regardless of status
    } = req.query;

    ProductionLogger.debug('Farmers API query params', { page, limit, search, state, status });
    ProductionLogger.debug('User context', { isAdmin: req.isAdmin, userUid: req.user?.uid });

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      // Only filter by agentId for mobile agents (agentId is the Firebase UID from User.id)
      ...(req.isAdmin ? {} : { agentId: req.user?.uid }),
      ...(status && { status }), // Only filter by status if explicitly provided
      ...(state && { state }),
      ...(cluster && { clusterId: cluster }),
      ...(search && {
        OR: [
          { nin: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    ProductionLogger.debug('Where clause for farmers query', whereClause);

    // Use retry logic for database queries
    const [farmers, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.farmer.findMany({
          where: whereClause,
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
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: parseInt(limit),
        }),
        prisma.farmer.count({ where: whereClause }),
      ]);
    }, 3, 500);

    ProductionLogger.info(`Found ${farmers.length} farmers out of ${total} total`);

    return res.status(200).json({
      farmers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    ProductionLogger.error('Error fetching farmers:', error);
    
    // Return graceful error response with suggestions
    if (error.code === 'P1001') {
      return res.status(503).json({ 
        error: 'Database connection temporarily unavailable. Please try again in a few moments.',
        message: 'The database server is unreachable. This is usually a temporary issue.',
        code: 'DATABASE_CONNECTION_ERROR',
        farmers: [], // Return empty array instead of crashing
        pagination: {
          page: parseInt(req.query.page || 1),
          limit: parseInt(req.query.limit || 10),
          total: 0,
          pages: 0,
        }
      });
    }

    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to fetch farmers',
        message: error.message
      });
    }
  }
}

async function createFarmer(req, res) {
  try {
    const { nin, personalInfo, contactInfo, bankInfo, referees } = req.body;

    // Helper function to safely parse date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      ProductionLogger.debug(`Parsing date: "${dateString}"`);
      
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        ProductionLogger.warn(`Invalid date format: ${dateString}`);
        return null;
      }
      
      ProductionLogger.debug(`Successfully parsed date: ${dateString} -> ${date.toISOString()}`);
      return date;
    };

    // Flatten the nested structure for database storage
    const farmerData = {
      nin,
      // Personal info from NIN
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName,
      lastName: personalInfo.lastName,
      dateOfBirth: parseDate(personalInfo.dateOfBirth),
      gender: personalInfo.gender,
      state: personalInfo.state || contactInfo.state,
      lga: personalInfo.lga || contactInfo.localGovernment,
      maritalStatus: personalInfo.maritalStatus,
      employmentStatus: personalInfo.employmentStatus,
      photoUrl: personalInfo.photoUrl || null, // Add photoUrl from NIN data
      // Contact info (manual entry)
      phone: contactInfo.phoneNumber,
      email: contactInfo.email || null,
      whatsAppNumber: contactInfo.whatsAppNumber || null,
      address: contactInfo.address,
      ward: contactInfo.ward,
      pollingUnit: contactInfo.pollingUnit || null, // Add polling unit
      latitude: contactInfo.coordinates?.latitude,
      longitude: contactInfo.coordinates?.longitude,
      // Bank info
      bankName: bankInfo.bankName,
      accountName: bankInfo.accountName,
      accountNumber: bankInfo.accountNumber,
      bvn: bankInfo.bvn,
      
      // Cluster assignment - required field
      clusterId: contactInfo.cluster,
      
      // Agent assignment
      agentId: req.user.uid,
    };

    // Validate that cluster is provided
    if (!farmerData.clusterId) {
      return res.status(400).json({ 
        error: 'Cluster assignment is required',
        message: 'Please select a cluster for this farmer'
      });
    }

    // Validate referees if provided
    let validatedReferees = [];
    if (referees && referees.length > 0) {
      validatedReferees = referees.map(referee => ({
        firstName: referee.fullName.split(' ')[0] || '',
        lastName: referee.fullName.split(' ').slice(1).join(' ') || '',
        phone: referee.phoneNumber,
        relationship: referee.relation,
      }));
    }

    // Check for unique constraints
    const existingFarmer = await prisma.farmer.findFirst({
      where: {
        OR: [
          { nin: farmerData.nin },
          { phone: farmerData.phone },
          ...(farmerData.email ? [{ email: farmerData.email }] : []),
          ...(farmerData.bvn ? [{ bvn: farmerData.bvn }] : []),
        ],
      },
      select: {
        nin: true,
        phone: true,
        email: true,
        bvn: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existingFarmer) {
      const conflicts = [];
      if (existingFarmer.nin === farmerData.nin) conflicts.push('NIN');
      if (existingFarmer.phone === farmerData.phone) conflicts.push('Phone number');
      if (farmerData.email && existingFarmer.email === farmerData.email) conflicts.push('Email');
      if (farmerData.bvn && existingFarmer.bvn === farmerData.bvn) conflicts.push('BVN');

      return res.status(409).json({ 
        error: 'Farmer already exists',
        message: `A farmer is already registered with the following information: ${conflicts.join(', ')}`,
        conflicts: conflicts,
        existingFarmer: {
          name: `${existingFarmer.firstName} ${existingFarmer.lastName}`,
          nin: existingFarmer.nin,
        }
      });
    }

    // Create farmer with referees
    ProductionLogger.debug('Creating farmer with agentId', req.user.uid);
    ProductionLogger.debug('Farmer data preview', {
      nin: farmerData.nin,
      firstName: farmerData.firstName,
      lastName: farmerData.lastName,
      phone: farmerData.phone,
      agentId: req.user.uid,
    });
    
    const farmer = await prisma.farmer.create({
      data: {
        ...farmerData,
        agentId: req.user.uid, // Use uid instead of id
        referees: {
          create: validatedReferees,
        },
      },
      include: {
        referees: true,
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

    return res.status(201).json(farmer);
  } catch (error) {
    console.error('Error creating farmer:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'A farmer with this information already exists' 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
