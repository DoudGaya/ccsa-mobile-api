# Dashboard Permission - Copy-Paste Code Ready

## 📋 Ready-to-Use Code Snippets

Copy each code block below and paste into the specified files.

---

## 1️⃣ lib/permissions.js

### LOCATE THIS:
```javascript
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
```

### REPLACE WITH THIS:
```javascript
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
  DASHBOARD_READ: 'dashboard.read',
  ANALYTICS_READ: 'analytics.read',
  SETTINGS_UPDATE: 'settings.update',
}
```

---

## 2️⃣ pages/dashboard.js

### ADD THIS TO IMPORTS (Top of file):
```javascript
import { PERMISSIONS, hasPermission } from '../lib/permissions'
```

### ADD THIS TO STATE (After other useState calls, around line 60):
```javascript
const [hasAccess, setHasAccess] = useState(false)
```

### REPLACE THIS useEffect:
```javascript
useEffect(() => {
  if (status === 'loading') return
  if (!session) {
    router.push('/auth/signin')
    return
  }
  
  fetchDashboardAnalytics()
}, [session, status])
```

### WITH THIS:
```javascript
useEffect(() => {
  if (status === 'loading') return
  if (!session) {
    router.push('/auth/signin')
    return
  }
  
  checkDashboardAccess()
}, [session, status])
```

### ADD THIS NEW FUNCTION (After the useEffect, before fetchDashboardAnalytics):
```javascript
const checkDashboardAccess = async () => {
  try {
    if (!session?.user?.id) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    const access = await hasPermission(session.user.id, PERMISSIONS.DASHBOARD_READ)
    setHasAccess(access)
    
    if (access) {
      fetchDashboardAnalytics()
    } else {
      setLoading(false)
    }
  } catch (error) {
    console.error('Error checking dashboard access:', error)
    setHasAccess(false)
    setLoading(false)
  }
}
```

### ADD THIS BEFORE THE MAIN RETURN STATEMENT (Before the "if (loading)" check):
```javascript
if (!loading && !hasAccess) {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            You don't have permission to access the dashboard.
          </p>
          <p className="text-gray-600 text-sm">
            Contact your administrator to request dashboard access.
          </p>
        </div>
      </div>
    </Layout>
  )
}
```

---

## 3️⃣ pages/api/roles/index.js

### LOCATE THIS FUNCTION:
```javascript
function getAllPermissions() {
  return [
    // User permissions
    'users.create', 'users.read', 'users.update', 'users.delete',
    
    // Agent permissions
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    
    // Farmer permissions
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
    
    // Farm permissions
    'farms.create', 'farms.read', 'farms.update', 'farms.delete',
    
    // Cluster permissions
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    
    // Certificate permissions
    'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
    
    // Role permissions (only admins should have these)
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    
    // Analytics permissions
    'analytics.read', 'analytics.create', 'analytics.update', 'analytics.delete',
    
    // Settings permissions
    'settings.read', 'settings.update'
  ]
}
```

### REPLACE WITH THIS:
```javascript
function getAllPermissions() {
  return [
    // Dashboard permissions
    'dashboard.read',
    
    // User permissions
    'users.create', 'users.read', 'users.update', 'users.delete',
    
    // Agent permissions
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    
    // Farmer permissions
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
    
    // Farm permissions
    'farms.create', 'farms.read', 'farms.update', 'farms.delete',
    
    // Cluster permissions
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    
    // Certificate permissions
    'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
    
    // Role permissions (only admins should have these)
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    
    // Analytics permissions
    'analytics.read', 'analytics.create', 'analytics.update', 'analytics.delete',
    
    // Settings permissions
    'settings.read', 'settings.update'
  ]
}
```

---

## 4️⃣ scripts/setup-system-roles.js

### FIND THE systemRoles ARRAY AND ADD dashboard.read TO EACH ROLE:

**Super Admin - ADD 'dashboard.read' to permissions array:**
```javascript
{
  name: 'Super Admin',
  description: 'Full system access',
  permissions: [
    'dashboard.read',
    'users.create', 'users.read', 'users.update', 'users.delete',
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
    'farms.create', 'farms.read', 'farms.update', 'farms.delete',
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    'analytics.read', 'settings.read', 'settings.update'
  ]
}
```

**Admin - ADD 'dashboard.read' to permissions array:**
```javascript
{
  name: 'Admin',
  description: 'Administrative access',
  permissions: [
    'dashboard.read',
    'users.read', 'users.update',
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
    'farms.create', 'farms.read', 'farms.update', 'farms.delete',
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    'certificates.create', 'certificates.read', 'certificates.update',
    'roles.read', 'roles.create',
    'analytics.read', 'settings.read'
  ]
}
```

**Manager - ADD 'dashboard.read' to permissions array:**
```javascript
{
  name: 'Manager',
  description: 'Manager access',
  permissions: [
    'dashboard.read',
    'agents.read', 'agents.update',
    'farmers.create', 'farmers.read', 'farmers.update',
    'farms.create', 'farms.read', 'farms.update',
    'clusters.read', 'clusters.update',
    'certificates.create', 'certificates.read',
    'analytics.read'
  ]
}
```

**Agent - DO NOT add 'dashboard.read':**
```javascript
{
  name: 'Agent',
  description: 'Agent access',
  permissions: [
    'farmers.create', 'farmers.read', 'farmers.update',
    'farms.create', 'farms.read', 'farms.update',
    'clusters.read'
  ]
}
```

**Viewer - ADD 'dashboard.read' to permissions array:**
```javascript
{
  name: 'Viewer',
  description: 'Read-only access',
  permissions: [
    'dashboard.read',
    'agents.read',
    'farmers.read',
    'farms.read',
    'clusters.read',
    'analytics.read'
  ]
}
```

---

## 5️⃣ components/PermissionProvider.js

### LOCATE THIS:
```javascript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.AGENTS_CREATE, PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE, PERMISSIONS.AGENTS_DELETE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE, PERMISSIONS.FARMERS_DELETE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE, PERMISSIONS.FARMS_DELETE,
    PERMISSIONS.CLUSTERS_CREATE, PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE, PERMISSIONS.CLUSTERS_DELETE,
    PERMISSIONS.ANALYTICS_READ, PERMISSIONS.CERTIFICATES_CREATE, PERMISSIONS.CERTIFICATES_READ, PERMISSIONS.CERTIFICATES_UPDATE, PERMISSIONS.CERTIFICATES_DELETE,
    PERMISSIONS.SETTINGS_UPDATE
  ],
  ADMIN: [
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.AGENTS_CREATE, PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE, PERMISSIONS.AGENTS_DELETE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE, PERMISSIONS.FARMERS_DELETE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE, PERMISSIONS.FARMS_DELETE,
    PERMISSIONS.CLUSTERS_CREATE, PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE, PERMISSIONS.CLUSTERS_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SETTINGS_UPDATE
  ],
  MANAGER: [
    PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE,
    PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE,
    PERMISSIONS.ANALYTICS_READ
  ],
  AGENT: [
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.CLUSTERS_READ
  ],
  USER: [
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.CLUSTERS_READ
  ]
}
```

### REPLACE WITH THIS:
```javascript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.AGENTS_CREATE, PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE, PERMISSIONS.AGENTS_DELETE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE, PERMISSIONS.FARMERS_DELETE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE, PERMISSIONS.FARMS_DELETE,
    PERMISSIONS.CLUSTERS_CREATE, PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE, PERMISSIONS.CLUSTERS_DELETE,
    PERMISSIONS.ANALYTICS_READ, PERMISSIONS.CERTIFICATES_CREATE, PERMISSIONS.CERTIFICATES_READ, PERMISSIONS.CERTIFICATES_UPDATE, PERMISSIONS.CERTIFICATES_DELETE,
    PERMISSIONS.SETTINGS_UPDATE
  ],
  ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.AGENTS_CREATE, PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE, PERMISSIONS.AGENTS_DELETE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE, PERMISSIONS.FARMERS_DELETE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE, PERMISSIONS.FARMS_DELETE,
    PERMISSIONS.CLUSTERS_CREATE, PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE, PERMISSIONS.CLUSTERS_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SETTINGS_UPDATE
  ],
  MANAGER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.FARMS_CREATE, PERMISSIONS.FARMS_READ, PERMISSIONS.FARMS_UPDATE,
    PERMISSIONS.CLUSTERS_READ, PERMISSIONS.CLUSTERS_UPDATE,
    PERMISSIONS.ANALYTICS_READ
  ],
  AGENT: [
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.CLUSTERS_READ
  ],
  USER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.CLUSTERS_READ
  ]
}
```

---

## ✅ Implementation Checklist

- [ ] Edit `lib/permissions.js` - Add DASHBOARD_READ
- [ ] Edit `pages/dashboard.js` - Add imports, state, function, UI
- [ ] Edit `pages/api/roles/index.js` - Add to getAllPermissions()
- [ ] Edit `scripts/setup-system-roles.js` - Add to system roles
- [ ] Edit `components/PermissionProvider.js` - Add to ROLE_PERMISSIONS

## 🚀 Deploy

```bash
rm -rf .next && npm run dev
```

## 🧪 Test

1. **Test 1:** Log in as Admin → Dashboard loads ✅
2. **Test 2:** Create user without dashboard.read → Access denied ✅
3. **Test 3:** Grant dashboard.read to user → Access allowed ✅
4. **Test 4:** Remove dashboard.read from user → Access denied ✅

---

**Status:** Copy-paste ready ✨
**Time:** ~10 minutes
