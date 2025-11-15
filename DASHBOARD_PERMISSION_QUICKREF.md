# Dashboard Permission - Quick Reference & Code Changes

## Files to Modify (5 total)

### 1️⃣ lib/permissions.js
**Location:** Lines 1-20 (in PERMISSIONS object)

Add this line:
```javascript
DASHBOARD_READ: 'dashboard.read',
```

**Full PERMISSIONS object:**
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
  DASHBOARD_READ: 'dashboard.read',  // ← ADD THIS
  ANALYTICS_READ: 'analytics.read',
  SETTINGS_UPDATE: 'settings.update',
}
```

---

### 2️⃣ pages/dashboard.js
**Location:** Top imports section + permission check

**Add to imports:**
```javascript
import { PERMISSIONS, hasPermission } from '../lib/permissions'
```

**Add to state (after existing useState calls):**
```javascript
const [hasAccess, setHasAccess] = useState(false)
```

**Replace the useEffect (around line 65-80) with:**
```javascript
useEffect(() => {
  if (status === 'loading') return
  if (!session) {
    router.push('/auth/signin')
    return
  }
  checkDashboardAccess()  // NEW: Check permission first
}, [session, status])
```

**Add this new function (after useEffect, before fetchDashboardAnalytics):**
```javascript
// Check if user has dashboard access permission
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

**Add this return statement at start of JSX (before existing JSX, around line 90):**
```javascript
// Show access denied if no permission
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

### 3️⃣ pages/api/roles/index.js
**Location:** In `getAllPermissions()` function (around line 150)

Add this to the array:
```javascript
'dashboard.read',
```

**Full function should start with:**
```javascript
function getAllPermissions() {
  return [
    // Dashboard permissions
    'dashboard.read',  // ← ADD THIS LINE
    
    // User permissions
    'users.create', 'users.read', 'users.update', 'users.delete',
    
    // Agent permissions
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    
    // ... rest continues ...
  ]
}
```

---

### 4️⃣ scripts/setup-system-roles.js
**Location:** Inside the systemRoles array

For each role that should have dashboard access, add `'dashboard.read'` to permissions:

**Example - Super Admin:**
```javascript
{
  name: 'Super Admin',
  description: 'Full system access',
  permissions: [
    'dashboard.read',  // ← ADD THIS
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

**Example - Admin:**
```javascript
{
  name: 'Admin',
  description: 'Administrative access',
  permissions: [
    'dashboard.read',  // ← ADD THIS
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

**Example - Manager:**
```javascript
{
  name: 'Manager',
  description: 'Manager access',
  permissions: [
    'dashboard.read',  // ← ADD THIS
    'agents.read', 'agents.update',
    'farmers.create', 'farmers.read', 'farmers.update',
    'farms.create', 'farms.read', 'farms.update',
    'clusters.read', 'clusters.update',
    'certificates.create', 'certificates.read',
    'analytics.read'
  ]
}
```

**Example - Agent (NO dashboard access):**
```javascript
{
  name: 'Agent',
  description: 'Agent access',
  permissions: [
    // Note: NO 'dashboard.read' - agents use mobile app only
    'farmers.create', 'farmers.read', 'farmers.update',
    'farms.create', 'farms.read', 'farms.update',
    'clusters.read'
  ]
}
```

**Example - Viewer (WITH dashboard access):**
```javascript
{
  name: 'Viewer',
  description: 'Read-only access',
  permissions: [
    'dashboard.read',  // ← ADD THIS
    'agents.read',
    'farmers.read',
    'farms.read',
    'clusters.read',
    'analytics.read'
  ]
}
```

---

### 5️⃣ components/PermissionProvider.js
**Location:** In ROLE_PERMISSIONS object (around line 50-70)

Add `PERMISSIONS.DASHBOARD_READ` to these roles:

```javascript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    // ... rest of permissions ...
  ],
  ADMIN: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    // ... rest of permissions ...
  ],
  MANAGER: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.AGENTS_UPDATE,
    // ... rest of permissions ...
  ],
  AGENT: [
    // NO DASHBOARD_READ - agents don't have dashboard access
    PERMISSIONS.FARMERS_CREATE,
    PERMISSIONS.FARMERS_READ,
    // ... rest of permissions ...
  ],
  USER: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS (optional, for viewers)
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.CLUSTERS_READ,
  ],
}
```

---

## Summary of Changes

| File | What Changed | Lines |
|------|--------------|-------|
| `lib/permissions.js` | Add `DASHBOARD_READ: 'dashboard.read'` | 1 line added |
| `pages/dashboard.js` | Import permission, add check, show access denied UI | ~50 lines modified |
| `pages/api/roles/index.js` | Add `'dashboard.read'` to permissions list | 1 line added |
| `scripts/setup-system-roles.js` | Add `'dashboard.read'` to role permissions | 5 lines added |
| `components/PermissionProvider.js` | Add `DASHBOARD_READ` to role mappings | 5 lines added |

---

## Quick Deploy Steps

1. **Edit 5 files** above as specified
2. **Restart dev server:**
   ```bash
   rm -rf .next && npm run dev
   ```
3. **Test with admin account** → Dashboard should load
4. **Test with restricted user** → Should see "Access Denied"
5. **Add permission to roles** via Admin UI Users → Roles section

---

## Permission String Reference

When adding to roles, use exactly this string:
```
dashboard.read
```

Or use the constant:
```javascript
PERMISSIONS.DASHBOARD_READ  // = 'dashboard.read'
```

---

## Testing URLs

- **With Permission:** `/dashboard` → Loads dashboard
- **Without Permission:** `/dashboard` → Shows "Access Denied"
- **Admin Page:** `/users` → Can edit roles and add `dashboard.read` permission

---

## Rollback (If Needed)

If you need to revert:
1. Remove all `dashboard.read` entries from files above
2. Restart dev server
3. All users will have dashboard access again

---

**Time to Implement:** ~10 minutes
**Risk Level:** Very Low (uses existing permission system)
**Testing Required:** ~5 minutes (4 test cases)
