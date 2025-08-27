import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' })
    }

    switch (req.method) {
      case 'GET':
        return await getGroup(req, res, id)
      case 'PUT':
        return await updateGroup(req, res, id)
      case 'DELETE':
        return await deleteGroup(req, res, id)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Group ID API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getGroup(req, res, id) {
  try {
    const group = await prisma.groups.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userGroups: {
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

    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    return res.status(200).json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return res.status(500).json({ error: 'Failed to fetch group' })
  }
}

async function updateGroup(req, res, id) {
  try {
    const { name, description, permissions, isActive } = req.body
    const groupId = parseInt(id)

    // Check if group exists
    const existingGroup = await prisma.groups.findUnique({
      where: { id: groupId }
    })

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' })
    }

    // Validate name if provided
    if (name && !name.trim()) {
      return res.status(400).json({ error: 'Group name cannot be empty' })
    }

    // Check for duplicate name (excluding current group)
    if (name && name.trim() !== existingGroup.name) {
      const duplicateGroup = await prisma.groups.findFirst({
        where: { 
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: groupId }
        }
      })

      if (duplicateGroup) {
        return res.status(400).json({ error: 'Group with this name already exists' })
      }
    }

    const updatedGroup = await prisma.groups.update({
      where: { id: groupId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || '' }),
        ...(permissions && { permissions }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(200).json(updatedGroup)
  } catch (error) {
    console.error('Error updating group:', error)
    return res.status(500).json({ error: 'Failed to update group' })
  }
}

async function deleteGroup(req, res, id) {
  try {
    const groupId = parseInt(id)

    // Check if group exists
    const existingGroup = await prisma.groups.findUnique({
      where: { id: groupId },
      include: {
        userGroups: true
      }
    })

    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' })
    }

    // Check if group has users
    if (existingGroup.userGroups.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete group with active users. Remove all users first.' 
      })
    }

    await prisma.groups.delete({
      where: { id: groupId }
    })

    return res.status(200).json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return res.status(500).json({ error: 'Failed to delete group' })
  }
}
