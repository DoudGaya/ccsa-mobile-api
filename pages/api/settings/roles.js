import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }

    // Validate role
    const validRoles = ['admin', 'super_admin', 'agent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If downgrading from admin, ensure there's at least one admin remaining
    if ((user.role === 'admin' || user.role === 'super_admin') && role !== 'admin' && role !== 'super_admin') {
      const adminCount = await prisma.user.count({
        where: { 
          OR: [
            { role: 'admin' },
            { role: 'super_admin' }
          ]
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin user' });
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json({ 
      message: 'User role updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Failed to update user role' });
  }
}
