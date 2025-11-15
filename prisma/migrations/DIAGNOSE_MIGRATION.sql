-- ============================================
-- STEP 1: DIAGNOSE FAILED MIGRATION
-- Run this first to see what state we're in
-- ============================================

-- Check migration status
SELECT 
    migration_name,
    started_at,
    finished_at,
    applied_steps_count,
    rolled_back_at,
    logs
FROM "_prisma_migrations"
WHERE migration_name LIKE '%rbac%'
ORDER BY started_at DESC;

-- Check what RBAC tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions') THEN 'RBAC Table'
        ELSE 'Other'
    END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
ORDER BY table_name;

-- Check if permissions were inserted
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') 
        THEN (SELECT COUNT(*) FROM permissions)
        ELSE 0
    END as permissions_count;

-- Check if users.permissions column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'permissions';
