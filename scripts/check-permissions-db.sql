-- DIAGNOSTIC SCRIPT - Safe to run, READ-ONLY
-- This script checks the current state of the permissions table
-- No data will be modified

-- 1. Check if 'resource' column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'permissions'
ORDER BY ordinal_position;

-- 2. Get all current permissions data
SELECT 
  id,
  name,
  category,
  action,
  CASE WHEN resource IS NOT NULL THEN 'HAS_RESOURCE' ELSE 'NULL' END as resource_status,
  isSystem,
  isActive,
  createdAt
FROM permissions
ORDER BY id;

-- 3. Check for duplicate category+action combinations
SELECT 
  category,
  action,
  COUNT(*) as count_duplicates
FROM permissions
WHERE category IS NOT NULL AND action IS NOT NULL
GROUP BY category, action
HAVING COUNT(*) > 1
ORDER BY count_duplicates DESC;

-- 4. Check for NULL values in category or action
SELECT 
  id,
  name,
  category,
  action,
  'NEEDS_ATTENTION' as status
FROM permissions
WHERE category IS NULL OR action IS NULL;

-- 5. Check constraints on permissions table
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'permissions'
ORDER BY constraint_name;

-- 6. Check role_permissions dependencies (to ensure they won't break)
SELECT 
  COUNT(*) as total_role_permissions
FROM role_permissions;

-- 7. Check user_permissions dependencies
SELECT 
  COUNT(*) as total_user_permissions
FROM user_permissions;
