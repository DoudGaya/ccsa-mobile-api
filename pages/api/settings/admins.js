import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return await getAdmins(req, res);
      case 'POST':
        return await createAdmin(req, res);
      case 'DELETE':
        return await deleteAdmin(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAdmins(req, res) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({ message: 'Failed to fetch admins' });
  }
}

async function createAdmin(req, res) {
  try {
    const { email, displayName, password } = req.body;

    if (!email || !displayName || !password) {
      return res.status(400).json({ message: 'Email, display name, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const newAdmin = await prisma.user.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        role: 'admin',
        isVerified: true // Auto-verify admin accounts
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({ admin: newAdmin });
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ message: 'Failed to create admin' });
  }
}

async function deleteAdmin(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.role !== 'admin' && admin.role !== 'super_admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Count remaining admins
    const adminCount = await prisma.user.count({
      where: { 
        OR: [
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      }
    });

    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin user' });
    }

    // Delete admin
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return res.status(500).json({ message: 'Failed to delete admin' });
  }
}
