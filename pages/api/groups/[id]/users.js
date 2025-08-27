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
      return res.status(400).json({ error: 'Group ID is required' })
    }

    switch (req.method) {
      case 'POST':
        return await addUserToGroup(req, res, id)
      case 'DELETE':
        return await removeUserFromGroup(req, res, id)
      default:
        res.setHeader('Allow', ['POST', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Group users API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function addUserToGroup(req, res, groupId) {
  try {
    const { userId } = req.body
    const parsedGroupId = parseInt(groupId)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Check if group exists
    const group = await prisma.groups.findUnique({
      where: { id: parsedGroupId }
    })

    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    // Check if user exists
    const user = await prisma.User.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user is already in group
    const existingRelation = await prisma.user_groups.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: parsedGroupId
        }
      }
    })

    if (existingRelation) {
      return res.status(400).json({ error: 'User is already in this group' })
    }

    // Add user to group
    await prisma.user_groups.create({
      data: {
        userId: userId,
        groupId: parsedGroupId
      }
    })

    return res.status(200).json({ message: 'User added to group successfully' })
  } catch (error) {
    console.error('Error adding user to group:', error)
    return res.status(500).json({ error: 'Failed to add user to group' })
  }
}

async function removeUserFromGroup(req, res, groupId) {
  try {
    const { userId } = req.query
    const parsedGroupId = parseInt(groupId)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Check if relation exists
    const existingRelation = await prisma.user_groups.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: parsedGroupId
        }
      }
    })

    if (!existingRelation) {
      return res.status(404).json({ error: 'User is not in this group' })
    }

    // Remove user from group
    await prisma.user_groups.delete({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: parsedGroupId
        }
      }
    })

    return res.status(200).json({ message: 'User removed from group successfully' })
  } catch (error) {
    console.error('Error removing user from group:', error)
    return res.status(500).json({ error: 'Failed to remove user from group' })
  }
}
