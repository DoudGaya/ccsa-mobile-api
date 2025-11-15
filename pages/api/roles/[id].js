import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { hasPermission, PERMISSIONS } from '../../../lib/permissions'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Role ID is required' })
    }

    switch (req.method) {
      case 'GET':
        return await getRole(req, res, id)
      case 'PUT':
        // Check update permission
        if (!(await hasPermission(session.user.id, PERMISSIONS.USERS_UPDATE))) {
          return res.status(403).json({ error: 'Insufficient permissions to update roles' })
        }
        return await updateRole(req, res, id)
      case 'DELETE':
        // Check delete permission
        if (!(await hasPermission(session.user.id, PERMISSIONS.USERS_DELETE))) {
          return res.status(403).json({ error: 'Insufficient permissions to delete roles' })
        }
        return await deleteRole(req, res, id)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Role API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getRole(req, res, id) {
  try {
    const role = await prisma.roles.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }

    return res.status(200).json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    return res.status(500).json({ error: 'Failed to fetch role' })
  }
}

async function updateRole(req, res, id) {
  try {
    const { name, description, permissions, isActive } = req.body

    // Check if role exists
    const existingRole = await prisma.roles.findUnique({
      where: { id }
    })

    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found' })
    }

    // Prevent updating system roles
    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'Cannot modify system roles' })
    }

    // Validate required fields if provided
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ error: 'Role name is required' })
    }

    if (permissions !== undefined && !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' })
    }

    // Check if new name conflicts with existing role
    if (name && name.trim() !== existingRole.name) {
      const conflictingRole = await prisma.roles.findFirst({
        where: { 
          name: { equals: name.trim(), mode: 'insensitive' },
          NOT: { id }
        }
      })

      if (conflictingRole) {
        return res.status(400).json({ error: 'Role with this name already exists' })
      }
    }

    const updatedRole = await prisma.roles.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() || '' }),
        ...(permissions && { permissions }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return res.status(200).json(updatedRole)
  } catch (error) {
    console.error('Error updating role:', error)
    return res.status(500).json({ error: 'Failed to update role' })
  }
}

async function deleteRole(req, res, id) {
  try {
    // Check if role exists
    const existingRole = await prisma.roles.findUnique({
      where: { id },
      include: { userRoles: true }
    })

    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found' })
    }

    // Prevent deleting system roles
    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system roles' })
    }

    // Check if role is assigned to any users
    if (existingRole.userRoles && existingRole.userRoles.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. It is assigned to ${existingRole.userRoles.length} user(s). Please unassign the role from all users first.`
      })
    }

    // Delete the role
    await prisma.roles.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return res.status(500).json({ error: 'Failed to delete role' })
  }
}
