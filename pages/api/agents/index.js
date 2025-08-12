import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
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
    console.error('Agents API error:', error.message);
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

    console.log('Fetching agents from database');

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

    console.log('Query where clause:', where);

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

    console.log(`Found ${agents.length} agents`);

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
      total: agents.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: agents.length,
        hasMore: parseInt(offset) + agents.length < agents.length
      }
    });

  } catch (error) {
    console.error('Error fetching agents from database:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch agents from database',
      details: error.message,
      stack: error.stack
    });
  }
}

async function createAgent(req, res) {
  try {
    const { email, firstName, lastName, displayName, phoneNumber } = req.body;

    console.log('Creating agent with data:', { email, firstName, lastName, displayName, phoneNumber });

    if (!email || (!firstName && !displayName)) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ error: 'Email and either first name or display name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Set default password and display name
    const defaultPassword = '1234567890';
    const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();

    console.log('Creating user with:', { email, finalDisplayName, firstName, lastName, phoneNumber, role: 'agent' });

    // Hash the default password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create new agent user
    const newAgent = await prisma.user.create({
      data: {
        email,
        displayName: finalDisplayName,
        firstName,
        lastName, 
        phoneNumber,
        password: hashedPassword,
        role: 'agent',
        isActive: true,
        isVerified: true // Auto-verify agent accounts
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

    console.log('Successfully created agent:', { id: newAgent.id, email: newAgent.email });

    return res.status(201).json({
      success: true,
      agent: {
        id: newAgent.id,
        uid: newAgent.id,
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
      tempPassword: defaultPassword
    });

  } catch (error) {
    console.error('Error creating agent - Full error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for Prisma-specific errors
    if (error.code === 'P2002') {
      console.log('Unique constraint failed:', error.meta);
      return res.status(400).json({ 
        error: 'A user with this email already exists',
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
