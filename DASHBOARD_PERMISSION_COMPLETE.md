# Dashboard Access Permission System - Complete Guide

## Quick Answer

To allow users to access the dashboard through permissions, you need to:

1. **Add a new permission** called `dashboard.read` to your permission system
2. **Check this permission** on the dashboard page before showing content
3. **Assign this permission** to roles that should have dashboard access
4. **Users gain access** through their role assignments

---

## Current vs. New Behavior

### Current (❌ No Permission Control)
```
User Logs In
    ↓
Is Session Valid? → YES
    ↓
Show Dashboard (automatic for all logged-in users)
```

### New (✅ With Permission Control)
```
User Logs In
    ↓
Is Session Valid? → YES
    ↓
Does User Have 'dashboard.read' Permission? → Check database
    ↓
IF YES → Show Dashboard
IF NO  → Show "Access Denied" Message
```

---

## How It Works - Behind the Scenes

```
User (e.g., john@company.com)
    ↓
Gets assigned a Role (e.g., "Manager")
    ↓
Role has Permissions Array:
    ['dashboard.read', 'agents.read', 'agents.update', 'farms.read', ...]
    ↓
When User visits /dashboard:
    1. Fetch user from database
    2. Get their assigned roles
    3. Collect ALL permissions from all their roles
    4. Check: Is 'dashboard.read' in permissions? YES/NO
    ↓
YES → Load dashboard with analytics
NO  → Show access denied message
```

---

## Implementation - 3 Simple Steps

### Step 1: Add Permission Definition (1 file, 1 line)
**File:** `lib/permissions.js`
```javascript
DASHBOARD_READ: 'dashboard.read',
```

### Step 2: Check Permission on Dashboard (1 file, 40 lines)
**File:** `pages/dashboard.js`
```javascript
// Check if user has dashboard.read permission before showing dashboard
const hasAccess = await hasPermission(session.user.id, PERMISSIONS.DASHBOARD_READ)
```

### Step 3: Assign Permission to Roles (through Admin UI)
**Via Dashboard:** Users → Roles Tab → Edit Role → Check "dashboard.read"

---

## Step-by-Step Implementation

### 1️⃣ Define the Permission

**File:** `lib/permissions.js` (Line ~20)

Add this line to the PERMISSIONS object:
```javascript
DASHBOARD_READ: 'dashboard.read',
```

### 2️⃣ Protect the Dashboard Page

**File:** `pages/dashboard.js` (Lines ~1-100)

Add at top:
```javascript
import { PERMISSIONS, hasPermission } from '../lib/permissions'
```

Add state:
```javascript
const [hasAccess, setHasAccess] = useState(false)
```

Add permission check function:
```javascript
const checkDashboardAccess = async () => {
  try {
    const access = await hasPermission(session.user.id, PERMISSIONS.DASHBOARD_READ)
    setHasAccess(access)
    
    if (access) {
      fetchDashboardAnalytics() // Show dashboard
    }
  } catch (error) {
    setHasAccess(false)
  }
}
```

Call it in useEffect:
```javascript
useEffect(() => {
  if (status === 'loading') return
  if (!session) {
    router.push('/auth/signin')
    return
  }
  checkDashboardAccess() // NEW
}, [session, status])
```

Add access denied UI:
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
        </div>
      </div>
    </Layout>
  )
}
```

### 3️⃣ Update Permission List Files

**File:** `pages/api/roles/index.js` (In getAllPermissions function)
```javascript
'dashboard.read',
```

**File:** `scripts/setup-system-roles.js` (In each role's permissions array)
```javascript
'dashboard.read',
```

**File:** `components/PermissionProvider.js` (In ROLE_PERMISSIONS object)
```javascript
PERMISSIONS.DASHBOARD_READ,
```

### 4️⃣ Assign Permission to Roles

**Via Admin UI:**
1. Log in as Super Admin
2. Go to Users tab
3. Click on Roles subtab
4. Edit each role
5. Check the "dashboard.read" permission
6. Save

**Which roles should have dashboard.read:**
- ✅ Super Admin
- ✅ Admin
- ✅ Manager
- ❌ Agent (uses mobile app)
- ✅ Viewer (read-only)

### 5️⃣ Restart and Test

```bash
rm -rf .next && npm run dev
```

Test:
- Log in as Admin → Dashboard loads ✅
- Create user without dashboard.read → Access denied ✅

---

## Permission Assignment Flow

### How Users Get Dashboard Access

```
Admin Creates User
    ↓
Assigns User to Role (e.g., "Manager")
    ↓
Role has Permissions including "dashboard.read"
    ↓
User logs in to dashboard
    ↓
System checks: Does user have "dashboard.read"? YES
    ↓
Dashboard loads successfully
```

### How Users Lose Dashboard Access

```
Admin Edits User's Role
    ↓
Removes "dashboard.read" from the role
    ↓
User logs in to dashboard
    ↓
System checks: Does user have "dashboard.read"? NO
    ↓
Dashboard shows "Access Denied"
```

---

## Complete Permission System Overview

Your permission system now has these categories:

```
USERS_*           - Create, Read, Update, Delete users
AGENTS_*          - Create, Read, Update, Delete agents
FARMERS_*         - Create, Read, Update, Delete farmers
FARMS_*           - Create, Read, Update, Delete farms
CLUSTERS_*        - Create, Read, Update, Delete clusters
CERTIFICATES_*    - Certificate management
ROLES_*           - Create, Read, Update, Delete roles
DASHBOARD_READ    - Access dashboard (NEW)
ANALYTICS_READ    - View analytics
SETTINGS_UPDATE   - Update system settings
```

---

## Use Cases - Who Gets Dashboard Access

### Use Case 1: Only Admins Can See Dashboard
```javascript
// Grant 'dashboard.read' ONLY to:
// - Super Admin role
// - Admin role

// Deny to:
// - Agent role
// - Viewer role
// - Manager role
```

### Use Case 2: Managers and Admins Can See Dashboard
```javascript
// Grant 'dashboard.read' to:
// - Super Admin role
// - Admin role
// - Manager role

// Deny to:
// - Agent role (mobile only)
```

### Use Case 3: Everyone Can See Dashboard
```javascript
// Grant 'dashboard.read' to:
// - Super Admin role
// - Admin role
// - Manager role
// - Agent role
// - Viewer role
```

---

## Testing Scenarios

### Scenario 1: Admin Accessing Dashboard
1. Log in as admin@company.com (Super Admin role)
2. Super Admin role HAS 'dashboard.read'
3. Result: ✅ Dashboard loads with analytics

### Scenario 2: Agent Accessing Dashboard
1. Log in as agent@company.com (Agent role)
2. Agent role does NOT have 'dashboard.read'
3. Result: ❌ "Access Denied" message shown

### Scenario 3: Dynamic Permission Grant
1. User currently has no 'dashboard.read'
2. Result: ❌ Access Denied
3. Admin adds 'dashboard.read' to user's role
4. User refreshes or re-logs in
5. Result: ✅ Dashboard now works

### Scenario 4: Custom Role with Dashboard Access
1. Admin creates new role "Team Lead"
2. Assigns 'dashboard.read' permission
3. Assigns "Team Lead" role to a user
4. User logs in
5. Result: ✅ Dashboard accessible to Team Lead

---

## Files Modified Summary

| File | Change | Lines |
|------|--------|-------|
| lib/permissions.js | Add DASHBOARD_READ constant | +1 |
| pages/dashboard.js | Add permission check | +50 |
| pages/api/roles/index.js | Add to permissions list | +1 |
| scripts/setup-system-roles.js | Add to system roles | +5 |
| components/PermissionProvider.js | Add to role mappings | +5 |

**Total:** 5 files modified, ~60 lines added

---

## API Reference

### Check Dashboard Permission (Frontend)
```javascript
import { hasPermission, PERMISSIONS } from '../lib/permissions'

const hasDashboardAccess = await hasPermission(
  userId, 
  PERMISSIONS.DASHBOARD_READ
)

if (hasDashboardAccess) {
  // Show dashboard
} else {
  // Show access denied
}
```

### Check Multiple Permissions
```javascript
import { hasAnyPermission, hasAllPermissions } from '../lib/permissions'

// Check if user has EITHER permission
const canAccessDashboardOrAnalytics = await hasAnyPermission(userId, [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.ANALYTICS_READ
])

// Check if user has BOTH permissions
const hasFullAccess = await hasAllPermissions(userId, [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.ANALYTICS_READ
])
```

### Get User's Effective Permissions
```javascript
GET /api/users/[userId]/roles

Response:
{
  "effectivePermissions": [
    "dashboard.read",
    "users.read",
    "agents.read",
    "farmers.read",
    "farms.read",
    ...
  ]
}
```

---

## Production Deployment Checklist

- [ ] Add DASHBOARD_READ to lib/permissions.js
- [ ] Update pages/dashboard.js with permission check
- [ ] Update pages/api/roles/index.js getAllPermissions()
- [ ] Update scripts/setup-system-roles.js with dashboard.read
- [ ] Update components/PermissionProvider.js ROLE_PERMISSIONS
- [ ] Restart dev server (rm -rf .next && npm run dev)
- [ ] Test: Admin can access dashboard
- [ ] Test: Non-admin sees access denied
- [ ] Via Admin UI: Assign dashboard.read to appropriate roles
- [ ] Verify: Permissions take effect immediately for new sessions
- [ ] Test edge cases: Multiple roles, role removal, etc.

---

## Troubleshooting

### Q: Permission doesn't appear in role creation form
**A:** Make sure getAllPermissions() in /api/roles/index.js includes 'dashboard.read', then restart dev server

### Q: User can still access dashboard after removing permission
**A:** Normal - permissions are checked on page load. User needs to refresh or re-login

### Q: "Cannot find PERMISSIONS.DASHBOARD_READ" error
**A:** Check that you added `DASHBOARD_READ: 'dashboard.read'` to PERMISSIONS object in lib/permissions.js

### Q: Dashboard permission not working for everyone
**A:** Verify that:
1. Permission is defined in lib/permissions.js
2. Dashboard page is checking for it
3. Roles have the permission assigned
4. Dev server was restarted

---

## Summary

✅ **What This Gives You:**
- Control over who can access dashboard
- Fine-grained permission assignment via roles
- Easy to add/remove dashboard access per role
- Consistent with your existing permission system

✅ **How It Works:**
- User has roles
- Roles have permissions
- Dashboard checks for 'dashboard.read' permission
- If user's roles include this permission → Access granted
- If not → Access denied

✅ **Time to Implement:**
- ~10 minutes to add code
- ~5 minutes to test
- ~5 minutes to assign permissions

---

**Documentation Complete**
**Status:** Ready to Implement
**Difficulty:** Easy (uses existing permission framework)
**Risk Level:** Very Low
