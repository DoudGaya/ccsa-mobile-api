// API endpoint for agent management
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendAgentActivationEmail } from '../../../lib/emailService';
// import { validateNIN } from '../../lib/ninValidation';
import { validateNIN } from '../../../lib/ninValidation';
// Temporarily disabled auth middleware
// import { authMiddleware } from '../../../lib/authMiddleware';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return getAllAgents(req, res);
    } else if (req.method === 'POST') {
      return createAgent(req, res);
    } else if (req.method === 'PUT') {
      return updateAgent(req, res);
    } else if (req.method === 'DELETE') {
      return deleteAgent(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Agents API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get all agents (with pagination and filtering)
async function getAllAgents(req, res) {
  try {
    const { 
      page = 1, 
      limit = 50, // Increased default limit
      status, 
      state, 
      lga, 
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // First get all users with agent role
    const userWhere = {
      role: 'agent'
    };

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with agent role and their related agent data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        skip,
        take,
        include: {
          agent: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              farmers: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: userWhere })
    ]);

    // Apply additional filters based on agent data
    let filteredUsers = users;
    if (status || state || lga) {
      filteredUsers = users.filter(user => {
        if (!user.agent) return false;
        if (status && user.agent.status !== status) return false;
        if (state && user.agent.assignedState !== state) return false;
        if (lga && user.agent.assignedLGA !== lga) return false;
        return true;
      });
    }

    const totalPages = Math.ceil(totalCount / take);

    // Transform data to include both user and agent information
    const agentsData = filteredUsers.map(user => ({
      // User data
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: user._count,
      
      // Agent data (if exists)
      agent: user.agent,
      
      // Combined display fields
      fullName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      status: user.agent?.status || (user.isActive ? 'active' : 'inactive'),
      totalFarmersRegistered: user.agent?.totalFarmersRegistered || user._count?.farmers || 0,
      assignedState: user.agent?.assignedState,
      assignedLGA: user.agent?.assignedLGA,
      phone: user.phoneNumber || user.agent?.phone,
      nin: user.agent?.nin
    }));

    res.status(200).json({
      success: true,
      data: {
        agents: agentsData,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agents',
      error: error.message 
    });
  }
}

// Create new agent
async function createAgent(req, res) {
  try {
    // Auth check temporarily disabled for development
    console.log('Creating agent - proceeding without auth check');
    
    const {
      // Personal Information
      nin,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      maritalStatus,
      employmentStatus,
      
      // Contact Information
      phone,
      email,
      whatsAppNumber,
      alternativePhone,
      
      // Address Information
      address,
      city,
      state,
      localGovernment,
      ward,
      pollingUnit,
      
      // Assignment Information
      assignedState,
      assignedLGA,
      assignedWards,
      
      // Employment Information
      employmentType,
      salary,
      commissionRate,
      startDate,
      
      // Bank Information
      bankName,
      accountName,
      accountNumber,
      bvn
    } = req.body;

    // Validate required fields
    if (!nin || !firstName || !lastName || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: NIN, first name, last name, phone, email'
      });
    }

    // Validate NIN
    console.log('🔍 Validating NIN:', nin);
    const ninValidation = await validateNIN(nin);
    if (!ninValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'NIN validation failed',
        error: ninValidation.message
      });
    }

    // Check for existing agent with same NIN, phone, or email
    const existingAgent = await prisma.agent.findFirst({
      where: {
        OR: [
          { nin },
          { phone },
          { email },
          ...(bvn ? [{ bvn }] : [])
        ]
      }
    });

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Agent already exists with this NIN, phone, email, or BVN'
      });
    }

    // Check for existing user with same email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Hash default password
    const defaultPassword = '1234567890';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user and agent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with default password
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword, // Set default password
          firstName,
          lastName,
          phoneNumber: phone,
          role: 'agent',
          displayName: `${firstName} ${lastName}`,
          isActive: true,
          isVerified: false
        }
      });

      // Create agent
      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          nin,
          firstName,
          middleName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          maritalStatus,
          employmentStatus,
          photoUrl: ninValidation.data?.photo,
          
          // Contact Information
          phone,
          email,
          whatsAppNumber,
          alternativePhone,
          
          // Address Information
          address,
          city,
          state,
          localGovernment,
          ward,
          pollingUnit,
          
          // Assignment Information
          assignedState,
          assignedLGA,
          assignedWards: assignedWards || [],
          
          // Employment Information
          employmentType,
          salary: salary ? parseFloat(salary) : null,
          commissionRate: commissionRate ? parseFloat(commissionRate) : null,
          startDate: startDate ? new Date(startDate) : null,
          
          // Bank Information
          bankName,
          accountName,
          accountNumber,
          bvn,
          
          // System Information
          status: 'pending',
          activationToken,
          activationTokenExpiry,
          // createdByUserId: authResult.user.id // Temporarily commented out
        },
        include: {
          user: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return { user, agent };
    });

    // Send activation email
    try {
      await sendAgentActivationEmail({
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName,
        activationToken,
        createdBy: result.agent.createdBy
      });
      console.log('✅ Activation email sent to:', agent.email);
    } catch (emailError) {
      console.error('❌ Failed to send activation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Agent created successfully. Activation email sent.',
      data: {
        agent: result.agent,
        user: result.user
      }
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create agent',
      error: error.message 
    });
  }
}

// Update agent
async function updateAgent(req, res) {
  try {
    // Auth check temporarily disabled for development
    console.log('Updating agent - proceeding without auth check');

    const { id } = req.query;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update agent and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update agent
      const agent = await tx.agent.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          user: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Update related user if needed
      if (updateData.email || updateData.firstName || updateData.lastName || updateData.phone) {
        await tx.user.update({
          where: { id: existingAgent.userId },
          data: {
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.firstName && { firstName: updateData.firstName }),
            ...(updateData.lastName && { lastName: updateData.lastName }),
            ...(updateData.phone && { phoneNumber: updateData.phone }),
            ...(updateData.firstName && updateData.lastName && { 
              displayName: `${updateData.firstName} ${updateData.lastName}` 
            })
          }
        });
      }

      return agent;
    });

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update agent',
      error: error.message 
    });
  }
}

// Delete agent
async function deleteAgent(req, res) {
  try {
    // Auth check temporarily disabled for development
    console.log('Deleting agent - proceeding without auth check');

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Delete agent and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete agent (this will cascade to user due to foreign key relationship)
      await tx.agent.delete({
        where: { id }
      });

      // Delete user
      await tx.user.delete({
        where: { id: existingAgent.userId }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete agent',
      error: error.message 
    });
  }
}
