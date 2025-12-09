import prisma, { withRetry } from '../../../lib/prisma';
import { farmerSchema, refereeSchema } from '../../../lib/validation';
import { authMiddleware } from '../../../lib/authMiddleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { asyncHandler, corsMiddleware } from '../../../lib/errorHandler';
import ProductionLogger from '../../../lib/productionLogger';
import { getUserPermissions, hasPermission } from '../../../lib/permissions';

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
    // Use getServerSession instead of getSession to avoid internal HTTP requests
    const session = await getServerSession(req, res, authOptions);
    
    if (session) {
      // Web admin user - has access to all farmers
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role,
        permissions: session.user.permissions || []
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
        // Check farmers.read permission
        if (req.isAdmin && !hasPermission(req.user.permissions, 'farmers.read')) {
          return res.status(403).json({ error: 'Insufficient permissions to view farmers' });
        }
        return await getFarmers(req, res);
      case 'POST':
        // Check farmers.create permission
        if (req.isAdmin && !hasPermission(req.user.permissions, 'farmers.create')) {
          return res.status(403).json({ error: 'Insufficient permissions to create farmers' });
        }
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
      limit = 50, // Increased default for better mobile experience
      search = '', 
      state = '', 
      cluster = '',
      status, // No default - mobile agents should see all their farmers regardless of status
      startDate = '',
      endDate = ''
    } = req.query;

    // Cap the limit to prevent massive responses (max 200 for infinite scroll)
    const safeLimit = Math.min(parseInt(limit) || 50, 200);

    ProductionLogger.debug('Farmers API query params', { page, limit: safeLimit, search, state, status, startDate, endDate });
    ProductionLogger.debug('User context', { isAdmin: req.isAdmin, userUid: req.user?.uid });

    const offset = (parseInt(page) - 1) * safeLimit;

    // Handle date filtering
    let dateFilter = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : undefined;
      let end = endDate ? new Date(endDate) : undefined;
      
      if (end) {
        // Add 1 day to include the full end date
        end.setDate(end.getDate() + 1);
      }

      dateFilter = {
        createdAt: {
          ...(start && { gte: start }),
          ...(end && { lt: end })
        }
      };
    }

    // Handle search - ensure it's a string and not an array (in case of duplicate params)
    const searchTerm = Array.isArray(search) ? search[0] : search;

    const whereClause = {
      // Only filter by agentId for mobile agents (agentId is the Firebase UID from User.id)
      ...(req.isAdmin ? {} : { agentId: req.user?.uid }),
      ...(status && { status }), // Only filter by status if explicitly provided
      ...(state && { state }),
      ...(cluster && { clusterId: cluster }),
      ...dateFilter,
      ...(searchTerm && {
        OR: [
          { nin: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          // Add support for full name search (basic implementation)
          ...(searchTerm.includes(' ') ? [
            {
              AND: [
                { firstName: { contains: searchTerm.split(' ')[0], mode: 'insensitive' } },
                { lastName: { contains: searchTerm.split(' ')[1], mode: 'insensitive' } }
              ]
            }
          ] : [])
        ],
      }),
    };

    ProductionLogger.debug('Where clause for farmers query', whereClause);

    // Use retry logic for database queries
    // Optimize: Select only necessary fields for the list view
    const [farmers, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.farmer.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsAppNumber: true,
            nin: true,
            state: true,
            lga: true,
            ward: true,
            address: true,
            pollingUnit: true,
            dateOfBirth: true,
            gender: true,
            maritalStatus: true,
            employmentStatus: true,
            status: true,
            createdAt: true,
            photoUrl: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            bvn: true,
            latitude: true,
            longitude: true,
            clusterId: true,
            cluster: {
              select: {
                id: true,
                title: true,
                clusterLeadFirstName: true,
                clusterLeadLastName: true,
              },
            },
            // Only select minimal agent info
            agent: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
            // Don't fetch all related records for list view
            _count: {
              select: {
                farms: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: safeLimit,
        }),
        prisma.farmer.count({ where: whereClause }),
      ]);
    }, 3, 500);

    ProductionLogger.info(`Found ${farmers.length} farmers out of ${total} total`);

    return res.status(200).json({
      farmers,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
        hasMore: offset + farmers.length < total, // For infinite scroll
        currentCount: farmers.length,
      },
    });
  } catch (error) {
    ProductionLogger.error('Error fetching farmers:', error);
    
    // Return graceful error response with suggestions
    if (error.code === 'P1001' || error.code === 'P1017') {
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

    // Helper function to clean NIMC data (remove *** values)
    const cleanNimcValue = (value) => {
      if (!value) return null;
      const cleaned = String(value).trim();
      // Return null if value is ***, empty, or contains only special characters
      if (!cleaned || cleaned === '***' || /^[*\s]+$/.test(cleaned)) {
        return null;
      }
      return cleaned;
    };

    // Flatten the nested structure for database storage
    const farmerData = {
      nin,
      // Personal info from NIMC (name, DOB, gender, marital status, employment)
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName,
      lastName: personalInfo.lastName,
      dateOfBirth: parseDate(personalInfo.dateOfBirth),
      gender: personalInfo.gender,
      maritalStatus: personalInfo.maritalStatus,
      employmentStatus: personalInfo.employmentStatus,
      photoUrl: personalInfo.photoUrl || null, // Add photoUrl from NIN data
      
      // Location info - ALWAYS use contactInfo (form data) instead of NIMC data
      // This prevents *** values from NIMC from being stored
      state: contactInfo.state || cleanNimcValue(personalInfo.state),
      lga: contactInfo.localGovernment || cleanNimcValue(personalInfo.lga),
      ward: contactInfo.ward,
      pollingUnit: contactInfo.pollingUnit || null,
      
      // Contact info (manual entry from form)
      phone: contactInfo.phoneNumber,
      email: contactInfo.email || null,
      whatsAppNumber: contactInfo.whatsAppNumber || null,
      address: contactInfo.address,
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
    
    ProductionLogger.debug('Farmer data prepared for creation', {
      hasState: !!farmerData.state,
      hasLga: !!farmerData.lga,
      hasWard: !!farmerData.ward,
      hasPollingUnit: !!farmerData.pollingUnit,
      nimcState: personalInfo.state,
      formState: contactInfo.state,
      usedState: farmerData.state
    });

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
