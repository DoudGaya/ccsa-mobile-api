-- ============================================
-- PRODUCTION-SAFE MIGRATION RECOVERY SCRIPT
-- ============================================
-- This script will check what was created during the failed migration
-- and safely complete it without losing data
-- ============================================

-- STEP 1: Check what tables already exist from the failed migration
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
ORDER BY table_name;

-- STEP 2: Check what indexes already exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
ORDER BY indexname;

-- STEP 3: Check if users.permissions column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'permissions';

-- STEP 4: Check if any permissions were inserted
SELECT COUNT(*) as permission_count FROM permissions;

-- STEP 5: Check the migration status
SELECT 
    migration_name,
    started_at,
    finished_at,
    applied_steps_count,
    logs
FROM "_prisma_migrations"
WHERE migration_name = '20250822_add_rbac_models_manual';

-- ============================================
-- AFTER REVIEWING THE ABOVE RESULTS:
-- Run the appropriate fix script below
-- ============================================

-- ============================================
-- OPTION 1: Mark migration as rolled back and retry
-- Use this if tables were partially created but migration failed
-- ============================================

-- Mark the failed migration as rolled back
UPDATE "_prisma_migrations"
SET 
    rolled_back_at = NOW(),
    logs = COALESCE(logs, '') || ' | Manually rolled back after failure - will be reapplied'
WHERE migration_name = '20250822_add_rbac_models_manual'
  AND finished_at IS NULL;

-- THEN run: npx prisma migrate deploy

-- ============================================
-- OPTION 2: Mark as successfully applied (if everything exists)
-- Use this ONLY if all tables/indexes/data are already in place
-- ============================================

UPDATE "_prisma_migrations"
SET 
    finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually marked as completed - all objects already exist'
WHERE migration_name = '20250822_add_rbac_models_manual'
  AND finished_at IS NULL;

-- THEN run: npx prisma migrate deploy

-- ============================================
-- OPTION 3: Complete the migration manually (safest)
-- Use this if some tables exist but migration is incomplete
-- ============================================

-- Create tables that don't exist (with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "group_permissions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints (will fail silently if already exist)
DO $$ 
BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "groups_name_key" ON "groups"("name");
    CREATE UNIQUE INDEX IF NOT EXISTS "permissions_name_key" ON "permissions"("name");
    CREATE UNIQUE INDEX IF NOT EXISTS "permissions_resource_action_key" ON "permissions"("resource", "action");
    CREATE UNIQUE INDEX IF NOT EXISTS "user_groups_userId_groupId_key" ON "user_groups"("userId", "groupId");
    CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");
    CREATE UNIQUE INDEX IF NOT EXISTS "group_permissions_groupId_permissionId_key" ON "group_permissions"("groupId", "permissionId");
EXCEPTION WHEN OTHERS THEN
    NULL; -- Indexes already exist
END $$;

-- Add foreign key constraints (will skip if already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_groups_userId_fkey') THEN
        ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_groups_groupId_fkey') THEN
        ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_fkey" 
        FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_permissions_userId_fkey') THEN
        ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_permissions_permissionId_fkey') THEN
        ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" 
        FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_permissions_groupId_fkey') THEN
        ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_groupId_fkey" 
        FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_permissions_permissionId_fkey') THEN
        ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permissionId_fkey" 
        FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add users.permissions column if it doesn't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB;

-- Insert default permissions (will skip duplicates)
INSERT INTO "permissions" ("id", "name", "resource", "action", "description") 
VALUES
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
    ('perm_clusters_delete', 'Delete Clusters', 'clusters', 'delete', 'Delete clusters')
ON CONFLICT (id) DO NOTHING;

-- Mark migration as completed
UPDATE "_prisma_migrations"
SET 
    finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually completed using safe recovery script'
WHERE migration_name = '20250822_add_rbac_models_manual'
  AND finished_at IS NULL;

-- Verify everything was created
SELECT 'Tables Created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions');

SELECT 'Permissions Inserted:' as status;
SELECT COUNT(*) as count FROM permissions;

SELECT 'Migration Status:' as status;
SELECT migration_name, finished_at, applied_steps_count 
FROM "_prisma_migrations" 
WHERE migration_name = '20250822_add_rbac_models_manual';
