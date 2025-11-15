# Dashboard Access Permission - Implementation Guide

## Overview
Currently, the dashboard is accessible to **any logged-in user**. This guide shows how to add a **dashboard access permission** that can be assigned per role, giving you granular control over who can access the dashboard.

## Current State
✅ Dashboard checks: User is logged in
❌ Dashboard doesn't check: User has permission to access dashboard

## Solution: Add Dashboard Permission System

### Step 1: Add Dashboard Permission to Permission Constants

**File:** `lib/permissions.js`

Add this permission to the `PERMISSIONS` object:

```javascript
export const PERMISSIONS = {
  // ... existing permissions ...
  DASHBOARD_READ: 'dashboard.read',  // ← ADD THIS LINE
  ANALYTICS_READ: 'analytics.read',
  SETTINGS_UPDATE: 'settings.update',
}
```

**What this does:**
- Defines `dashboard.read` as a permission that can be assigned to roles
- Makes it available throughout the app via `PERMISSIONS.DASHBOARD_READ`

### Step 2: Update Dashboard Page to Check Permission

**File:** `pages/dashboard.js`

Modify the dashboard component to check for the dashboard permission:

```javascript
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { PERMISSIONS, hasPermission } from '../lib/permissions'
import Layout from '../components/Layout'
// ... other imports ...

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // NEW: Check dashboard permission
    checkDashboardAccess()
  }, [session, status])

  // NEW: Check if user has dashboard access permission
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

  const fetchDashboardAnalytics = async () => {
    try {
      console.log('Fetching analytics...')
      const response = await fetch('/api/dashboard/analytics')
      console.log('Analytics response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Analytics data received:', data)
        setAnalytics(data)
      } else {
        console.error('Analytics API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // NEW: Show access denied message if user doesn't have permission
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

  // ... rest of dashboard code remains the same ...
}
```

### Step 3: Add Dashboard Permission to Roles

Through the **Admin Dashboard**, edit each role and add the `dashboard.read` permission:

1. Go to **Users** tab → **Roles** section
2. Click on a role to edit it
3. In the permissions list, find and check `dashboard.read`
4. Save changes
5. Repeat for all roles that need dashboard access

**Recommended Setup:**
| Role | Has Dashboard Access | Reason |
|------|----------------------|--------|
| Super Admin | ✅ Yes | Full system access |
| Admin | ✅ Yes | Needs dashboard for management |
| Manager | ✅ Yes | Monitors team performance |
| Agent | ❌ No | Works in mobile app |
| Viewer | ✅ Yes | Can view dashboard read-only |

### Step 4: Update All Permission Lists Across the App

**File:** `pages/api/roles/index.js`

Update the `getAllPermissions()` function to include the new permission:

```javascript
function getAllPermissions() {
  return [
    // Dashboard permissions
    'dashboard.read',  // ← ADD THIS LINE
    
    // User permissions
    'users.create', 'users.read', 'users.update', 'users.delete',
    
    // Agent permissions
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    
    // ... rest of permissions ...
  ]
}
```

### Step 5: Update System Roles Setup

**File:** `scripts/setup-system-roles.js`

When setting up system roles, add the dashboard permission:

```javascript
const systemRoles = [
  {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: [
      'dashboard.read',  // ← ADD THIS LINE
      'users.create', 'users.read', 'users.update', 'users.delete',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      // ... other permissions ...
    ]
  },
  {
    name: 'Admin',
    description: 'Administrative access',
    permissions: [
      'dashboard.read',  // ← ADD THIS LINE
      'users.read', 'users.update',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      // ... other permissions ...
    ]
  },
  {
    name: 'Manager',
    description: 'Manager access',
    permissions: [
      'dashboard.read',  // ← ADD THIS LINE
      'agents.read', 'agents.update',
      'farmers.create', 'farmers.read', 'farmers.update',
      // ... other permissions ...
    ]
  },
  {
    name: 'Agent',
    description: 'Agent access',
    permissions: [
      // Note: No dashboard.read for agents - they use mobile app
      'farmers.create', 'farmers.read', 'farmers.update',
      'clusters.read',
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'dashboard.read',  // ← ADD THIS LINE (can view but not edit)
      'agents.read',
      'farmers.read',
      'farms.read',
      'clusters.read',
      'analytics.read',
    ]
  }
]
```

### Step 6: Update Permission Provider Component

**File:** `components/PermissionProvider.js`

Update the role-based permission mappings:

```javascript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS LINE
    PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    // ... other permissions ...
  ],
  ADMIN: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS LINE
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.AGENTS_CREATE, PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE, PERMISSIONS.AGENTS_DELETE,
    // ... other permissions ...
  ],
  MANAGER: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS LINE
    PERMISSIONS.AGENTS_READ, PERMISSIONS.AGENTS_UPDATE,
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    // ... other permissions ...
  ],
  AGENT: [
    // No dashboard access for agents
    PERMISSIONS.FARMERS_CREATE, PERMISSIONS.FARMERS_READ, PERMISSIONS.FARMERS_UPDATE,
    PERMISSIONS.CLUSTERS_READ,
  ],
  USER: [
    PERMISSIONS.DASHBOARD_READ,  // ← ADD THIS LINE (optional, for viewers)
    PERMISSIONS.FARMERS_READ,
    PERMISSIONS.CLUSTERS_READ,
  ],
}
```

---

## Implementation Checklist

- [ ] **Step 1:** Add `DASHBOARD_READ: 'dashboard.read'` to `PERMISSIONS` in `lib/permissions.js`
  
- [ ] **Step 2:** Update `pages/dashboard.js` to check permission before showing dashboard
  - Import `hasPermission` and `PERMISSIONS`
  - Add `checkDashboardAccess()` function
  - Add access denied UI

- [ ] **Step 3:** Add dashboard permission to roles through admin UI
  - Edit Super Admin role: Add `dashboard.read`
  - Edit Admin role: Add `dashboard.read`
  - Edit Manager role: Add `dashboard.read`
  - Edit Viewer role: Add `dashboard.read`
  - Note: Agent role should NOT have `dashboard.read`

- [ ] **Step 4:** Update `getAllPermissions()` in `pages/api/roles/index.js`
  - Add `'dashboard.read'` to the permissions array

- [ ] **Step 5:** Update system roles in `scripts/setup-system-roles.js`
  - Add `dashboard.read` to Super Admin, Admin, Manager, Viewer roles
  - Do NOT add to Agent role

- [ ] **Step 6:** Update `ROLE_PERMISSIONS` in `components/PermissionProvider.js`
  - Add `PERMISSIONS.DASHBOARD_READ` to appropriate roles

- [ ] **Step 7:** Restart dev server and test
  ```bash
  rm -rf .next
  npm run dev
  ```

---

## Testing the Dashboard Permission

### Test Case 1: User WITH Dashboard Permission
1. Log in as an Admin user
2. Admin has `dashboard.read` permission
3. ✅ Dashboard should load normally
4. ✅ Analytics data should display

### Test Case 2: User WITHOUT Dashboard Permission
1. Create a custom role with NO `dashboard.read` permission
2. Assign this role to a test user
3. Log in as that user
4. ❌ Should see "Access Denied" message
5. ❌ Dashboard should NOT load

### Test Case 3: Agent Access Denied
1. Log in as an Agent user
2. Agent role has NO `dashboard.read` permission
3. ❌ Trying to visit `/dashboard` should show access denied
4. ✅ Agent can still access `/` or mobile app

### Test Case 4: Permission Update Takes Effect
1. Log in as a test user (currently no `dashboard.read`)
2. Try to access dashboard → Access Denied ✅
3. In another browser/window, admin adds `dashboard.read` to user's role
4. Refresh the test user's dashboard page
5. ✅ Should now have access (after refresh/re-login)

---

## Frontend Implementation Details

### What the permission check does:

```javascript
// In pages/dashboard.js
const access = await hasPermission(session.user.id, PERMISSIONS.DASHBOARD_READ)

// This function (from lib/permissions.js):
// 1. Fetches user from database
// 2. Gets all user's roles (via user_roles table)
// 3. Collects all permissions from those roles
// 4. Checks if 'dashboard.read' is in the permissions
// 5. Returns true/false
```

### Permission flow:
```
User Visits /dashboard
    ↓
Check if logged in? (existing check)
    ↓
NEW: Check if user has 'dashboard.read' permission
    ↓
If YES → Show dashboard
    ↓
If NO → Show "Access Denied" message
```

### User Roles → Permissions chain:
```
User (e.g., John)
  ↓
User_Roles (junction table)
  - userId: john-id
  - roleId: admin-role-id
  ↓
Roles (role definition)
  - id: admin-role-id
  - name: "Admin"
  - permissions: ["dashboard.read", "users.read", "users.update", ...]
  ↓
Collected: ["dashboard.read", "users.read", "users.update", ...]
  ↓
Check: Does user have "dashboard.read"? YES ✅
```

---

## API Endpoint Reference

### Get User's Permissions
```
GET /api/users/[userId]/roles
Response includes:
{
  "effectivePermissions": ["dashboard.read", "users.read", "analytics.read", ...]
}
```

### Check if User Has Permission (Frontend)
```javascript
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const hasDashboardAccess = await hasPermission(userId, PERMISSIONS.DASHBOARD_READ)
```

### Check Multiple Permissions
```javascript
// Check if user has ANY of these permissions
const { hasAnyPermission } = require('../lib/permissions')
const hasAccess = await hasAnyPermission(userId, [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.ANALYTICS_READ
])

// Check if user has ALL these permissions
const { hasAllPermissions } = require('../lib/permissions')
const hasFullAccess = await hasAllPermissions(userId, [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.ANALYTICS_READ
])
```

---

## Production Safety Notes

✅ **Safe to Deploy:**
- Only adds new permission, doesn't modify existing ones
- Backward compatible - new permission can be optional
- No data deletion or modification
- Uses existing permission system

✅ **Data Preservation:**
- Existing users keep their current roles
- Dashboard permission must be explicitly added to roles
- Existing dashboard access (for logged-in users) becomes explicit permission

⚠️ **Important Before Deployment:**
1. Add `dashboard.read` permission to Super Admin and Admin roles FIRST
2. Test with admin account to ensure admin access works
3. Then add to other roles as needed
4. Deploy with confidence - can always add/remove permission from roles

---

## Alternative: Simple Role-Based Approach (Optional)

If you prefer checking roles instead of permissions:

```javascript
// In pages/dashboard.js
const checkDashboardAccess = async () => {
  // Only allow these roles to access dashboard
  const allowedRoles = ['super_admin', 'admin', 'manager', 'viewer']
  
  if (!allowedRoles.includes(session.user.role)) {
    setHasAccess(false)
    setLoading(false)
    return
  }
  
  setHasAccess(true)
  fetchDashboardAnalytics()
}
```

**Pros:** Simple, quick
**Cons:** Less flexible, can't use custom roles for dashboard access

---

## Troubleshooting

### Issue: Dashboard still loads after permission removed
**Solution:** Browser caching - Clear cache and refresh, or restart dev server

### Issue: Permission not appearing in role creation form
**Solution:** 
1. Ensure `getAllPermissions()` in `/api/roles/index.js` includes `dashboard.read`
2. Restart dev server
3. Refresh the roles page

### Issue: User loses dashboard access after role update
**Solution:** This is correct behavior! 
- User needs to refresh or re-login to see new permissions
- New permissions are fetched from database on page load

### Issue: "Cannot find PERMISSIONS.DASHBOARD_READ"
**Solution:**
1. Ensure you added it to `PERMISSIONS` object in `lib/permissions.js`
2. Check for typos (should be exactly: `DASHBOARD_READ`)
3. Restart dev server for imports to update

---

## Next Steps

1. **Implement the 6 steps above** in order
2. **Test all 4 test cases** to verify it works
3. **Update role assignments** to grant/deny dashboard access per role
4. **Document for your team** which roles have dashboard access
5. **Consider monitoring** - log when users access dashboard (optional)

---

**Created:** November 15, 2025
**Status:** Ready to Implement
**Complexity:** Low (uses existing permission system)
**Time to Deploy:** ~15 minutes
