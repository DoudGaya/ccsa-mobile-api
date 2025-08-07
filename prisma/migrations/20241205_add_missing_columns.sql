-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'agent', 'super_admin');

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add isVerified column if it doesn't exist
    BEGIN
        ALTER TABLE users ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN
        -- Column already exists, do nothing
        NULL;
    END;
END $$;

-- Add accountName column to farmers table if it doesn't exist
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE farmers ADD COLUMN "accountName" TEXT;
    EXCEPTION
        WHEN duplicate_column THEN
        -- Column already exists, do nothing
        NULL;
    END;
END $$;
