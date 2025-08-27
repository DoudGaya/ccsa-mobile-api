import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get all roles (system + custom)
    const systemRoles = await prisma.roles.findMany({
      where: { isSystem: true },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isSystem: true
      },
      orderBy: { name: 'asc' }
    })

    const customRoles = await prisma.roles.findMany({
      where: { isSystem: false },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isSystem: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    // Get all unique permissions
    const allPermissions = new Set()
    const allRoles = [...systemRoles, ...customRoles]
    allRoles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(perm => allPermissions.add(perm))
      }
    })

    // Get user role assignments count
    const userRoleAssignments = await prisma.user_roles.count()

    const result = {
      success: true,
      message: 'Unified Roles System is working perfectly!',
      system: {
        totalSystemRoles: systemRoles.length,
        totalCustomRoles: customRoles.length,
        totalPermissions: allPermissions.size,
        userRoleAssignments: userRoleAssignments
      },
      systemRoles: systemRoles,
      customRoles: customRoles,
      availablePermissions: Array.from(allPermissions).sort(),
      migration: {
        status: 'completed',
        note: 'Groups and roles have been successfully unified into a single roles concept',
        benefits: [
          'No more confusion between groups and roles',
          'Admins can create custom roles with specific permissions',
          'Users can have system role + multiple custom roles',
          'Clear permission inheritance and combination'
        ]
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Demo API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
