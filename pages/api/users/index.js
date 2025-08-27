import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { hasPermission, PERMISSIONS } from '../../../lib/permissions'
import bcrypt from 'bcryptjs'

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
          return res.status(403).json({ error: 'Insufficient permissions to view users' })
        }
        return await getUsers(req, res)
      case 'POST':
        // Check create permission
        if (!(await hasPermission(session.user.id, PERMISSIONS.USERS_CREATE))) {
          return res.status(403).json({ error: 'Insufficient permissions to create users' })
        }
        return await createUser(req, res, session)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Users API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform users to include computed role information
    const transformedUsers = users.map(user => ({
      ...user,
      name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      roles: user.userRoles.map(ur => ur.role),
      permissions: user.userRoles.flatMap(ur => ur.role.permissions || [])
    }))

    return res.status(200).json(transformedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

async function createUser(req, res, session) {
  try {
    const {
      displayName,
      firstName,
      lastName,
      email,
      role, // This will be the role ID
      permissions = [],
      isActive = true,
      password,
      sendPasswordEmail = false
    } = req.body

    // Validate required fields
    if (!email || !role || !password) {
      return res.status(400).json({ error: 'Email, role, and password are required' })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Verify the role exists
    const selectedRole = await prisma.roles.findUnique({
      where: { id: role }
    })

    if (!selectedRole) {
      return res.status(400).json({ error: 'Selected role does not exist' })
    }

    // Hash the password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user and assign role in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          displayName,
          firstName,
          lastName,
          email,
          password: hashedPassword, // Store hashed password
          role: selectedRole.name.toLowerCase(), // Store role name in user table for backwards compatibility
          isActive,
          passwordChangeRequired: true // User should change password on first login
        }
      })

      // Assign role through user_roles table
      await tx.user_roles.create({
        data: {
          userId: user.id,
          roleId: role,
          assignedBy: session?.user?.id || null
        }
      })

      // Fetch user with role information (exclude password from response)
      return await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          passwordChangeRequired: true,
          createdAt: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      })
    })

    // Send welcome email with login credentials if requested
    if (sendPasswordEmail) {
      try {
        await sendWelcomeEmail({
          to: email,
          name: displayName || `${firstName} ${lastName}`.trim(),
          email: email,
          password: password, // Send the plain password via email
          loginUrl: `${process.env.NEXTAUTH_URL}/auth/signin`
        })
        console.log(`Welcome email sent to ${email}`)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail user creation if email fails
      }
    }

    return res.status(201).json({
      ...result,
      passwordSent: sendPasswordEmail
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}

// Email function for sending welcome emails
async function sendWelcomeEmail({ to, name, email, password, loginUrl }) {
  // This is a placeholder for email functionality
  // You can integrate with services like SendGrid, Nodemailer, etc.
  
  const emailContent = {
    to: to,
    subject: 'Welcome to CCSA - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2D5016;">Welcome to CCSA!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <p>If you have any questions or need assistance, please contact your administrator.</p>
        
        <p>Best regards,<br>CCSA Team</p>
      </div>
    `
  }
  
  // Log the email content for now (replace with actual email service)
  console.log('Email would be sent:', emailContent)
  
  // TODO: Implement actual email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransporter({ ... })
  // await transporter.sendMail(emailContent)
  
  return true
}
