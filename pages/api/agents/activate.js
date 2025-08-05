// API endpoint for agent account activation
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return validateToken(req, res);
  } else if (req.method === 'POST') {
    return activateAgent(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Validate activation token
async function validateToken(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Activation token is required'
      });
    }

    // Find agent with this activation token
    const agent = await prisma.agent.findFirst({
      where: {
        activationToken: token,
        activationTokenExpiry: {
          gte: new Date() // Token should not be expired
        },
        status: 'pending' // Agent should be in pending status
      },
      include: {
        user: true
      }
    });

    if (!agent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired activation token'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          email: agent.email,
          firstName: agent.firstName,
          lastName: agent.lastName,
          status: agent.status
        }
      }
    });
  } catch (error) {
    console.error('Error validating activation token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to validate activation token',
      error: error.message 
    });
  }
}

// Activate agent account
async function activateAgent(req, res) {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required'
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find agent by activation token
    const agent = await prisma.agent.findFirst({
      where: {
        activationToken: token,
        activationTokenExpiry: {
          gte: new Date()
        },
        status: 'pending'
      },
      include: {
        user: true
      }
    });

    if (!agent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired activation token'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update agent and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user with password and verification status
      const updatedUser = await tx.user.update({
        where: { id: agent.userId },
        data: {
          password: hashedPassword,
          isVerified: true,
          isActive: true
        }
      });

      // Update agent status
      const updatedAgent = await tx.agent.update({
        where: { id: agent.id },
        data: {
          status: 'active',
          activationDate: new Date(),
          activationToken: null,
          activationTokenExpiry: null
        }
      });

      return { user: updatedUser, agent: updatedAgent };
    });

    res.status(200).json({
      success: true,
      message: 'Account activated successfully. You can now log in.',
      data: {
        agentId: result.agent.id,
        userId: result.user.id,
        email: result.user.email,
        isActive: result.user.isActive,
        isVerified: result.user.isVerified
      }
    });
  } catch (error) {
    console.error('Error activating agent account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to activate account',
      error: error.message 
    });
  }
}
