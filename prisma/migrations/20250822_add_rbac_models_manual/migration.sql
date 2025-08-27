-- Add RBAC support: Groups, Permissions, and junction tables

-- Create groups table
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- Create permissions table
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- Create user_groups junction table
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- Create user_permissions junction table
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- Create group_permissions junction table
CREATE TABLE "group_permissions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE UNIQUE INDEX "user_groups_userId_groupId_key" ON "user_groups"("userId", "groupId");
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");
CREATE UNIQUE INDEX "group_permissions_groupId_permissionId_key" ON "group_permissions"("groupId", "permissionId");

-- Add foreign key constraints
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add permissions and groups columns to users table if they don't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB;

-- Insert default permissions
INSERT INTO "permissions" ("id", "name", "resource", "action", "description") VALUES
    ('perm_users_create', 'Create Users', 'users', 'create', 'Create new users'),
    ('perm_users_read', 'View Users', 'users', 'read', 'View user information'),
    ('perm_users_update', 'Update Users', 'users', 'update', 'Update user information'),
    ('perm_users_delete', 'Delete Users', 'users', 'delete', 'Delete users'),
    ('perm_groups_create', 'Create Groups', 'groups', 'create', 'Create new groups'),
    ('perm_groups_read', 'View Groups', 'groups', 'read', 'View group information'),
    ('perm_groups_update', 'Update Groups', 'groups', 'update', 'Update group information'),
    ('perm_groups_delete', 'Delete Groups', 'groups', 'delete', 'Delete groups'),
    ('perm_farmers_create', 'Create Farmers', 'farmers', 'create', 'Create new farmers'),
    ('perm_farmers_read', 'View Farmers', 'farmers', 'read', 'View farmer information'),
    ('perm_farmers_update', 'Update Farmers', 'farmers', 'update', 'Update farmer information'),
    ('perm_farmers_delete', 'Delete Farmers', 'farmers', 'delete', 'Delete farmers'),
    ('perm_agents_create', 'Create Agents', 'agents', 'create', 'Create new agents'),
    ('perm_agents_read', 'View Agents', 'agents', 'read', 'View agent information'),
    ('perm_agents_update', 'Update Agents', 'agents', 'update', 'Update agent information'),
    ('perm_agents_delete', 'Delete Agents', 'agents', 'delete', 'Delete agents'),
    ('perm_clusters_create', 'Create Clusters', 'clusters', 'create', 'Create new clusters'),
    ('perm_clusters_read', 'View Clusters', 'clusters', 'read', 'View cluster information'),
    ('perm_clusters_update', 'Update Clusters', 'clusters', 'update', 'Update cluster information'),
    ('perm_clusters_delete', 'Delete Clusters', 'clusters', 'delete', 'Delete clusters');

-- Insert default groups
INSERT INTO "groups" ("id", "name", "description", "permissions") VALUES
    ('group_super_admin', 'Super Administrators', 'Full system access', '["*"]'),
    ('group_admin', 'Administrators', 'Administrative access to most features', '["perm_users_read", "perm_users_update", "perm_groups_read", "perm_farmers_create", "perm_farmers_read", "perm_farmers_update", "perm_agents_create", "perm_agents_read", "perm_agents_update", "perm_clusters_create", "perm_clusters_read", "perm_clusters_update"]'),
    ('group_manager', 'Managers', 'Management access to farmers and agents', '["perm_farmers_create", "perm_farmers_read", "perm_farmers_update", "perm_agents_read", "perm_clusters_read"]'),
    ('group_agent', 'Agents', 'Field agent access', '["perm_farmers_create", "perm_farmers_read", "perm_farmers_update"]');
