// API endpoint for resetting agent password
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Temporarily disabled auth middleware
// import { authMiddleware } from '../../../../lib/authMiddleware';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Agent ID is required' });
  }

  try {
    // Auth check temporarily disabled for development
    console.log('Resetting agent password - proceeding without auth check');

    const { newPassword = '1234567890' } = req.body;

    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { agent: true }
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
        newPassword: newPassword, // Return the password for admin to share with agent
        agent: {
          id: existingUser.id,
          name: existingUser.displayName || `${existingUser.firstName} ${existingUser.lastName}`,
          email: existingUser.email
        }
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
