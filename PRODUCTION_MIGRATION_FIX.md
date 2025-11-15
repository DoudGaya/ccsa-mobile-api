# 🚨 Production Migration Fix Guide

## Problem
Migration `20250822120000_add_cluster_support` is failing because:
- The `clusters` table **already exists** in production database
- Prisma migration history doesn't know it's there
- This is blocking all subsequent migrations from deploying

## Root Cause
The table was likely created manually or via a direct SQL script, but the migration wasn't marked as applied in `_prisma_migrations` table.

---

## ✅ SAFE Solution (No Data Loss)

### Option 1: Mark Migration as Applied (Recommended)
This tells Prisma "this migration is already done, skip it."

```sql
-- Connect to your production database and run:
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
    'manual_clusters_table_exists',
    NOW(),
    '20250822120000_add_cluster_support',
    'Manually marked as applied - table already exists',
    NULL,
    NOW(),
    1
);
```

**After running this SQL, retry:**
```bash
npx prisma migrate deploy
```

---

### Option 2: Modify Migration to IF NOT EXISTS (Alternative)

If you can't access SQL directly, modify the migration file:

**Edit:** `prisma/migrations/20250822120000_add_cluster_support/migration.sql`

**Change line 6 from:**
```sql
CREATE TABLE "clusters" (
```

**To:**
```sql
CREATE TABLE IF NOT EXISTS "clusters" (
```

**Change line 19 from:**
```sql
ALTER TABLE "farmers" ADD COLUMN "clusterId" TEXT;
```

**To:**
```sql
ALTER TABLE "farmers" ADD COLUMN IF NOT EXISTS "clusterId" TEXT;
```

**Change line 22 from:**
```sql
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_clusterId_fkey" FOREIGN KEY...
```

**To:**
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'farmers_clusterId_fkey'
    ) THEN
        ALTER TABLE "farmers" ADD CONSTRAINT "farmers_clusterId_fkey" 
        FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
```

Then retry:
```bash
npx prisma migrate deploy
```

---

### Option 3: Reset Migration History (⚠️ Use with Caution)

**Only if Options 1 & 2 fail:**

```bash
# This will mark ALL pending migrations as applied without running them
npx prisma migrate resolve --applied 20250822120000_add_cluster_support
```

⚠️ **Warning**: Only use this if you're 100% sure the table and columns already exist correctly.

---

## ✅ Verify After Fix

```sql
-- Check clusters table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'clusters';

-- Check farmers.clusterId column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farmers' AND column_name = 'clusterId';

-- Check foreign key exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'farmers' AND constraint_name = 'farmers_clusterId_fkey';

-- Verify migration is recorded
SELECT migration_name, finished_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20250822120000_add_cluster_support';
```

---

## 🔧 SSO Button Missing - Fix

The SSO button won't show because `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set.

### Check Current Environment Variables

```bash
cd ccsa-mobile-api
cat .env | grep GOOGLE
```

### Add Required Variables

Create or update `.env` file:

```bash
# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Frontend (MUST match GOOGLE_CLIENT_ID exactly)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# NextAuth
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### Restart Application

```bash
# After adding env vars, restart your app
pm2 restart ccsa-admin  # or however you're running it
# OR if using Vercel, redeploy
```

---

## 🧪 Test After Fix

1. ✅ Migration deploys successfully
2. ✅ No data lost from clusters table
3. ✅ Credentials login still works
4. ✅ Google SSO button appears on signin page
5. ✅ Dashboard loads correctly

---

## 📞 Need Help?

If migration still fails:
1. Share output of `SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;`
2. Share output of `\dt` (list all tables)
3. Check if clusters table has data: `SELECT COUNT(*) FROM clusters;`

**IMPORTANT**: Don't drop or truncate any tables. We need to preserve all existing data.
