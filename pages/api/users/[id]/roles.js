import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    switch (req.method) {
      case 'GET':
        return await getUserRoles(req, res, id)
      case 'POST':
        return await assignRole(req, res, id)
      case 'DELETE':
        return await removeRole(req, res, id)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('User roles API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUserRoles(req, res, userId) {
  try {
    // Get user with their system role and assigned custom roles
    const user = await prisma.User.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        role: true, // System role stored in user.role field
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: true,
                isSystem: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get system role permissions based on user.role field
    const systemRolePermissions = getSystemRolePermissions(user.role)
    
    // Get custom role permissions from assigned roles
    const customRolePermissions = user.userRoles
      .filter(ur => ur.role.isActive)
      .flatMap(ur => ur.role.permissions || [])

    // Combine all permissions (system + custom roles)
    const allPermissions = [...new Set([...systemRolePermissions, ...customRolePermissions])]

    const result = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName
      },
      systemRole: user.role,
      assignedRoles: user.userRoles.map(ur => ur.role),
      effectivePermissions: allPermissions,
      permissionSummary: {
        total: allPermissions.length,
        fromSystemRole: systemRolePermissions.length,
        fromCustomRoles: customRolePermissions.length
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return res.status(500).json({ error: 'Failed to fetch user roles' })
  }
}

async function assignRole(req, res, userId) {
  try {
    const { roleId, roleType } = req.body

    if (!roleId) {
      return res.status(400).json({ error: 'Role ID is required' })
    }

    // Check if user exists
    const user = await prisma.User.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (roleType === 'system') {
      // Update the system role in the user.role field
      const validSystemRoles = ['super_admin', 'admin', 'manager', 'agent', 'viewer']
      
      if (!validSystemRoles.includes(roleId)) {
        return res.status(400).json({ error: 'Invalid system role' })
      }

      await prisma.User.update({
        where: { id: userId },
        data: { role: roleId }
      })

      return res.status(200).json({ message: 'System role assigned successfully' })
    } 
    else {
      // Assign custom role through user_roles table
      // Check if role exists
      const role = await prisma.roles.findUnique({
        where: { id: roleId }
      })

      if (!role) {
        return res.status(404).json({ error: 'Role not found' })
      }

      if (role.isSystem) {
        return res.status(400).json({ error: 'Cannot assign system roles through this endpoint. Use roleType: "system"' })
      }

      // Check if user already has this role
      const existingAssignment = await prisma.user_roles.findUnique({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: roleId
          }
        }
      })

      if (existingAssignment) {
        return res.status(400).json({ error: 'User already has this role' })
      }

      await prisma.user_roles.create({
        data: {
          userId: userId,
          roleId: roleId
        }
      })

      return res.status(200).json({ message: 'Role assigned successfully' })
    }
  } catch (error) {
    console.error('Error assigning role:', error)
    return res.status(500).json({ error: 'Failed to assign role' })
  }
}

async function removeRole(req, res, userId) {
  try {
    const { roleId, roleType } = req.query

    if (!roleId) {
      return res.status(400).json({ error: 'Role ID is required' })
    }

    if (roleType === 'system') {
      // Reset system role to default
      await prisma.User.update({
        where: { id: userId },
        data: { role: 'agent' } // Default role
      })

      return res.status(200).json({ message: 'System role reset to default' })
    }
    else {
      // Remove custom role assignment
      await prisma.user_roles.deleteMany({
        where: {
          userId: userId,
          roleId: roleId
        }
      })

      return res.status(200).json({ message: 'Role removed successfully' })
    }
  } catch (error) {
    console.error('Error removing role:', error)
    return res.status(500).json({ error: 'Failed to remove role' })
  }
}

function getSystemRolePermissions(role) {
  const SYSTEM_ROLES = {
    'super_admin': [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
      'farms.create', 'farms.read', 'farms.update', 'farms.delete',
      'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
      'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
      'roles.create', 'roles.read', 'roles.update', 'roles.delete',
      'analytics.read', 'settings.read', 'settings.update'
    ],
    'admin': [
      'users.read', 'users.update',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
      'farms.create', 'farms.read', 'farms.update', 'farms.delete',
      'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
      'certificates.create', 'certificates.read', 'certificates.update',
      'roles.read', 'roles.create',
      'analytics.read', 'settings.read'
    ],
    'manager': [
      'agents.read', 'agents.update',
      'farmers.create', 'farmers.read', 'farmers.update',
      'farms.create', 'farms.read', 'farms.update',
      'clusters.read', 'clusters.update',
      'certificates.create', 'certificates.read',
      'analytics.read'
    ],
    'agent': [
      'farmers.create', 'farmers.read', 'farmers.update',
      'farms.create', 'farms.read', 'farms.update',
      'certificates.create', 'certificates.read'
    ],
    'viewer': [
      'agents.read',
      'farmers.read',
      'farms.read',
      'clusters.read',
      'certificates.read',
      'analytics.read'
    ]
  }

  return SYSTEM_ROLES[role] || SYSTEM_ROLES['agent']
}
