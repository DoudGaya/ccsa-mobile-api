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

    switch (req.method) {
      case 'PUT':
        return await changePassword(req, res, session)
      default:
        res.setHeader('Allow', ['PUT'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Password API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function changePassword(req, res, session) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' })
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      })
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({ error: 'No password set for this account. Please contact an administrator.' })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedNewPassword,
        passwordChangeRequired: false // User has successfully changed password
      }
    })

    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return res.status(500).json({ error: 'Failed to change password' })
  }
}
