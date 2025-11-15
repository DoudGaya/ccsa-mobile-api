# 🚨 Failed Migration Recovery Guide - PRODUCTION SAFE

## What Happened

The migration `20250822_add_rbac_models_manual` **started** but **failed** mid-execution. This means:
- Some tables might have been created
- Some indexes might have been created  
- Some permissions might have been inserted
- **The migration was NOT marked as complete**
- Prisma refuses to continue until this is resolved

**⚠️ IMPORTANT**: Your data is safe! This migration only creates new tables, it doesn't modify existing data.

---

## Step-by-Step Recovery (Safe for Production)

### Step 1: Diagnose Current State

Run this diagnostic SQL to see what was created:

```bash
# Option A: Using psql
psql $DATABASE_URL -f prisma/migrations/DIAGNOSE_MIGRATION.sql

# Option B: Copy and paste into your database client
# File: prisma/migrations/DIAGNOSE_MIGRATION.sql
```

**Expected Output**: You'll see which tables exist and if the migration is marked as failed.

---

### Step 2: Choose Recovery Method

Based on what you see, choose ONE option:

#### ✅ **Option A: Safe Recovery (RECOMMENDED)**

Use this if you're unsure what state the database is in. This script:
- Creates tables **only if they don't exist** (IF NOT EXISTS)
- Creates indexes **only if they don't exist**
- Inserts permissions **only if they don't exist** (ON CONFLICT DO NOTHING)
- Marks migration as complete
- **ZERO risk of data loss**

```bash
psql $DATABASE_URL -f prisma/migrations/RECOVER_FAILED_MIGRATION.sql
```

Then retry:
```bash
npx prisma migrate deploy
```

---

#### Option B: Mark as Rolled Back

Use this if you want Prisma to retry the migration from scratch:

```sql
UPDATE "_prisma_migrations"
SET 
    rolled_back_at = NOW(),
    logs = 'Manually rolled back after failure - will retry'
WHERE migration_name = '20250822_add_rbac_models_manual'
  AND finished_at IS NULL;
```

Then retry:
```bash
npx prisma migrate deploy
```

**⚠️ Warning**: This might fail again if tables already exist.

---

#### Option C: Mark as Completed (Only if ALL objects exist)

Use this ONLY if you verified all tables, indexes, and data exist:

```sql
UPDATE "_prisma_migrations"
SET 
    finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Manually marked as completed - verified all objects exist'
WHERE migration_name = '20250822_add_rbac_models_manual'
  AND finished_at IS NULL;
```

Then retry:
```bash
npx prisma migrate deploy
```

---

## Recommended Approach (Safest)

I recommend **Option A** because:
1. ✅ Works regardless of what was created
2. ✅ Uses `IF NOT EXISTS` - won't error if tables exist
3. ✅ Uses `ON CONFLICT DO NOTHING` - won't duplicate data
4. ✅ Zero risk of data loss
5. ✅ Completes the migration properly

### Run This:

```bash
cd ccsa-mobile-api

# Run the safe recovery script
psql $DATABASE_URL -f prisma/migrations/RECOVER_FAILED_MIGRATION.sql

# Then retry migrations
npx prisma migrate deploy
```

---

## Alternative: Using Prisma CLI

If you prefer using Prisma's built-in tools:

```bash
# Mark the migration as rolled back
npx prisma migrate resolve --rolled-back 20250822_add_rbac_models_manual

# Then retry
npx prisma migrate deploy
```

**Note**: This might fail again if tables already exist. That's why the SQL script is safer.

---

## Verification After Recovery

Run these checks to ensure everything is correct:

```sql
-- 1. Check migration is marked as complete
SELECT migration_name, finished_at, applied_steps_count 
FROM "_prisma_migrations" 
WHERE migration_name = '20250822_add_rbac_models_manual';

-- 2. Verify all 5 RBAC tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
ORDER BY table_name;
-- Should return 5 rows

-- 3. Verify permissions were inserted
SELECT COUNT(*) FROM permissions;
-- Should return 20 (or more)

-- 4. Verify users.permissions column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'permissions';
-- Should return 1 row

-- 5. Check no data was lost in existing tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM farmers;
SELECT COUNT(*) FROM clusters;
-- Should match your expected counts
```

---

## What This Migration Does (For Reference)

The `20250822_add_rbac_models_manual` migration creates:

**Tables Created:**
- `groups` - User groups/roles
- `permissions` - System permissions
- `user_groups` - Users assigned to groups
- `user_permissions` - Direct permissions to users
- `group_permissions` - Permissions assigned to groups

**Columns Added:**
- `users.permissions` (JSONB) - For storing user permissions

**Data Inserted:**
- 20 default permissions for users, groups, farmers, agents, clusters

**NO DATA MODIFIED OR DELETED** - This migration only adds new tables!

---

## Troubleshooting

### Error: "relation already exists"
**Solution**: Use the RECOVER_FAILED_MIGRATION.sql script (Option A). It uses `IF NOT EXISTS`.

### Error: "duplicate key value"
**Solution**: The script uses `ON CONFLICT DO NOTHING` - this shouldn't happen. But if it does, the data already exists and you're safe.

### Migration still shows as failed
**Solution**: Make sure you ran the UPDATE statement to mark it as complete.

### Still getting P3009 error
**Solution**: 
```bash
# Force mark as rolled back
npx prisma migrate resolve --rolled-back 20250822_add_rbac_models_manual

# Then run safe recovery
psql $DATABASE_URL -f prisma/migrations/RECOVER_FAILED_MIGRATION.sql

# Update migration status manually
psql $DATABASE_URL -c "UPDATE _prisma_migrations SET finished_at = NOW() WHERE migration_name = '20250822_add_rbac_models_manual';"

# Finally retry
npx prisma migrate deploy
```

---

## Quick Command Summary

```bash
# 1. Diagnose
psql $DATABASE_URL -f prisma/migrations/DIAGNOSE_MIGRATION.sql

# 2. Recover (SAFE)
psql $DATABASE_URL -f prisma/migrations/RECOVER_FAILED_MIGRATION.sql

# 3. Retry migrations
npx prisma migrate deploy

# 4. Verify
npx prisma migrate status
```

---

## Need Help?

If recovery fails:
1. Share the output of DIAGNOSE_MIGRATION.sql
2. Share the exact error message from `npx prisma migrate deploy`
3. Don't panic - your data is safe, this only affects new tables

**Remember**: This migration doesn't touch existing data (users, farmers, clusters). It only creates new RBAC tables.
