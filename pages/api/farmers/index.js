import prisma from '../../../lib/prisma';
import { farmerSchema, refereeSchema } from '../../../lib/validation';
import { authMiddleware } from '../../../lib/authMiddleware';
import { getSession } from 'next-auth/react';

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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getFarmers(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      state = '', 
      status = 'active' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      status,
      // Only filter by agentId for mobile agents, not for web admins
      ...(req.isAdmin ? {} : { agentId: req.user.uid }),
      ...(state && { state }),
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

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where: whereClause,
        include: {
          referees: true,
          certificates: true,
          farms: true,
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
    console.error('Error fetching farmers:', error);
    
    // Return mock data when database is unavailable
    if (error.code === 'P1001') {
      return res.status(200).json({
        farmers: [
          {
            id: '1',
            nin: '12345678901',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '08012345678',
            dateOfBirth: '1980-01-01',
            state: 'Lagos',
            localGovernment: 'Ikeja',
            ward: 'Ward 1',
            pollingUnit: 'PU 001',
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active'
          },
          {
            id: '2',
            nin: '12345678902',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phoneNumber: '08012345679',
            dateOfBirth: '1975-05-15',
            state: 'Ogun',
            localGovernment: 'Abeokuta North',
            ward: 'Ward 2',
            pollingUnit: 'PU 002',
            createdAt: '2024-02-01T00:00:00.000Z',
            status: 'active'
          },
          {
            id: '3',
            nin: '12345678903',
            firstName: 'Ahmed',
            lastName: 'Ibrahim',
            email: 'ahmed.ibrahim@example.com',
            phoneNumber: '08012345680',
            dateOfBirth: '1990-08-20',
            state: 'Lagos',
            localGovernment: 'Surulere',
            ward: 'Ward 3',
            pollingUnit: 'PU 003',
            createdAt: '2024-03-01T00:00:00.000Z',
            status: 'active'
          },
          {
            id: '4',
            nin: '12345678904',
            firstName: 'Fatima',
            lastName: 'Yusuf',
            email: 'fatima.yusuf@example.com',
            phoneNumber: '08012345681',
            dateOfBirth: '1985-12-10',
            state: 'Kano',
            localGovernment: 'Kano Municipal',
            ward: 'Ward 4',
            pollingUnit: 'PU 004',
            createdAt: '2024-04-01T00:00:00.000Z',
            status: 'active'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 4,
          pages: 1,
        },
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createFarmer(req, res) {
  try {
    const { nin, personalInfo, contactInfo, bankInfo, referees } = req.body;

    // Helper function to safely parse date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      console.log(`Parsing date: "${dateString}"`);
      
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateString}`);
        return null;
      }
      
      console.log(`Successfully parsed date: ${dateString} -> ${date.toISOString()}`);
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
      latitude: contactInfo.coordinates?.latitude,
      longitude: contactInfo.coordinates?.longitude,
      // Bank info
      bankName: bankInfo.bankName,
      accountNumber: bankInfo.accountNumber,
      bvn: bankInfo.bvn,
    };

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
    console.log('Creating farmer with agentId:', req.user.uid);
    console.log('Farmer data preview:', {
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
