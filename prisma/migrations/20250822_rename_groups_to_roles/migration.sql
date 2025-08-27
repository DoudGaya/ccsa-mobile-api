-- Migration to rename groups to roles and update structure
-- Step 1: Create new roles table
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique constraint for role names
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Step 3: Migrate data from groups to roles
INSERT INTO "roles" ("id", "name", "description", "permissions", "isSystem", "isActive", "createdAt", "updatedAt")
SELECT "id", "name", "description", "permissions", false, "isActive", "createdAt", "updatedAt"
FROM "groups";

-- Step 4: Create new user_roles table
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create unique constraint and foreign keys for user_roles
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- Step 6: Add foreign key constraints
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Migrate data from user_groups to user_roles
INSERT INTO "user_roles" ("id", "userId", "roleId", "assignedAt", "assignedBy")
SELECT "id", "userId", "groupId", "assignedAt", "assignedBy"
FROM "user_groups";

-- Step 8: Insert system roles
INSERT INTO "roles" ("id", "name", "description", "permissions", "isSystem", "isActive", "createdAt", "updatedAt") VALUES
('role_super_admin', 'Super Administrator', 'Full system access with all permissions', '["users.create", "users.read", "users.update", "users.delete", "agents.create", "agents.read", "agents.update", "agents.delete", "farmers.create", "farmers.read", "farmers.update", "farmers.delete", "farms.create", "farms.read", "farms.update", "farms.delete", "clusters.create", "clusters.read", "clusters.update", "clusters.delete", "certificates.create", "certificates.read", "certificates.update", "certificates.delete", "roles.create", "roles.read", "roles.update", "roles.delete", "analytics.read", "settings.read", "settings.update"]', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role_admin', 'Administrator', 'Administrative access with most permissions', '["users.read", "users.update", "agents.create", "agents.read", "agents.update", "agents.delete", "farmers.create", "farmers.read", "farmers.update", "farmers.delete", "farms.create", "farms.read", "farms.update", "farms.delete", "clusters.create", "clusters.read", "clusters.update", "clusters.delete", "certificates.create", "certificates.read", "certificates.update", "roles.read", "analytics.read", "settings.read"]', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role_manager', 'Manager', 'Management access with read/write permissions for core operations', '["agents.read", "agents.update", "farmers.create", "farmers.read", "farmers.update", "farms.create", "farms.read", "farms.update", "clusters.read", "clusters.update", "certificates.create", "certificates.read", "analytics.read"]', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role_agent', 'Agent', 'Field agent access with limited permissions', '["farmers.create", "farmers.read", "farmers.update", "farms.create", "farms.read", "farms.update", "certificates.create", "certificates.read"]', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role_viewer', 'Viewer', 'Read-only access to most data', '["agents.read", "farmers.read", "farms.read", "clusters.read", "certificates.read", "analytics.read"]', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 9: Drop old tables (commented out for safety)
-- DROP TABLE "user_groups";
-- DROP TABLE "groups";
