// API endpoint for individual agent operations
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Temporarily disabled auth middleware
// import { authMiddleware } from '../../../lib/authMiddleware';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Agent ID is required' });
  }

  try {
    if (req.method === 'GET') {
      return getAgentById(req, res, id);
    } else if (req.method === 'PUT') {
      return updateAgent(req, res, id);
    } else if (req.method === 'DELETE') {
      return deleteAgent(req, res, id);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Agent API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get agent by ID
async function getAgentById(req, res, id) {
  try {
    // Try to find user first (since agents are users with role 'agent')
    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Get farmer registration stats
    const farmers = await prisma.farmer.findMany({
      where: { agentId: id },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });

    const stats = {
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter(f => f.status === 'active').length,
      recentRegistrations: farmers.filter(f => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(f.createdAt) > thirtyDaysAgo;
      }).length
    };

    // Combine user and agent data
    const agentData = {
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
    };

    res.status(200).json({
      success: true,
      data: {
        agent: agentData,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agent',
      error: error.message 
    });
  }
}

// Update agent
async function updateAgent(req, res, id) {
  try {
    // Auth check temporarily disabled for development
    console.log('Updating agent - proceeding without auth check');

    const updateData = req.body;

    // Find existing user/agent
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { agent: true }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...(updateData.email && { email: updateData.email }),
          ...(updateData.firstName && { firstName: updateData.firstName }),
          ...(updateData.lastName && { lastName: updateData.lastName }),
          ...(updateData.phoneNumber && { phoneNumber: updateData.phoneNumber }),
          ...(updateData.displayName && { displayName: updateData.displayName }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.isVerified !== undefined && { isVerified: updateData.isVerified }),
          updatedAt: new Date()
        }
      });

      // Update agent data if agent record exists
      let updatedAgent = null;
      if (existingUser.agent) {
        updatedAgent = await tx.agent.update({
          where: { userId: id },
          data: {
            ...(updateData.nin && { nin: updateData.nin }),
            ...(updateData.firstName && { firstName: updateData.firstName }),
            ...(updateData.middleName !== undefined && { middleName: updateData.middleName }),
            ...(updateData.lastName && { lastName: updateData.lastName }),
            ...(updateData.dateOfBirth && { dateOfBirth: new Date(updateData.dateOfBirth) }),
            ...(updateData.gender && { gender: updateData.gender }),
            ...(updateData.maritalStatus && { maritalStatus: updateData.maritalStatus }),
            ...(updateData.employmentStatus && { employmentStatus: updateData.employmentStatus }),
            ...(updateData.phone && { phone: updateData.phone }),
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.whatsAppNumber !== undefined && { whatsAppNumber: updateData.whatsAppNumber }),
            ...(updateData.alternativePhone !== undefined && { alternativePhone: updateData.alternativePhone }),
            ...(updateData.address !== undefined && { address: updateData.address }),
            ...(updateData.city !== undefined && { city: updateData.city }),
            ...(updateData.state !== undefined && { state: updateData.state }),
            ...(updateData.localGovernment !== undefined && { localGovernment: updateData.localGovernment }),
            ...(updateData.ward !== undefined && { ward: updateData.ward }),
            ...(updateData.pollingUnit !== undefined && { pollingUnit: updateData.pollingUnit }),
            ...(updateData.assignedState !== undefined && { assignedState: updateData.assignedState }),
            ...(updateData.assignedLGA !== undefined && { assignedLGA: updateData.assignedLGA }),
            ...(updateData.assignedWards !== undefined && { assignedWards: updateData.assignedWards }),
            ...(updateData.employmentType !== undefined && { employmentType: updateData.employmentType }),
            ...(updateData.salary !== undefined && { salary: updateData.salary ? parseFloat(updateData.salary) : null }),
            ...(updateData.commissionRate !== undefined && { commissionRate: updateData.commissionRate ? parseFloat(updateData.commissionRate) : null }),
            ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
            ...(updateData.endDate !== undefined && { endDate: updateData.endDate ? new Date(updateData.endDate) : null }),
            ...(updateData.bankName !== undefined && { bankName: updateData.bankName }),
            ...(updateData.accountName !== undefined && { accountName: updateData.accountName }),
            ...(updateData.accountNumber !== undefined && { accountNumber: updateData.accountNumber }),
            ...(updateData.bvn !== undefined && { bvn: updateData.bvn }),
            ...(updateData.status && { status: updateData.status }),
            updatedAt: new Date()
          }
        });
      }

      return { user: updatedUser, agent: updatedAgent };
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
async function deleteAgent(req, res, id) {
  try {
    // Auth check temporarily disabled for development
    console.log('Deleting agent - proceeding without auth check');

    // Find existing user/agent
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { agent: true, _count: { select: { farmers: true } } }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Check if agent has farmers
    if (existingUser._count.farmers > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete agent. This agent has ${existingUser._count.farmers} registered farmers. Please reassign or delete the farmers first.` 
      });
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete agent record if exists
      if (existingUser.agent) {
        await tx.agent.delete({
          where: { userId: id }
        });
      }

      // Delete user record
      await tx.user.delete({
        where: { id }
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

// Reset agent password
export async function resetAgentPassword(req, res, id) {
  try {
    // Apply auth middleware for admin access
    const authResult = await authMiddleware(req, res);
    if (!authResult.success || authResult.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    const { newPassword = '1234567890' } = req.body;

    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        newPassword: newPassword // Only return this in development
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password',
      error: error.message 
    });
  }
}
