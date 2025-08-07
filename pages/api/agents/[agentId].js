import prisma from '../../../lib/prisma';
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
      // Web admin user
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

    const { agentId } = req.query;

    if (req.method === 'GET') {
      try {
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        });

        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        // Get agent statistics
        const stats = {
          totalFarmers: agent.totalFarmersRegistered,
          activeFarmers: agent.activeAssignments,
          recentRegistrations: 0 // You can calculate this based on your needs
        };

        return res.status(200).json({ 
          agent,
          stats 
        });
      } catch (error) {
        console.error('Error fetching agent:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    if (req.method === 'PUT') {
      try {
        const updateData = req.body;
        
        const updatedAgent = await prisma.agent.update({
          where: { id: agentId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        });

        return res.status(200).json({ agent: updatedAgent });
      } catch (error) {
        console.error('Error updating agent:', error);
        
        if (error.code === 'P2002') {
          return res.status(400).json({ 
            error: 'Agent with this information already exists' 
          });
        }
        
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        await prisma.agent.delete({
          where: { id: agentId }
        });

        return res.status(200).json({ message: 'Agent deleted successfully' });
      } catch (error) {
        console.error('Error deleting agent:', error);
        
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Agent API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
