# Complete API Endpoints Reference - Roles Management

## Overview
This document maps all available API endpoints for roles management in the application.

## Roles API Endpoints

### 1. List All Roles
```
GET /api/roles
Authorization: Required (users.read permission)
```
**Response (200 OK):**
```json
{
  "systemRoles": [
    {
      "id": "uuid",
      "name": "Super Admin",
      "description": "Full system access",
      "permissions": ["users.create", "users.read", "users.update", "users.delete", ...],
      "isSystem": true,
      "isActive": true,
      "createdAt": "2025-11-15T10:00:00Z",
      "createdBy": null,
      "userRoles": [
        {
          "user": {
            "id": "user-id",
            "displayName": "John Doe",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          }
        }
      ]
    }
  ],
  "customRoles": [
    {
      "id": "custom-role-id",
      "name": "Data Analyst",
      "description": "Can view and analyze farm data",
      "permissions": ["analytics.read", "farms.read"],
      "isSystem": false,
      "isActive": true,
      "createdAt": "2025-11-15T10:00:00Z",
      "createdBy": "admin-user-id",
      "userRoles": []
    }
  ],
  "totalRoles": 8,
  "availablePermissions": ["users.create", "users.read", ...]
}
```

### 2. Create New Role
```
POST /api/roles
Authorization: Required (users.create permission)
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Data Analyst",
  "description": "Can view farm analytics",
  "permissions": ["analytics.read", "farms.read"],
  "isActive": true
}
```
**Response (201 Created):**
```json
{
  "id": "custom-role-id",
  "name": "Data Analyst",
  "description": "Can view farm analytics",
  "permissions": ["analytics.read", "farms.read"],
  "isSystem": false,
  "isActive": true,
  "createdAt": "2025-11-15T10:15:00Z",
  "createdBy": "admin-user-id"
}
```
**Error Responses:**
- `400 Bad Request` - Missing required fields, invalid permissions
- `400 Conflict` - Role name already exists

### 3. Get Single Role
```
GET /api/roles/[id]
Authorization: Required (users.read permission)
```
**Response (200 OK):**
```json
{
  "id": "role-id",
  "name": "Super Admin",
  "description": "Full system access",
  "permissions": ["users.create", "users.read", "users.update", "users.delete", ...],
  "isSystem": true,
  "isActive": true,
  "createdAt": "2025-11-15T10:00:00Z",
  "createdBy": null,
  "userRoles": [
    {
      "userId": "user-id-1",
      "roleId": "role-id",
      "user": {
        "id": "user-id-1",
        "displayName": "Jane Admin",
        "firstName": "Jane",
        "lastName": "Admin",
        "email": "jane@example.com"
      }
    }
  ]
}
```
**Error Responses:**
- `404 Not Found` - Role doesn't exist

### 4. Update Role
```
PUT /api/roles/[id]
Authorization: Required (users.update permission)
Content-Type: application/json
```
**Request Body (all fields optional):**
```json
{
  "name": "Senior Data Analyst",
  "description": "Advanced analytics access",
  "permissions": ["analytics.read", "analytics.create", "farms.read"],
  "isActive": true
}
```
**Response (200 OK):**
```json
{
  "id": "role-id",
  "name": "Senior Data Analyst",
  "description": "Advanced analytics access",
  "permissions": ["analytics.read", "analytics.create", "farms.read"],
  "isSystem": false,
  "isActive": true,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T10:30:00Z",
  "userRoles": [...]
}
```
**Error Responses:**
- `400 Bad Request` - Cannot modify system roles
- `400 Conflict` - New role name already exists
- `404 Not Found` - Role doesn't exist

### 5. Delete Role ⭐ NEW
```
DELETE /api/roles/[id]
Authorization: Required (users.delete permission)
```
**Response (200 OK):**
```json
{
  "message": "Role deleted successfully"
}
```
**Error Responses:**
- `400 Bad Request` - Cannot delete system roles
- `400 Bad Request` - Role is assigned to users (with count)
- `404 Not Found` - Role doesn't exist

**Example Error Response:**
```json
{
  "error": "Cannot delete role. It is assigned to 3 user(s). Please unassign the role from all users first."
}
```

---

## User-Role Assignment Endpoints

### 6. Get User's Roles
```
GET /api/users/[userId]/roles
Authorization: Required (users.read permission)
```
**Response (200 OK):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "systemRole": "admin",
  "assignedRoles": [
    {
      "id": "role-id-1",
      "name": "Data Analyst",
      "description": "Can view farm analytics",
      "permissions": ["analytics.read", "farms.read"],
      "isSystem": false,
      "isActive": true
    }
  ],
  "effectivePermissions": ["admin.all", "analytics.read", "farms.read"],
  "permissionSummary": {
    "total": 12,
    "fromSystemRole": 8,
    "fromCustomRoles": 4
  }
}
```

### 7. Assign Role to User
```
POST /api/users/[userId]/roles
Authorization: Required (users.update permission)
Content-Type: application/json
```
**Request Body:**
```json
{
  "roleId": "role-id",
  "roleType": "custom"  // or "system" for system roles
}
```
**Response (200 OK):**
```json
{
  "message": "Role assigned successfully"
}
```
**Error Responses:**
- `404 Not Found` - User or role not found
- `400 Bad Request` - User already has this role

### 8. Remove Role from User
```
DELETE /api/users/[userId]/roles?roleId=[roleId]&roleType=custom
Authorization: Required (users.update permission)
```
**Response (200 OK):**
```json
{
  "message": "Role removed successfully"
}
```

---

## Workflow: Delete a Role

### Step 1: Check Role Assignment
```bash
GET /api/roles/[roleId]
```
Look at the `userRoles` array to see who has this role.

### Step 2: If Role is Assigned
Unassign from each user:
```bash
DELETE /api/users/[userId]/roles?roleId=[roleId]&roleType=custom
```

### Step 3: Delete the Role
```bash
DELETE /api/roles/[roleId]
```
Response: `200 OK - Role deleted successfully`

### Step 4: Verify Deletion
```bash
GET /api/roles
```
Confirm the role no longer appears in the list.

---

## Permission Matrix

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| /api/roles | users.read | users.create | - | - |
| /api/roles/[id] | users.read | - | users.update | users.delete |
| /api/users/[id]/roles | users.read | users.update | - | users.update |

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Request succeeded |
| 201 | Created | New role created |
| 400 | Bad Request | Invalid input, cannot delete system role, role assigned to users |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Role or user doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method for endpoint |
| 500 | Server Error | Database or server error |

### Permission Errors
```json
{
  "error": "Insufficient permissions to delete roles"
}
```
**Solution:** Contact system administrator to grant required permissions.

### System Role Protection
```json
{
  "error": "Cannot delete system roles"
}
```
**Solution:** System roles (Super Admin, Admin, Manager, Agent, Viewer) cannot be deleted. Create a new custom role instead.

### Role Assignment Conflict
```json
{
  "error": "Cannot delete role. It is assigned to 3 user(s). Please unassign the role from all users first."
}
```
**Solution:** 
1. Go to Users page
2. For each user with this role, edit them
3. Remove the role
4. Save changes
5. Retry deletion

---

## Testing Examples

### Test 1: Create and Delete a Role
```bash
# 1. Create role
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Role",
    "description": "Test",
    "permissions": ["analytics.read"],
    "isActive": true
  }'

# Extract the ID from response

# 2. Delete role
curl -X DELETE http://localhost:3000/api/roles/[id-from-above]

# Expected: 200 OK - Role deleted successfully
```

### Test 2: Try to Delete System Role
```bash
# Get all roles to find a system role ID
curl http://localhost:3000/api/roles

# Try to delete super_admin
curl -X DELETE http://localhost:3000/api/roles/[super-admin-id]

# Expected: 400 Bad Request - Cannot delete system roles
```

### Test 3: Try to Delete Role with Users
```bash
# Assign a role to a user first
curl -X POST http://localhost:3000/api/users/[user-id]/roles \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "[role-id]",
    "roleType": "custom"
  }'

# Try to delete the role
curl -X DELETE http://localhost:3000/api/roles/[role-id]

# Expected: 400 Bad Request - Cannot delete role. It is assigned to 1 user(s)...
```

---

**API Version:** 1.0
**Last Updated:** November 15, 2025
**Status:** Production Ready
