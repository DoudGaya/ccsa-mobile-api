# Role-Based Access Control (RBAC) Implementation Guide

## Objective
Redesign and implement robust Role-Based Access Control (RBAC) and fine-grained permissions across the CCSA FIMS web app so that:
- Only authenticated users with authorized system roles/permissions can access the web UI.
- Users with "system permissions" can access specific tables (entities) and operations (CRUD) based on assigned permissions.
- Navigation menus render only items the user is authorized to see.
- Page routes and API endpoints enforce authorization consistently.

## Context
- **Existing files**: 
  - `components/PermissionProvider.js`
  - `lib/permissions.js`
  - `pages/api/users/[id]/roles.js`
  - `scripts/setup-system-roles.js`
  - `scripts/grant-admin-permissions.js`
  - `components/Layout.js`
  - `pages/users.js`
- **User Roles**: Users have a system role (`user.role`: `admin`, `super_admin`, `manager`, `agent`, `viewer`) and may have multiple assigned custom roles via `user_roles` → `roles` (`roles.permissions[]`).
- **Session**: Provided by NextAuth; `session.user` should include: `id`, `email`, `role`, `roles[]`, `permissions[]`.

## Requirements

### 1) Canonical Permissions & System Role Map
- Define all permission strings centrally. Use `PermissionProvider.Permissions` or `lib/permissions.Permissions` as the single source of truth.
- Finalize `SYSTEM_ROLES` permission map (`super_admin`, `admin`, `manager`, `agent`, `viewer`) ensuring parity with `scripts/setup-system-roles.js` and `pages/api/users/[id]/roles.js:getSystemRolePermissions`.
- Ensure permissions cover entities and operations:
  - `users.(create|read|update|delete)`
  - `agents.(create|read|update|delete)`
  - `farmers.(create|read|update|delete)`
  - `farms.(create|read|update|delete)`
  - `clusters.(create|read|update|delete)`
  - `certificates.(create|read|update|delete)`
  - `roles.(create|read|update|delete)`
  - `analytics.read`
  - `settings.(read|update)`

### 2) Session Hydration with Effective Permissions
- On sign-in/session fetch, merge system role permissions + custom roles permissions (union) as `effectivePermissions`, attach to `session.user.permissions`.
- If no custom roles, fall back to role-based defaults.
- Ensure `getServerSession(authOptions)` returns `session.user` with: `id`, `email`, `role`, `roles[]`, `permissions[]` (effective union).

### 3) PermissionProvider Hook
- `PermissionProvider` should:
  - Read `session.user.permissions` and `session.user.role`.
  - Provide `hasPermission`, `hasAnyPermission`, `hasAllPermissions`.
  - Provide role-aware fallback if `session.user.permissions` is empty (use `ROLE_PERMISSIONS` map).
  - Log minimal debug info in dev only.
- No breaking changes. Maintain API used by `PermissionGate` and `withPermissions` HOC.

### 4) Layout Navigation Authorization
- Convert `components/Layout.js` to use a `navigationConfig` with `requiredPermission` per item:
  - **Dashboard**: `null` (any authenticated user)
  - **Farmers**: `farmers.read`
  - **Agents**: `agents.read`
  - **Clusters**: `clusters.read`
  - **Farms**: `farms.read`
  - **Users**: `users.read`
  - **GIS (Google)**: `farmers.read`
  - **Settings**: `settings.update` (or `settings.read` for visibility, `update` for actions)
- Filter navigation using `usePermissions.hasPermission` before rendering. Do not show items the user cannot access.

### 5) Page-Level Guards
- Wrap pages with `withPermissions` where needed:
  - `/farmers`: `farmers.read`
  - `/farms`: `farms.read`
  - `/agents`: `agents.read`
  - `/clusters`: `clusters.read`
  - `/users`: `users.read`
  - `/settings`: `settings.read`
- Provide friendly fallback UI (Access denied) without breaking routing. Maintain existing behavior for loading states.

### 6) API Route Authorization
- In API routes, use `getServerSession` and `lib/permissions.checkPermissions` or `requirePermissions` middleware:
  - Example: `POST /api/farmers` requires `farmers.create`; `GET` requires `farmers.read`.
  - Example: `PUT /api/settings/roles` requires `roles.update` (or `admin/super_admin` role check).
- Return `401` for unauthenticated, `403` for insufficient permissions. Do not leak sensitive info.

### 7) System Roles & Bootstrap Scripts
- Ensure `scripts/setup-system-roles.js` creates/updates system roles with `isSystem=true` and complete permission sets.
- Ensure `scripts/grant-admin-permissions.js` assigns `super_admin` system role and `user_roles` mapping, keeping parity with permission sets.
- Add idempotency: re-running scripts should not duplicate or break roles/assignments.

### 8) Farmers/Farms UI Authorization
- In `pages/farmers/index.js` and `pages/farms.js`:
  - Gate create/edit/delete buttons with `PermissionGate` (e.g., `farmers.create`, `farmers.update`, `farmers.delete`; `farms.create`, etc.).
  - Read views should be accessible with `farmers.read` and `farms.read` respectively.
  - Do not fetch heavy related data if not needed for list. Optimize queries and payload size.

### 9) Performance & Caching (Auth-aware)
- Add `Cache-Control` headers for list endpoints with `s-maxage` where data is read-only per request and consistent with permissions.
- Avoid caching user-specific sensitive endpoints unless scoped by user and safe.
- Keep responses under 4MB and enforce safe limits/pagination server-side.

### 10) Acceptance Criteria
- A user with `role=viewer` sees only Dashboard, Farmers, Farms, Clusters, GIS and cannot access create/update/delete operations.
- A user with `role=agent` can create/read/update farmers and farms; navigation reflects permissions.
- A user with custom role granting `users.read` sees the Users menu even if base role doesn't include it.
- API routes return `403` when lacking permissions; UI hides actions accordingly.
- No menu items visible without authorization; no breaking changes to existing pages/components.

## Deliverables
- Updated `PermissionProvider`, Layout navigation filtering, page-level guards, and API route checks.
- Updated role bootstrap scripts to match the authoritative permission map.
- Minimal diffs, no deletions of existing features, and comprehensive tests or manual verification notes.

## Implementation Checklist

### Phase 1: Permission Foundation
- [ ] Consolidate all permission strings in `lib/permissions.js`
- [ ] Update `SYSTEM_ROLES` map with complete permission sets
- [ ] Ensure parity across all scripts and API routes

### Phase 2: Session & Provider
- [ ] Update NextAuth callbacks to hydrate `session.user.permissions`
- [ ] Enhance `PermissionProvider` with role-aware fallback
- [ ] Test permission hooks in isolation

### Phase 3: UI Authorization
- [ ] Update `Layout.js` with permission-filtered navigation
- [ ] Add `withPermissions` HOC to protected pages
- [ ] Gate UI actions with `PermissionGate` component

### Phase 4: API Authorization
- [ ] Add permission checks to all API routes
- [ ] Implement consistent error responses (401/403)
- [ ] Add middleware for common permission patterns

### Phase 5: Bootstrap & Migration
- [ ] Update and test `setup-system-roles.js`
- [ ] Update and test `grant-admin-permissions.js`
- [ ] Add idempotency and safe re-run logic

### Phase 6: Testing & Verification
- [ ] Manual test all user roles (super_admin, admin, manager, agent, viewer)
- [ ] Verify navigation filtering for each role
- [ ] Test API authorization for all CRUD operations
- [ ] Verify custom role permissions override correctly

## Permission Matrix

| Entity       | Create             | Read               | Update             | Delete             |
|--------------|--------------------|--------------------|--------------------|--------------------|
| Users        | users.create       | users.read         | users.update       | users.delete       |
| Agents       | agents.create      | agents.read        | agents.update      | agents.delete      |
| Farmers      | farmers.create     | farmers.read       | farmers.update     | farmers.delete     |
| Farms        | farms.create       | farms.read         | farms.update       | farms.delete       |
| Clusters     | clusters.create    | clusters.read      | clusters.update    | clusters.delete    |
| Certificates | certificates.create| certificates.read  | certificates.update| certificates.delete|
| Roles        | roles.create       | roles.read         | roles.update       | roles.delete       |
| Analytics    | -                  | analytics.read     | -                  | -                  |
| Settings     | -                  | settings.read      | settings.update    | -                  |

## Role Definitions

### Super Admin
- Full access to all entities and operations
- Can manage system roles and permissions
- Can access all navigation items

### Admin
- Full access to farmers, farms, agents, clusters, certificates
- Read access to users and analytics
- Update access to settings
- Cannot manage system roles

### Manager
- Read/Update access to farmers, farms, clusters
- Read access to agents, analytics
- Cannot manage users or roles

### Agent
- Create/Read/Update access to farmers and farms
- Read access to clusters
- Cannot delete or access administrative features

### Viewer
- Read-only access to farmers, farms, clusters, analytics
- Cannot create, update, or delete any records
- Limited navigation visibility
