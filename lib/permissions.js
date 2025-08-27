import prisma from './prisma'

// Permission constants
export const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  AGENTS_CREATE: 'agents.create',
  AGENTS_READ: 'agents.read',
  AGENTS_UPDATE: 'agents.update',
  AGENTS_DELETE: 'agents.delete',
  FARMERS_CREATE: 'farmers.create',
  FARMERS_READ: 'farmers.read',
  FARMERS_UPDATE: 'farmers.update',
  FARMERS_DELETE: 'farmers.delete',
  CLUSTERS_CREATE: 'clusters.create',
  CLUSTERS_READ: 'clusters.read',
  CLUSTERS_UPDATE: 'clusters.update',
  CLUSTERS_DELETE: 'clusters.delete',
  ANALYTICS_READ: 'analytics.read',
  SETTINGS_UPDATE: 'settings.update',
}

// Get user permissions from database
export async function getUserPermissions(userId) {
  try {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                permissions: true,
                isSystem: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!userWithRoles) {
      return []
    }

    // Collect all permissions from all assigned roles
    const permissions = new Set()
    
    userWithRoles.userRoles.forEach(userRole => {
      if (userRole.role.permissions && Array.isArray(userRole.role.permissions)) {
        userRole.role.permissions.forEach(permission => {
          permissions.add(permission)
        })
      }
    })

    return Array.from(permissions)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

// Check if user has specific permission
export async function hasPermission(userId, permission) {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission)
}

// Check if user has any of the specified permissions
export async function hasAnyPermission(userId, permissionList) {
  const permissions = await getUserPermissions(userId)
  return permissionList.some(permission => permissions.includes(permission))
}

// Check if user has all of the specified permissions
export async function hasAllPermissions(userId, permissionList) {
  const permissions = await getUserPermissions(userId)
  return permissionList.every(permission => permissions.includes(permission))
}

// Middleware function for API route protection
export function requirePermissions(requiredPermissions, options = {}) {
  const { requireAll = false } = options
  
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.session?.user?.id
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const checkFunction = requireAll ? hasAllPermissions : hasAnyPermission
      const hasAccess = await checkFunction(userId, requiredPermissions)
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions
        })
      }

      if (next) {
        return next()
      }
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

// HOC for page-level permission checking (server-side)
export function withPagePermissions(handler, requiredPermissions, options = {}) {
  return async (req, res) => {
    try {
      const { requireAll = false } = options
      const userId = req.user?.id || req.session?.user?.id
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const checkFunction = requireAll ? hasAllPermissions : hasAnyPermission
      const hasAccess = await checkFunction(userId, requiredPermissions)
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Insufficient permissions to access this page',
          required: requiredPermissions
        })
      }

      return handler(req, res)
    } catch (error) {
      console.error('Page permission check error:', error)
      return res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

export default {
  PERMISSIONS,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermissions,
  withPagePermissions
}
