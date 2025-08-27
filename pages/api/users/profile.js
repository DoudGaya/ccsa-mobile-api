import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    switch (req.method) {
      case 'GET':
        return await getProfile(req, res, session)
      case 'PUT':
        return await updateProfile(req, res, session)
      default:
        res.setHeader('Allow', ['GET', 'PUT'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Profile API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getProfile(req, res, session) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

async function updateProfile(req, res, session) {
  try {
    const { displayName, firstName, lastName, phoneNumber } = req.body

    // Validate input
    if (displayName && displayName.length > 100) {
      return res.status(400).json({ error: 'Display name too long' })
    }

    if (firstName && firstName.length > 50) {
      return res.status(400).json({ error: 'First name too long' })
    }

    if (lastName && lastName.length > 50) {
      return res.status(400).json({ error: 'Last name too long' })
    }

    if (phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: displayName || null,
        firstName: firstName || null,
        lastName: lastName || null,
        phoneNumber: phoneNumber || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}
