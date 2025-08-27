import { getServerSession } from 'next-auth'
import { authOptions } from './[...nextauth]'
import { getUserPermissions } from '../../../lib/permissions'
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    // Get fresh user data from database
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
                isSystem: true,
                description: true
              }
            }
          }
        }
      }
    })

    // Get permissions using the lib function
    const dbPermissions = await getUserPermissions(session.user.id)

    return res.status(200).json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        sessionRoles: session.user.roles,
        sessionPermissions: session.user.permissions
      },
      database: {
        userExists: !!userWithRoles,
        roleCount: userWithRoles?.userRoles?.length || 0,
        assignedRoles: userWithRoles?.userRoles?.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          isSystem: ur.role.isSystem,
          permissionCount: ur.role.permissions?.length || 0,
          permissions: ur.role.permissions
        })) || [],
        totalPermissions: dbPermissions.length,
        permissions: dbPermissions
      },
      debug: {
        permissionsMatch: JSON.stringify(session.user.permissions) === JSON.stringify(dbPermissions),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
