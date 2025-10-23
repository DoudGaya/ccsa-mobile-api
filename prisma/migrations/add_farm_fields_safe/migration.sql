-- AlterTable: Add new fields to farms table safely (won't lose data)
-- This migration adds farmCategory, landforms, and converts secondaryCrop to array

-- Add farmCategory column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='farms' AND column_name='farmCategory') THEN
    ALTER TABLE "farms" ADD COLUMN "farmCategory" TEXT;
  END IF;
END $$;

-- Add landforms column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='farms' AND column_name='landforms') THEN
    ALTER TABLE "farms" ADD COLUMN "landforms" TEXT;
  END IF;
END $$;

-- Check if secondaryCrop is TEXT and convert to TEXT[] if needed
DO $$ 
BEGIN
  -- Check if secondaryCrop exists and is not already an array
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='farms' 
    AND column_name='secondaryCrop' 
    AND data_type='text'
  ) THEN
    -- First, convert existing single values to array format
    -- Update non-null, non-empty values to array with single element
    UPDATE "farms" 
    SET "secondaryCrop" = ARRAY["secondaryCrop"]::text[]
    WHERE "secondaryCrop" IS NOT NULL AND "secondaryCrop" != '';
    
    -- Change column type to array
    ALTER TABLE "farms" 
    ALTER COLUMN "secondaryCrop" TYPE TEXT[] 
    USING CASE 
      WHEN "secondaryCrop" IS NULL OR "secondaryCrop" = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY["secondaryCrop"]::TEXT[]
    END;
  END IF;
  
  -- If secondaryCrop doesn't exist at all, create it as array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='farms' AND column_name='secondaryCrop') THEN
    ALTER TABLE "farms" ADD COLUMN "secondaryCrop" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;
