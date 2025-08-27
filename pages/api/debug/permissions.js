import { prisma } from '../../../lib/prisma'
import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
  try {
    const session = await getSession({ req })
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get user details with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    // Get user permissions from roles
    let userPermissions = []
    if (user?.userRoles) {
      user.userRoles.forEach(userRole => {
        if (userRole.role.permissions) {
          const rolePermissions = Array.isArray(userRole.role.permissions) 
            ? userRole.role.permissions 
            : (userRole.role.permissions.permissions || [])
          userPermissions = [...userPermissions, ...rolePermissions]
        }
      })
    }

    // Remove duplicates
    userPermissions = [...new Set(userPermissions)]

    res.status(200).json({
      session,
      user,
      userPermissions,
      hasAnalyticsRead: userPermissions.includes('analytics.read'),
      hasSettingsUpdate: userPermissions.includes('settings.update')
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
