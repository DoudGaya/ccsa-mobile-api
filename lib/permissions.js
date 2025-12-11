import prisma from './prisma'

// Permission constants - Single source of truth
export const PERMISSIONS = {
  // Users
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  // Agents
  AGENTS_CREATE: 'agents.create',
  AGENTS_READ: 'agents.read',
  AGENTS_UPDATE: 'agents.update',
  AGENTS_DELETE: 'agents.delete',
  // Farmers
  FARMERS_CREATE: 'farmers.create',
  FARMERS_READ: 'farmers.read',
  FARMERS_UPDATE: 'farmers.update',
  FARMERS_DELETE: 'farmers.delete',
  FARMERS_EXPORT: 'farmers.export',
  
  // Farms
  FARMS_CREATE: 'farms.create',
  FARMS_READ: 'farms.read',
  FARMS_UPDATE: 'farms.update',
  FARMS_DELETE: 'farms.delete',
  // Clusters
  CLUSTERS_CREATE: 'clusters.create',
  CLUSTERS_READ: 'clusters.read',
  CLUSTERS_UPDATE: 'clusters.update',
  CLUSTERS_DELETE: 'clusters.delete',
  // Certificates
  CERTIFICATES_CREATE: 'certificates.create',
  CERTIFICATES_READ: 'certificates.read',
  CERTIFICATES_UPDATE: 'certificates.update',
  CERTIFICATES_DELETE: 'certificates.delete',
  // Roles
  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  
  // System Administration
  SYSTEM_MANAGE_PERMISSIONS: 'system.manage_permissions',
  SYSTEM_MANAGE_ROLES: 'system.manage_roles',
  SYSTEM_VIEW_LOGS: 'system.view_logs',
  SYSTEM_MANAGE_BACKUPS: 'system.manage_backups',
  SYSTEM_MANAGE_INTEGRATIONS: 'system.manage_integrations',
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

// Check if user has specific permission (async - fetches from DB)
export async function hasPermission(userId, permission) {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission)
}

// Check if user has specific permission (sync - uses already-loaded permissions array)
export function checkPermission(permissions, permission) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }
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
