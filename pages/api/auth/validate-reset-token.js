import { z } from 'zod'
import prisma from '../../../lib/prisma'

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    const validatedData = validateTokenSchema.parse(req.body)
    const { token } = validatedData

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    return res.status(200).json({ message: 'Token is valid' })

  } catch (error) {
    console.error('Token validation error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors 
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}