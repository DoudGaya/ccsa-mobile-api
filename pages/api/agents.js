import { getSession } from 'next-auth/react'
import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  const session = await getSession({ req })
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const agents = await prisma.user.findMany({
        where: {
          role: 'agent'
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              farmers: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      res.status(200).json(agents)
    } catch (error) {
      console.error('Error fetching agents:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { email, firstName, lastName, phoneNumber, displayName } = req.body

      // Validate required fields
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, first name, and last name are required' })
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' })
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8)
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      // Create the agent
      const agent = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          displayName: displayName || `${firstName} ${lastName}`,
          role: 'agent',
          isActive: true
        }
      })

      // Here you would send an email with the temporary password
      // For now, we'll return it in the response (remove this in production)
      res.status(201).json({
        message: 'Agent created successfully',
        agent: {
          id: agent.id,
          email: agent.email,
          displayName: agent.displayName,
          role: agent.role
        },
        tempPassword // Remove this in production and send via email
      })
    } catch (error) {
      console.error('Error creating agent:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
