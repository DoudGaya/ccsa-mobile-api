import { useSession } from 'next-auth/react'
import { useState, useEffect, createContext, useContext } from 'react'

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

// Role-based default permissions - matches ROLE.md specifications
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // Full access to everything
  admin: [
    // Users - Full CRUD
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    // Agents - Full CRUD
    PERMISSIONS.AGENTS_CREATE,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.AGENTS_UPDATE,
    PERMISSIONS.AGENTS_DELETE,
    // Farmers - Full CRUD + Export
    PERMISSIONS.FARMERS_CREATE,
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.FARMERS_DELETE,
    PERMISSIONS.FARMERS_EXPORT,
    // Farms - Full CRUD + Export/Import
    PERMISSIONS.FARMS_CREATE,
    PERMISSIONS.FARMS_READ,
    PERMISSIONS.FARMS_UPDATE,
    PERMISSIONS.FARMS_DELETE,
    PERMISSIONS.FARMS_EXPORT,
    PERMISSIONS.FARMS_IMPORT,
    // GIS - Full Access
    PERMISSIONS.GIS_VIEW,
    PERMISSIONS.GIS_EDIT,
    PERMISSIONS.GIS_EXPORT,
    PERMISSIONS.GIS_ANALYZE,
    // Clusters - Full CRUD
    PERMISSIONS.CLUSTERS_CREATE,
    PERMISSIONS.CLUSTERS_READ,
    PERMISSIONS.CLUSTERS_UPDATE,
    PERMISSIONS.CLUSTERS_DELETE,
    // Certificates - Full CRUD
    PERMISSIONS.CERTIFICATES_CREATE,
    PERMISSIONS.CERTIFICATES_READ,
    PERMISSIONS.CERTIFICATES_UPDATE,
    PERMISSIONS.CERTIFICATES_DELETE,
    // Analytics - Read only
    PERMISSIONS.ANALYTICS_READ,
    // Settings - Read and Update
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    // System - No system permissions for admin (only super_admin)
  ],
  manager: [
    // Agents - Read only
    PERMISSIONS.AGENTS_READ,
    // Farmers - Read and Update
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.FARMERS_UPDATE,
    // Farms - Read and Update
    PERMISSIONS.FARMS_READ,
    PERMISSIONS.FARMS_UPDATE,
    // GIS - View only
    PERMISSIONS.GIS_VIEW,
    // Clusters - Read and Update
    PERMISSIONS.CLUSTERS_READ,
    PERMISSIONS.CLUSTERS_UPDATE,
    // Analytics - Read only
    PERMISSIONS.ANALYTICS_READ,
  ],
  agent: [
    // Farmers - Create, Read, Update
    PERMISSIONS.FARMERS_CREATE,
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.FARMERS_UPDATE,
    // Farms - Create, Read, Update
    PERMISSIONS.FARMS_CREATE,
    PERMISSIONS.FARMS_READ,
    PERMISSIONS.FARMS_UPDATE,
    // GIS - View only
    PERMISSIONS.GIS_VIEW,
    // Clusters - Read only
    PERMISSIONS.CLUSTERS_READ,
  ],
  viewer: [
    // Farmers - Read only
    PERMISSIONS.FARMERS_READ,
    // Farms - Read only
    PERMISSIONS.FARMS_READ,
    // GIS - View only
    PERMISSIONS.GIS_VIEW,
    // Clusters - Read only
    PERMISSIONS.CLUSTERS_READ,
    // Analytics - Read only
    PERMISSIONS.ANALYTICS_READ,
  ],
}

// Permission Context
const PermissionContext = createContext({
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  role: null,
  loading: true
})

// Permission Provider Component
export function PermissionProvider({ children }) {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      // Use permissions directly from session (fetched from database)
      const sessionPermissions = session.user.permissions || []
      
      // Fallback to role-based permissions if no database permissions
      if (sessionPermissions.length === 0) {
        const rolePermissions = ROLE_PERMISSIONS[session.user.role] || []
        setPermissions(rolePermissions)
      } else {
        setPermissions(sessionPermissions)
      }
      
      console.log('PermissionProvider - User permissions loaded:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        databaseRoles: session.user.roles,
        permissions: sessionPermissions.length > 0 ? sessionPermissions : ROLE_PERMISSIONS[session.user.role] || [],
        permissionCount: sessionPermissions.length > 0 ? sessionPermissions.length : (ROLE_PERMISSIONS[session.user.role] || []).length
      })
    } else {
      setPermissions([])
    }
    
    setLoading(false)
  }, [session, status])

  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission))
  }

  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => permissions.includes(permission))
  }

  const value = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: session?.user?.role || null,
    loading: loading || status === 'loading'
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// Hook to use permissions
export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

// Component to conditionally render based on permissions
export function PermissionGate({ 
  children, 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null,
  role,
  roles 
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, role: userRole, permissions: userPermissions } = usePermissions()

  // Debug logging for navigation issues
  const debugInfo = {
    userRole,
    userPermissions,
    requiredPermission: permission,
    requiredPermissions: permissions,
    requiredRole: role,
    requiredRoles: roles,
    hasPermissionCheck: permission ? hasPermission(permission) : 'N/A',
    hasPermissionsCheck: permissions ? (requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)) : 'N/A'
  }
  
  console.log('PermissionGate check:', debugInfo)

  // Check role-based access
  if (role && userRole !== role) {
    console.log(`PermissionGate - Role check failed: user role "${userRole}" !== required role "${role}"`)
    return fallback
  }

  if (roles && !roles.includes(userRole)) {
    console.log(`PermissionGate - Roles check failed: user role "${userRole}" not in required roles [${roles.join(', ')}]`)
    return fallback
  }

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    console.log(`PermissionGate - Permission check failed: user doesn't have "${permission}"`)
    return fallback
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      console.log(`PermissionGate - Permissions check failed: user doesn't have ${requireAll ? 'all' : 'any'} of [${permissions.join(', ')}]`)
      return fallback
    }
  } else if (permissions && permissions.length === 0) {
    // Empty permissions array means no specific permission required - allow access
    console.log('PermissionGate - No specific permissions required, access granted')
  }

  console.log('PermissionGate - Access granted')
  return children
}

// HOC for page-level permission checking
export function withPermissions(WrappedComponent, requiredPermissions = [], options = {}) {
  return function PermissionWrappedComponent(props) {
    const { hasAnyPermission, hasAllPermissions, loading } = usePermissions()
    const { requireAll = false, fallback = <div>Access denied</div> } = options

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)

    if (!hasAccess) {
      return fallback
    }

    return <WrappedComponent {...props} />
  }
}

// Utility function for API route permission checking
export function checkPermissions(userPermissions, userRole, requiredPermissions, requireAll = false) {
  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  
  // Combine all permissions
  const allPermissions = [...new Set([...rolePermissions, ...(userPermissions || [])])]
  
  if (requireAll) {
    return requiredPermissions.every(permission => allPermissions.includes(permission))
  } else {
    return requiredPermissions.some(permission => allPermissions.includes(permission))
  }
}

export default PermissionProvider
