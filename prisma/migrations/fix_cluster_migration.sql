-- ============================================
-- SAFE MIGRATION FIX FOR PRODUCTION
-- ============================================
-- This marks the cluster migration as applied
-- without actually running it (table exists)
-- NO DATA WILL BE LOST
-- ============================================

-- Step 1: Verify clusters table exists (should return 1 row)
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'clusters';

-- Step 2: Check if migration is already recorded (should return 0 rows if not)
SELECT 
    migration_name, 
    finished_at, 
    applied_steps_count 
FROM "_prisma_migrations" 
WHERE migration_name = '20250822120000_add_cluster_support';

-- Step 3: Mark migration as applied
-- Only run this if Step 2 returned 0 rows
INSERT INTO "_prisma_migrations" (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
) VALUES (
    gen_random_uuid(),
    '7d4b2e8c9a1f3e5d6b8a0c2e4f6d8b1a',  -- Dummy checksum
    NOW(),
    '20250822120000_add_cluster_support',
    'Manually marked as applied - clusters table already exists in production',
    NULL,
    NOW(),
    1
);

-- Step 4: Verify insertion (should now return 1 row)
SELECT 
    migration_name, 
    finished_at, 
    logs,
    applied_steps_count 
FROM "_prisma_migrations" 
WHERE migration_name = '20250822120000_add_cluster_support';

-- Step 5: List all current migrations
SELECT 
    migration_name, 
    finished_at 
FROM "_prisma_migrations" 
ORDER BY finished_at ASC;

-- ============================================
-- After running this SQL, you can safely run:
-- npx prisma migrate deploy
-- ============================================
