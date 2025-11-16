-- ZERO DATA LOSS Migration - Production Safe
-- Database State: permissions table has 'resource' column (20 rows), NO 'category' column
-- Transformation: resource column → category column
-- Data Preservation: 100% of all 20 permissions maintained

-- Step 1: Add 'category' column (if it doesn't exist)
-- This must be done BEFORE we can update it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='permissions' AND column_name='category'
  ) THEN
    ALTER TABLE "permissions" ADD COLUMN "category" TEXT;
  END IF;
END $$;

-- Step 2: Copy all data from 'resource' to 'category'
-- This preserves the 20 permission records' resource values
UPDATE "permissions"
SET "category" = "resource"
WHERE "category" IS NULL AND "resource" IS NOT NULL;

-- Step 3: Verify data was copied before dropping old column
-- If this count is wrong, the migration should fail and NOT drop the column
DO $$
DECLARE
  category_count INT;
  resource_count INT;
BEGIN
  SELECT COUNT(*) INTO category_count 
  FROM "permissions" WHERE "category" IS NOT NULL;
  
  SELECT COUNT(*) INTO resource_count 
  FROM "permissions" WHERE "resource" IS NOT NULL;
  
  IF category_count != resource_count THEN
    RAISE EXCEPTION 'Data migration verification failed: % category vs % resource', 
      category_count, resource_count;
  END IF;
END $$;

-- Step 4: Drop the old 'resource' column
-- Safe to drop now because data is already in 'category'
ALTER TABLE "permissions" DROP COLUMN IF EXISTS "resource";

-- Step 5: Drop the old unique constraint (was on resource, action)
ALTER TABLE "permissions" 
DROP CONSTRAINT IF EXISTS "permissions_resource_action_key";

-- Step 6: Add new unique constraint (on category, action)
-- This ensures data integrity in the new schema
ALTER TABLE "permissions" 
ADD CONSTRAINT "permissions_category_action_key" UNIQUE ("category", "action");
