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

    switch (req.method) {
      case 'GET':
        return await getUser(req, res, id)
      case 'PUT':
        return await updateUser(req, res, id)
      case 'DELETE':
        return await deleteUser(req, res, id)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('User API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUser(req, res, id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

async function updateUser(req, res, id) {
  try {
    const {
      displayName,
      firstName,
      lastName,
      email,
      role,
      groupIds = [],
      permissions = [],
      isActive
    } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return res.status(400).json({ error: 'Email already taken by another user' })
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return res.status(200).json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}

async function deleteUser(req, res, id) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent deleting the current user
    const session = await getServerSession(req, res, authOptions)
    if (session.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
}
