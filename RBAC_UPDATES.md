# RBAC Permission Updates - December 9, 2025

## Changes Implemented

### 1. Permission Constants Added ✅

**Farms Permissions (Complete CRUD + Export/Import)**
- `farms.create` - Create farm records
- `farms.read` - View farms
- `farms.update` - Edit farm details
- `farms.delete` - Remove farms
- `farms.export` - Export farms data (CSV, Excel)
- `farms.import` - Import bulk farm data

**Farmers Export Permission**
- `farmers.export` - Export farmers data (CSV, Excel)

**GIS Permissions**
- `gis.view` - View GIS maps
- `gis.edit` - Edit farm boundaries/coordinates
- `gis.export` - Export GIS data (GeoJSON, KML)
- `gis.analyze` - Access GIS analytics

**System Administration Permissions (Super Admin Only)**
- `system.manage_permissions` - Assign/revoke permissions to users
- `system.manage_roles` - Full role administration
- `system.view_logs` - Access system audit logs
- `system.manage_backups` - Database backup/restore
- `system.manage_integrations` - Third-party API configurations

### 2. Role Modal Enhancements ✅

**System Permission Filtering**
- System permissions (system.*) only visible to users with `system.manage_permissions`
- Non-super admins cannot see or assign system-level permissions
- Visual indicators show "Super Admin Only" badge on System Administration category
- Individual system permissions marked with red "(Super Admin)" label

**Complete Permission List in Modal**
All permission categories now displayed:
- Users (create, read, update, delete)
- Agents (create, read, update, delete)
- Farmers (create, read, update, delete, export)
- Farms (create, read, update, delete, export, import)
- GIS & Mapping (view, edit, export, analyze)
- Clusters (create, read, update, delete)
- Certificates (create, read, update, delete)
- Roles (create, read, update, delete)
- Analytics (read)
- Settings (read, update)
- System Administration (manage_permissions, manage_roles, view_logs, manage_backups, manage_integrations)

### 3. UI Permission Gates ✅

**Farmers Table (`pages/farmers/index.js`)**
- ✅ Edit button: Requires `farmers.update` permission
- ✅ Export button: Requires `farmers.export` permission
- View, Certificate, and Farms links: Always visible (read-only)

**Farms Table (`pages/farms.js`)**
- ✅ Edit button: Requires `farms.update` permission
- ✅ Delete button: Requires `farms.delete` permission
- ✅ Export button: Requires `farms.export` permission
- View link: Always visible (read-only)

### 4. Files Modified

**Permission Constants**
- `lib/permissions.js` - Added FARMERS_EXPORT, FARMS_*, GIS_*, SYSTEM_*
- `components/PermissionProvider.js` - Synchronized all new constants

**Role Permissions**
- `components/PermissionProvider.js` - Updated ROLE_PERMISSIONS map:
  - Super Admin: All 43 permissions
  - Admin: 34 permissions (includes farmers.export, farms.export/import, full GIS)
  - Manager: 9 permissions (includes gis.view)
  - Agent: 8 permissions (includes gis.view)
  - Viewer: 5 permissions (includes gis.view)

**UI Components**
- `pages/users.js` - Enhanced role creation modal with system permission filtering
- `pages/farmers/index.js` - Added PermissionGate to export button
- `pages/farms.js` - Added PermissionGate to edit, delete, and export buttons

**Bootstrap Script**
- `scripts/setup-system-roles.js` - Updated with all new permissions

### 5. Permission Matrix

| Role | Farmers Export | Farms CRUD | Farms Export/Import | GIS Full | System Admin |
|------|---------------|------------|---------------------|----------|--------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manager | ❌ | Read/Update | ❌ | View Only | ❌ |
| Agent | ❌ | Create/Read/Update | ❌ | View Only | ❌ |
| Viewer | ❌ | Read Only | ❌ | View Only | ❌ |

### 6. Testing Checklist

**Role Creation Modal**
- [ ] Super Admin sees System Administration permissions
- [ ] Admin/Manager/Agent/Viewer cannot see System Administration category
- [ ] All permission categories display correctly
- [ ] Farms and GIS permissions appear in modal
- [ ] Permission checkboxes work correctly

**Farmers Page**
- [ ] Edit button hidden for users without `farmers.update`
- [ ] Export button hidden for users without `farmers.export`
- [ ] View, Certificate, Farms links always visible

**Farms Page**
- [ ] Edit button hidden for users without `farms.update`
- [ ] Delete button hidden for users without `farms.delete`
- [ ] Export button hidden for users without `farms.export`
- [ ] View link always visible

**Permission Behavior**
- [ ] Super Admin can assign system permissions to other users
- [ ] Admin cannot assign system permissions (option not visible)
- [ ] Managers/Agents/Viewers see appropriate subset of permissions

### 7. Database Update Required

To apply the new permissions to the database roles:

```bash
cd /c/projects/cosmopolitan/ccsa-deploy/ccsa-mobile-api
node scripts/setup-system-roles.js
```

Expected output:
```
✅ Super Admin: 43 permissions
✅ Admin: 34 permissions  
✅ Manager: 9 permissions
✅ Agent: 8 permissions
✅ Viewer: 5 permissions
✅ admin@cosmopolitan.edu.ng granted Super Admin role
```

### 8. Next Steps

1. **Run Bootstrap Script** - Execute `node scripts/setup-system-roles.js` to update database
2. **Test Role Creation** - Log in as super admin and create a test role with system permissions
3. **Test Permission Gates** - Log in as different roles and verify buttons show/hide correctly
4. **Create /roles page** - Dedicated page for role management (currently 404)
5. **Implement Export APIs** - Add backend endpoints for `farmers.export` and `farms.export` permissions

---

**Summary**: Complete RBAC implementation with 43 total permissions, system-level permission management for super admins, and comprehensive UI permission gates on farmers and farms tables. All permission-sensitive actions now properly protected based on user roles.
