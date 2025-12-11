import { z } from 'zod'
import prisma from '../../../lib/prisma'
import { sendPasswordResetEmail } from '../../../lib/emailService'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    const validatedData = forgotPasswordSchema.parse(req.body)
    const { email } = validatedData

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account with that email exists, we\'ve sent password reset instructions.' 
      })
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(200).json({ 
        message: 'If an account with that email exists, we\'ve sent password reset instructions.' 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    })

    // Send password reset email if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendPasswordResetEmail(email, resetToken, user.displayName || user.firstName)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Still return success but log the error
        // In production, you might want to notify admins
      }
    } else {
      console.warn('SMTP not configured. Password reset token generated but email not sent.')
      console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`)
    }

    return res.status(200).json({ 
      message: 'Password reset instructions have been sent to your email address.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}` })
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors 
      })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
}