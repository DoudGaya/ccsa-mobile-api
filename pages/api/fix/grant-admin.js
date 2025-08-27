import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the current user from session (you might need to pass userId in the request)
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Find or create admin role
    let adminRole = await prisma.roles.findFirst({
      where: {
        name: { in: ['admin', 'Administrator', 'ADMIN'] }
      }
    });

    if (!adminRole) {
      // Create admin role with all permissions
      adminRole = await prisma.roles.create({
        data: {
          id: 'role_admin_temp',
          name: 'Administrator',
          description: 'Full administrative access',
          permissions: {
            permissions: [
              'users.create', 'users.read', 'users.update', 'users.delete',
              'agents.create', 'agents.read', 'agents.update', 'agents.delete',
              'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
              'farms.create', 'farms.read', 'farms.update', 'farms.delete',
              'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
              'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
              'analytics.read',
              'settings.update'
            ]
          },
          isSystem: false,
          isActive: true
        }
      });
    }

    // Remove existing user roles
    await prisma.user_roles.deleteMany({
      where: { userId }
    });

    // Assign admin role to user
    await prisma.user_roles.create({
      data: {
        userId,
        roleId: adminRole.id,
        assignedBy: userId // self-assigned for this fix
      }
    });

    // Update user role field as well
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' }
    });

    res.status(200).json({
      success: true,
      message: `User ${userId} has been granted admin permissions`,
      adminRole,
      userRole: 'admin'
    });

  } catch (error) {
    console.error('Error granting admin permissions:', error);
    res.status(500).json({ error: error.message });
  }
}
