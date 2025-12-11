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

    switch (req.method) {
      case 'GET':
        // Check read permission
        if (!(await hasPermission(session.user.id, PERMISSIONS.USERS_READ))) {
          return res.status(403).json({ error: 'Insufficient permissions to view roles' })
        }
        return await getRoles(req, res)
      case 'POST':
        // Check create permission
        if (!(await hasPermission(session.user.id, PERMISSIONS.USERS_CREATE))) {
          return res.status(403).json({ error: 'Insufficient permissions to create roles' })
        }
        return await createRole(req, res, session)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Roles API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getRoles(req, res) {
  try {
    const roles = await prisma.roles.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
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
      },
      orderBy: [
        { isSystem: 'desc' }, // System roles first
        { createdAt: 'desc' }
      ]
    })

    // Separate system and custom roles for better organization
    const systemRoles = roles.filter(role => role.isSystem)
    const customRoles = roles.filter(role => !role.isSystem)

    const result = {
      systemRoles,
      customRoles,
      totalRoles: roles.length,
      availablePermissions: getAllPermissions()
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return res.status(500).json({ error: 'Failed to fetch roles' })
  }
}

async function createRole(req, res, session) {
  try {
    const { name, description, permissions, isActive = true } = req.body

    console.log('Create role request:', { name, description, permissions: permissions?.length, isActive })

    // Validate required fields
    if (!name || !name.trim()) {
      console.log('Validation failed: Role name is required')
      return res.status(400).json({ error: 'Role name is required' })
    }

    if (!permissions || !Array.isArray(permissions)) {
      console.log('Validation failed: Permissions array is required', { permissions })
      return res.status(400).json({ error: 'Permissions array is required' })
    }

    // Validate permissions
    const validPermissions = getAllPermissions()
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
      })
    }

    // Check if role with same name exists
    const existingRole = await prisma.roles.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })

    if (existingRole) {
      console.log('Validation failed: Role already exists', { name: name.trim() })
      return res.status(400).json({ error: 'Role with this name already exists' })
    }

    console.log('Creating role:', { name: name.trim(), permissionsCount: permissions.length })

    const newRole = await prisma.roles.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        permissions: permissions,
        isSystem: false, // Custom roles are never system roles
        isActive,
        createdBy: session.user?.id || null
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    })

    console.log('Role created successfully:', { id: newRole.id, name: newRole.name })
    return res.status(201).json(newRole)
  } catch (error) {
    console.error('Error creating role:', error)
    return res.status(500).json({ error: 'Failed to create role' })
  }
}

function getAllPermissions() {
  return [
    // User permissions
    'users.create', 'users.read', 'users.update', 'users.delete',
    
    // Agent permissions
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    
    // Farmer permissions
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
    
    // Farm permissions
    'farms.create', 'farms.read', 'farms.update', 'farms.delete',
    
    // Cluster permissions
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    
    // Certificate permissions
    'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
    
    // Role permissions (only admins should have these)
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    
    // Analytics permissions
    'analytics.read', 'analytics.create', 'analytics.update', 'analytics.delete',
    
    // Settings permissions
    'settings.read', 'settings.update'
  ]
}
