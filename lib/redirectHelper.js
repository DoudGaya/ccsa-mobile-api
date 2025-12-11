/**
 * Helper function to find the first available route a user has permission to access
 */

// Navigation routes with permission requirements - must match Layout.js
const navigationRoutes = [
  { name: 'Dashboard', href: '/dashboard', requiredPermission: 'dashboard.access' },
  { name: 'Farmers', href: '/farmers', requiredPermission: 'farmers.read' },
  { name: 'Agents', href: '/agents', requiredPermission: 'agents.read' },
  { name: 'Clusters', href: '/clusters', requiredPermission: 'clusters.read' },
  { name: 'Farms', href: '/farms', requiredPermission: 'farms.read' },
  { name: 'Users', href: '/users', requiredPermission: 'users.read' },
  { name: 'Roles', href: '/roles', requiredPermission: 'roles.read' },
  { name: 'GIS', href: '/gis-map-google', requiredPermission: 'gis.view' },
  { name: 'Settings', href: '/settings', requiredPermission: 'settings.read' },
]

/**
 * Find the first route that the user has permission to access
 * @param {Function} hasPermission - Function to check if user has a permission
 * @returns {string} - The first available route path, or '/auth/signin' if none found
 */
export function getFirstAvailableRoute(hasPermission) {
  if (typeof hasPermission !== 'function') {
    console.warn('getFirstAvailableRoute: hasPermission is not a function')
    return '/auth/signin'
  }

  for (const route of navigationRoutes) {
    if (hasPermission(route.requiredPermission)) {
      return route.href
    }
  }

  // If no permissions found, redirect to signin
  return '/auth/signin?error=no_permissions'
}

/**
 * Get all available routes for a user
 * @param {Function} hasPermission - Function to check if user has a permission
 * @returns {Array} - Array of routes the user has access to
 */
export function getAvailableRoutes(hasPermission) {
  if (typeof hasPermission !== 'function') {
    return []
  }

  return navigationRoutes.filter(route => hasPermission(route.requiredPermission))
}
