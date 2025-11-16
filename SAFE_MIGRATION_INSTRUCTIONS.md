# 🛡️ SAFE MIGRATION GUIDE - Zero Data Loss Strategy

## Overview
You're performing a schema change on the `permissions` table that:
1. ❌ **Removes** the `resource` column (contains 20 non-null values)
2. ✅ **Adds** a unique constraint on `[category, action]` combination

**Status**: The schema and migration are already prepared. We just need to execute safely.

---

## 📋 Pre-Migration Checklist

### Step 1: Backup Your Database (CRITICAL)
Since your database is on NeonDB (PostgreSQL), you have automatic backups, but make a manual backup:

```bash
# Export permissions table as JSON backup
psql "postgresql://neondb_owner:npg_ODtzkedBZ4U0@ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -c "COPY permissions TO STDOUT FORMAT csv HEADER;" > permissions_backup.csv

# Also export role_permissions and user_permissions (dependencies)
psql "postgresql://neondb_owner:npg_ODtzkedBZ4U0@ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -c "COPY role_permissions TO STDOUT FORMAT csv HEADER;" > role_permissions_backup.csv

psql "postgresql://neondb_owner:npg_ODtzkedBZ4U0@ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -c "COPY user_permissions TO STDOUT FORMAT csv HEADER;" > user_permissions_backup.csv
```

### Step 2: Audit Current Database State
Run this read-only diagnostic to understand current state:

```bash
cd ccsa-mobile-api

# This will show you:
# - Current columns in permissions table
# - All 20 permission records
# - Any duplicate category+action combinations
# - Any NULL values that might cause issues
# - Dependencies in role_permissions and user_permissions

psql $DATABASE_URL < scripts/check-permissions-db.sql
```

### Step 3: Verify Permission Records
Before running migration, ensure you have data:
- 20 permissions in the table
- Their `resource` values will be moved to `category`
- No duplicate `category+action` combinations

---

## ⚡ The Safe Migration Approach

### The Migration Already Handles Data Safety:

```sql
-- 1. Add 'category' column (if missing)
-- 2. Copy all 'resource' values → 'category' (preserves all 20 records)
-- 3. Verify count matches before dropping old column
-- 4. Drop 'resource' column (ONLY after verification passes)
-- 5. Drop old constraint, add new unique constraint
```

**Key Safety Features**:
✅ Verification check before dropping any data  
✅ Uses `IF NOT EXISTS` to handle idempotency  
✅ Transaction-safe (all-or-nothing)  
✅ Handles edge cases

---

## 🚀 Execute the Migration

### Option A: Using Prisma (RECOMMENDED)

```bash
cd ccsa-mobile-api

# This will apply the migration and regenerate Prisma client
npm run prisma:migrate
```

If you don't have this script, create one:

```bash
npx prisma migrate deploy
```

### Option B: Manual SQL (If Prisma fails)

```bash
cd ccsa-mobile-api

# Run the migration SQL directly
psql $DATABASE_URL < prisma/migrations/20251115_remove_deprecated_resource_column/migration.sql
```

---

## ✅ Post-Migration Verification

### Step 1: Verify Column Changes

```sql
-- Check that 'resource' column is gone and 'category' exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'permissions'
ORDER BY ordinal_position;
```

Expected output:
- ✅ `category` column EXISTS (TEXT, nullable)
- ❌ `resource` column GONE
- ✅ All other columns intact

### Step 2: Verify Data Integrity

```sql
-- Ensure all 20 permissions still exist
SELECT COUNT(*) as total_permissions FROM permissions;

-- Should return: 20

-- Check that role_permissions and user_permissions still work
SELECT COUNT(*) as total_role_permissions FROM role_permissions;
SELECT COUNT(*) as total_user_permissions FROM user_permissions;

-- Verify unique constraint is applied
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'permissions' 
AND constraint_name LIKE '%category_action%';

-- Should return: permissions_category_action_key (or similar)
```

### Step 3: Regenerate Prisma Client

```bash
cd ccsa-mobile-api

npx prisma generate
```

### Step 4: Test Your Application

```bash
# Start your API server
npm run dev

# Check that permission queries still work:
# - Verify role-based access works
# - Test permission checks
# - Ensure no 401/403 errors in permission validation
```

---

## 🆘 Rollback Plan (If Something Goes Wrong)

If the migration fails or causes issues:

### Automatic Rollback
The migration includes verification steps that will STOP if:
- Data count doesn't match after copy
- Foreign key constraints are violated
- Database permissions denied

**If migration fails**: The transaction rolls back automatically. No harm done.

### Manual Rollback (Last Resort)

If you need to restore from backup:

```bash
# Restore from CSV backup
psql $DATABASE_URL << EOF
COPY permissions FROM STDIN FORMAT csv HEADER;
$(cat permissions_backup.csv)
EOF
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Unique constraint violation"
**Cause**: Duplicate `category+action` combinations exist  
**Solution**: 
```sql
-- Find duplicates:
SELECT category, action, COUNT(*) 
FROM permissions 
GROUP BY category, action 
HAVING COUNT(*) > 1;

-- Manually fix by updating one of the duplicates
UPDATE permissions SET category = 'unique_category' WHERE id = 'xxx';
```

### Issue 2: "Cannot drop column resource"
**Cause**: Foreign key or dependency exists  
**Solution**: The migration handles this. If it fails, check for triggers or custom constraints.

### Issue 3: "Prisma client out of sync"
**Cause**: Schema changed but client not regenerated  
**Solution**:
```bash
npx prisma generate
npm install
npm run build
```

---

## 📊 Data Impact Summary

| Table | Impact | Status |
|-------|--------|--------|
| permissions | 20 records | ✅ Preserved (resource → category) |
| role_permissions | ~50+ records | ✅ Unaffected |
| user_permissions | Variable | ✅ Unaffected |
| user_roles | Variable | ✅ Unaffected |
| roles | Variable | ✅ Unaffected |

---

## 🎯 Next Steps

1. **Read the backup scripts above**
2. **Run diagnostic**: `psql $DATABASE_URL < scripts/check-permissions-db.sql`
3. **Create backups**: Export CSV files (commands above)
4. **Execute migration**: `npx prisma migrate deploy`
5. **Verify**: Run post-migration verification queries
6. **Test**: Start your app and test permission-based features
7. **Done**: 🎉 Safe migration complete!

---

## 📞 Emergency Contact Points

If something breaks:
1. Check logs: `tail -f prisma/migrate.log`
2. Run verification queries above
3. Review the migration SQL in: `prisma/migrations/20251115_remove_deprecated_resource_column/migration.sql`
4. Contact database admin with verification results
