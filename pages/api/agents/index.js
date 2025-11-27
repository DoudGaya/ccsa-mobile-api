import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { auth as firebaseAuth } from '../../../lib/firebase-admin';
import ProductionLogger from '../../../lib/productionLogger';
import { withPerformanceMonitoring, withSecurityHeaders } from '../../../lib/middleware';

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      ProductionLogger.warn('Unauthorized access attempt to agents API');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        return await getAgents(req, res);
      case 'POST':
        return await createAgent(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    ProductionLogger.error('Agents API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAgents(req, res) {
  try {
    const {
      search = '',
      state = '',
      status = '',
      limit = '50',
      offset = '0'
    } = req.query;

        ProductionLogger.info('Fetching agents from database');

    // Build where clause for filtering
    const where = {
      role: 'agent' // Only fetch users with agent role (lowercase)
    };

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    ProductionLogger.debug('Query where clause:', where);

    // Get total count first
    const totalCount = await prisma.user.count({ where });

    // Fetch agents with related data
    const agents = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            farmers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    ProductionLogger.info(`Found ${agents.length} agents out of ${totalCount} total`);

    // Transform the data to match expected format
    const transformedAgents = agents.map(agent => ({
      id: agent.id,
      uid: agent.id,
      email: agent.email,
      displayName: agent.displayName || agent.email,
      phone: agent.phoneNumber,
      state: null, // We'll handle this separately if needed
      lga: null, // We'll handle this separately if needed
      role: agent.role,
      isActive: agent.isActive ?? true,
      lastLogin: agent.lastLogin,
      createdAt: agent.createdAt,
      farmerStats: {
        totalRegistered: agent._count.farmers,
        activeThisMonth: 0,
        pendingVerifications: 0
      },
      _count: {
        farmers: agent._count.farmers
      }
    }));

    return res.status(200).json({
      success: true,
      agents: transformedAgents,
      total: totalCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalCount,
        hasMore: parseInt(offset) + agents.length < totalCount
      }
    });

  } catch (error) {
    ProductionLogger.error('Error fetching agents from database:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch agents from database',
      details: error.message,
      stack: error.stack
    });
  }
}

async function createAgent(req, res) {
  let firebaseUser = null; // Declare at function scope for cleanup
  
  try {
    const { email, firstName, lastName, displayName, phoneNumber } = req.body;

    ProductionLogger.info('Creating agent with data:', { email, firstName, lastName, displayName, phoneNumber });

    if (!email || (!firstName && !displayName)) {
      ProductionLogger.warn('Validation failed: missing required fields');
      return res.status(400).json({ error: 'Email and either first name or display name are required' });
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      ProductionLogger.warn('User already exists in database:', existingUser.email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if user already exists in Firebase
    try {
      firebaseUser = await firebaseAuth.getUserByEmail(email);
      if (firebaseUser) {
        ProductionLogger.warn('User already exists in Firebase:', firebaseUser.email);
        return res.status(400).json({ error: 'User with this email already exists in Firebase' });
      }
    } catch (firebaseError) {
      // If user doesn't exist in Firebase, that's what we want
      if (firebaseError.code !== 'auth/user-not-found') {
        ProductionLogger.error('Firebase error checking user:', firebaseError);
        return res.status(500).json({ error: 'Error checking Firebase user existence' });
      }
    }

    // Set default password and display name
    const defaultPassword = '1234567890';
    const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();

    ProductionLogger.info('Creating users in both Firebase and database...');

    // Create Firebase user first
    try {
      firebaseUser = await firebaseAuth.createUser({
        email,
        password: defaultPassword,
        displayName: finalDisplayName,
        phoneNumber: phoneNumber ? phoneNumber.replace(/\s+/g, '') : undefined, // Remove spaces for Firebase
        emailVerified: true,
        disabled: false
      });
      
      ProductionLogger.info('Firebase user created successfully:', { uid: firebaseUser.uid, email: firebaseUser.email });
    } catch (firebaseError) {
      ProductionLogger.error('Error creating Firebase user:', firebaseError);
      return res.status(500).json({ 
        error: 'Failed to create Firebase user',
        details: firebaseError.message 
      });
    }

    // Create database user with Firebase UID
    ProductionLogger.info('Creating database user with Firebase UID:', firebaseUser.uid);

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const newAgent = await prisma.user.create({
      data: {
        id: firebaseUser.uid, // Use Firebase UID as database ID
        email,
        displayName: finalDisplayName,
        firstName,
        lastName, 
        phoneNumber,
        password: hashedPassword,
        role: 'agent',
        isActive: true,
        isVerified: true
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    ProductionLogger.info('Successfully created agent in both Firebase and database:', { 
      firebaseUid: firebaseUser.uid, 
      databaseId: newAgent.id,
      email: newAgent.email 
    });

    return res.status(201).json({
      success: true,
      agent: {
        id: newAgent.id,
        uid: newAgent.id,
        firebaseUid: firebaseUser.uid,
        email: newAgent.email,
        displayName: newAgent.displayName,
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        phone: newAgent.phoneNumber,
        state: null,
        lga: null,
        role: newAgent.role,
        isActive: newAgent.isActive,
        createdAt: newAgent.createdAt,
        farmerStats: {
          totalRegistered: 0,
          activeThisMonth: 0,
          pendingVerifications: 0
        }
      },
      tempPassword: defaultPassword,
      loginInstructions: `Agent can now log in to mobile app using:
Email: ${email}
Password: ${defaultPassword}`
    });

  } catch (error) {
    ProductionLogger.error('Error creating agent - Full error:', error);
    ProductionLogger.error('Error name:', error.name);
    ProductionLogger.error('Error code:', error.code);
    ProductionLogger.error('Error message:', error.message);
    
    // If database creation failed but Firebase user was created, clean up Firebase
    if (firebaseUser && firebaseUser.uid) {
      try {
        ProductionLogger.info('Cleaning up Firebase user due to database error...');
        await firebaseAuth.deleteUser(firebaseUser.uid);
        ProductionLogger.info('Firebase user cleanup successful');
      } catch (cleanupError) {
        ProductionLogger.error('Failed to cleanup Firebase user:', cleanupError);
      }
    }
    
    // Check for Prisma-specific errors
    if (error.code === 'P2002') {
      ProductionLogger.warn('Unique constraint failed:', error.meta);
      return res.status(400).json({ 
        error: 'A user with this information already exists',
        details: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create agent',
      details: error.message,
      code: error.code
    });
  }
}

export default withSecurityHeaders(
  withPerformanceMonitoring(handler)
);
