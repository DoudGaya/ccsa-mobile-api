import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { authMiddleware } from '../../../lib/authMiddleware';
import { auth as firebaseAuth } from '../../../lib/firebase-admin';

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
      // Web admin user - has access to all agents
      console.log(`✅ Web admin access: ${session.user.email}`);
      req.isAdmin = true;
      req.user = { 
        uid: session.user.id, 
        email: session.user.email,
        role: session.user.role 
      };
    } else {
      // Mobile agent request - apply Firebase authentication middleware
      console.log('🔄 Checking Firebase authentication for mobile agent...');
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
        return await getAgent(req, res, id);
      case 'PUT':
        return await updateAgent(req, res, id);
      case 'DELETE':
        return await deleteAgent(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Agent API error:', error);
    
    // Don't send response if it was already sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getAgent(req, res, id) {
  try {
    console.log(`=== Fetching real agent data for ID: ${id} ===`);

    // Try to find agent by ID in the database
    let agent = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'agent'
      },
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
          take: 100 // Limit to recent 100 farmers
        },
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    if (!agent) {
      console.log(`❌ Agent not found in database for ID: ${id}`);
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`✅ Found real agent data for: ${agent.displayName || agent.firstName + ' ' + agent.lastName}`);

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const farmerStats = {
      totalRegistered: agent._count.farmers,
      activeThisMonth: agent.farmers.filter(f => new Date(f.createdAt) >= thisMonth).length,
      activeThisWeek: agent.farmers.filter(f => new Date(f.createdAt) >= thisWeek).length,
    };

    // Prepare response data
    const responseData = {
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      displayName: agent.displayName,
      email: agent.email,
      phone: agent.phone || agent.phoneNumber,
      role: agent.role,
      state: agent.state,
      lga: agent.lga,
      address: agent.address,
      isActive: agent.isActive,
      lastLogin: agent.lastLogin,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      farmers: agent.farmers,
      farmerStats,
      _count: agent._count
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching agent from database:', error);
    
    // If database fails, return error (frontend will handle fallback)
    return res.status(500).json({ 
      error: 'Failed to fetch agent from database',
      details: error.message 
    });
  }
}

async function updateAgent(req, res, id) {
  try {
    const updateData = req.body;

    // Only allow valid user fields
    const allowedFields = [
      'displayName', 'firstName', 'lastName', 'email', 'phone', 'phoneNumber', 'role', 'isActive', 'address', 'lastLogin', 'createdAt', 'updatedAt'
    ];
    const filteredData = {};
    for (const key of allowedFields) {
      if (key in updateData) {
        filteredData[key] = updateData[key];
      }
    }
    filteredData.updatedAt = new Date();

    // Check if agent exists
    const existingAgent = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'agent'
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update agent
    const updatedAgent = await prisma.user.update({
      where: { id: existingAgent.id },
      data: filteredData,
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
          select: {
            farmers: true
          }
        }
      }
    });

    return res.status(200).json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Agent with this information already exists' 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteAgent(req, res, id) {
  try {
    console.log(`Starting agent deletion process for ID: ${id}`);

    // Check if agent exists
    const agent = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'agent'
      },
      include: {
        _count: {
          select: {
            farmers: true
          }
        }
      }
    });

    if (!agent) {
      console.log(`Agent not found: ${id}`);
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`Found agent: ${agent.email}, farmers count: ${agent._count.farmers}`);

    // Check if agent has registered farmers
    if (agent._count.farmers > 0) {
      console.log(`Cannot delete agent ${agent.email} - has ${agent._count.farmers} farmers`);
      return res.status(400).json({ 
        error: `Cannot delete agent with registered farmers. Please reassign ${agent._count.farmers} farmers first.` 
      });
    }

    // Delete from Firebase first
    let firebaseDeleted = false;
    try {
      console.log(`Attempting to delete Firebase user: ${agent.email}`);
      
      // Try to get Firebase user by email first to confirm they exist
      let firebaseUser = null;
      try {
        firebaseUser = await firebaseAuth.getUserByEmail(agent.email);
        console.log(`Found Firebase user: ${firebaseUser.uid}`);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/user-not-found') {
          console.log(`Firebase user not found for ${agent.email}, skipping Firebase deletion`);
        } else {
          console.error(`Error checking Firebase user ${agent.email}:`, firebaseError);
          // Continue with database deletion even if Firebase check fails
        }
      }

      // Delete Firebase user if they exist
      if (firebaseUser) {
        await firebaseAuth.deleteUser(firebaseUser.uid);
        console.log(`✅ Successfully deleted Firebase user: ${firebaseUser.uid}`);
        firebaseDeleted = true;
      }

    } catch (firebaseError) {
      console.error(`Firebase deletion failed for ${agent.email}:`, firebaseError);
      // Continue with database deletion even if Firebase deletion fails
      // We'll note this in the response
    }

    // Delete from database (hard delete)
    console.log(`Deleting agent from database: ${agent.id}`);
    
    await prisma.user.delete({
      where: { id: agent.id }
    });

    console.log(`✅ Successfully deleted agent from database: ${agent.email}`);

    // Return success response with details
    const response = {
      success: true,
      message: 'Agent deleted successfully',
      details: {
        email: agent.email,
        databaseDeleted: true,
        firebaseDeleted,
        hadFarmers: agent._count.farmers > 0
      }
    };

    if (!firebaseDeleted && agent.email) {
      response.warning = 'Agent deleted from database, but Firebase user deletion failed or user was not found in Firebase';
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting agent:', error);
    
    // Provide more detailed error information
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete agent due to foreign key constraints. Please ensure all related data is removed first.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to delete agent',
      details: error.message 
    });
  }
}
