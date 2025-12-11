import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

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
      role, // This is the role ID for RBAC
      groupIds = [],
      permissions = [],
      isActive,
      password, // New password field for admin password reset
      sendPasswordEmail = false
    } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Hash password if provided
    let hashedPassword = undefined
    if (password) {
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' })
      }
      
      const saltRounds = 12
      hashedPassword = await bcrypt.hash(password, saltRounds)
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

    // Get session for audit trail
    const session = await getServerSession(req, res, authOptions)

    // Update user in a transaction to handle role changes
    const result = await prisma.$transaction(async (tx) => {
      // If role is being updated, verify it exists and update user_roles
      if (role) {
        const selectedRole = await tx.roles.findUnique({
          where: { id: role }
        })

        if (!selectedRole) {
          throw new Error('Selected role does not exist')
        }

        // Delete existing role assignments
        await tx.user_roles.deleteMany({
          where: { userId: id }
        })

        // Create new role assignment
        await tx.user_roles.create({
          data: {
            userId: id,
            roleId: role,
            assignedBy: session?.user?.id || null
          }
        })

        // Update the legacy role field for backwards compatibility
        await tx.user.update({
          where: { id },
          data: {
            role: selectedRole.name.toLowerCase()
          }
        })
      }

      // Update user basic information
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(displayName !== undefined && { displayName }),
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email && { email }),
          ...(isActive !== undefined && { isActive }),
          ...(hashedPassword && { 
            password: hashedPassword,
            passwordChangeRequired: true // User should change password on first login
          })
        },
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  permissions: true,
                  isSystem: true
                }
              }
            }
          }
        }
      })

      return user
    })

    // Transform response to match expected format
    const transformedUser = {
      ...result,
      name: result.displayName || `${result.firstName || ''} ${result.lastName || ''}`.trim(),
      roles: result.userRoles.map(ur => ur.role),
      permissions: result.userRoles.flatMap(ur => ur.role.permissions || [])
    }

    return res.status(200).json(transformedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return res.status(500).json({ error: error.message || 'Failed to update user' })
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
