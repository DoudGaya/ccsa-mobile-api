# 🛡️ Complete Safe Migration Guide - Zero Data Loss

## Executive Summary

You have a critical Prisma schema migration that needs to happen:
- **Remove** the `resource` column from `permissions` table (contains 20 rows of important data)
- **Add** a unique constraint on `[category, action]` columns
- **Preserve** all data without any loss

✅ **Good News**: Everything is already set up for a safe migration with automated backups, verification, and rollback capabilities.

---

## 📊 Current State

| Item | Status | Details |
|------|--------|---------|
| **Schema** | ✅ Updated | `resource` field removed, `category` field added |
| **Migration** | ✅ Ready | File: `prisma/migrations/20251115_remove_deprecated_resource_column/` |
| **Backup Scripts** | ✅ Ready | Created: `scripts/backup-restore.sh` |
| **Verification** | ✅ Ready | Created: `scripts/verify-migration.sh` |
| **Automation** | ✅ Ready | Created: `scripts/safe-migrate.sh` |
| **npm Scripts** | ✅ Updated | Added: `migrate:*` commands |
| **Database** | 🟡 Ready | Connected & accessible via NeonDB |

---

## 🚀 Quick Start - The Safe Way

### Option 1: Fully Automated (RECOMMENDED)

This is the **safest** approach. The script handles everything:

```bash
cd ccsa-mobile-api

# Make scripts executable (Windows users skip this)
chmod +x scripts/*.sh

# Run the complete safe migration
npm run migrate:safe
```

This will:
1. ✅ Check prerequisites
2. 💾 Create automatic backups
3. 🔍 Run diagnostic checks
4. 🚀 Execute the migration
5. ✔️ Verify data integrity
6. 🔄 Regenerate Prisma client
7. 🎉 Complete!

**Time**: ~2-5 minutes

### Option 2: Step-by-Step Control

If you prefer more control:

#### Step 1: Create Backup

```bash
npm run migrate:backup
```

This creates a timestamped backup in `ccsa-mobile-api/backups/migration_YYYYMMDD_HHMMSS/`

#### Step 2: Run Diagnostic

```bash
npm run migrate:verify
```

This checks:
- Current database state
- Number of permissions
- For duplicate `category+action` combinations
- Foreign key relationships

#### Step 3: Execute Migration

```bash
npx prisma migrate deploy
```

#### Step 4: Verify Everything Works

```bash
npm run migrate:verify
```

Then test your application:

```bash
npm run dev
```

Visit: http://localhost:3000/api/health

---

## 📋 What The Migration Does

### Before Migration
```
permissions table:
├── id (primary key)
├── name (unique)
├── resource ← 20 values here (WILL BE MOVED)
├── action
├── description
└── ... other fields
```

### After Migration
```
permissions table:
├── id (primary key)
├── name (unique)
├── category ← values moved from 'resource'
├── action
├── description
└── ... other fields

PLUS new constraint:
  UNIQUE (category, action)
```

### Data Preservation
- ✅ All 20 permission records are kept
- ✅ `resource` column values → `category` column
- ✅ All relationships preserved
- ✅ Foreign keys unchanged
- ✅ No permissions deleted

---

## 🔍 What Gets Backed Up

The backup script creates copies of all critical tables:

1. **permissions** - The main table being migrated
2. **role_permissions** - Links permissions to roles
3. **user_permissions** - Links permissions to users
4. **roles** - User roles
5. **user_roles** - Links users to roles

Each backup is timestamped and stored in:
```
ccsa-mobile-api/backups/migration_YYYYMMDD_HHMMSS/
├── permissions.csv
├── role_permissions.csv
├── user_permissions.csv
├── roles.csv
├── user_roles.csv
├── METADATA.txt
└── RESTORE.sh
```

---

## ✅ Verification Steps

### After Migration Completes

The migration script automatically verifies:

1. **Schema Changes**
   - ✅ `resource` column removed
   - ✅ `category` column exists
   - ✅ `action` column exists

2. **Data Integrity**
   - ✅ All 20 permissions preserved
   - ✅ No NULL values in critical fields
   - ✅ No duplicate `category+action` combinations

3. **Constraints**
   - ✅ Unique constraint on `[category, action]` added
   - ✅ Primary keys intact
   - ✅ Foreign keys valid

4. **Related Tables**
   - ✅ `role_permissions` accessible
   - ✅ `user_permissions` accessible
   - ✅ All references valid

### Manual Verification

To verify at any time:

```bash
# Full verification
npm run migrate:verify

# Database state check
npm run migrate:backup -- verify

# Prisma validation
npx prisma validate
```

---

## 🆘 Troubleshooting

### Issue 1: Permission Denied Error

**Error**: `bash: ./scripts/safe-migrate.sh: Permission denied`

**Fix (Windows Git Bash)**:
```bash
# Use bash directly
bash scripts/safe-migrate.sh
```

**Fix (Linux/Mac)**:
```bash
chmod +x scripts/safe-migrate.sh
./scripts/safe-migrate.sh
```

### Issue 2: DATABASE_URL Not Set

**Error**: `ERROR: DATABASE_URL environment variable not set`

**Fix**:
```bash
# Load from .env file
set -a
source .env
set +a

# Then run migration
npm run migrate:safe
```

**Or (Windows PowerShell)**:
```powershell
# Load environment
$env:DATABASE_URL = "postgresql://..."

# Then run
npm run migrate:safe
```

### Issue 3: psql Not Found

**Error**: `psql command not found`

**Fix**: Install PostgreSQL client tools
- Linux: `sudo apt-get install postgresql-client`
- Mac: `brew install postgresql`
- Windows: https://www.postgresql.org/download/windows/

Or use alternative approach:

```bash
# Without psql, use Prisma directly
npx prisma migrate deploy
npx prisma generate
```

### Issue 4: Migration Fails - Duplicate Values

**Error**: `Unique constraint violation`

**Cause**: Duplicate `category+action` combinations exist

**Fix**:
```bash
# Revert changes
npm run migrate:restore

# Check duplicates
npm run migrate:verify

# Manually fix, then retry
npm run migrate:safe
```

---

## 🔄 Rollback Procedure

If something goes wrong, you can restore the database to its pre-migration state.

### Automatic Rollback

If the migration fails, Prisma automatically rolls back. You can then:

```bash
# Check what went wrong
npx prisma migrate resolve --rolled-back 20251115_remove_deprecated_resource_column

# Then investigate and retry
npm run migrate:safe
```

### Manual Rollback from Backup

```bash
# Restore from specific backup
npm run migrate:restore

# You'll be prompted to select backup directory
```

Or manually:

```bash
# List backups
ls -la ccsa-mobile-api/backups/

# Run restore script from specific backup
bash ccsa-mobile-api/backups/migration_20251116_143022/RESTORE.sh
```

---

## 📈 Migration Timeline

Here's what happens when you run the safe migration:

```
⏱️  TIME  │  PHASE
─────────┼──────────────────────────────────────────
  :00    │ 🚀 Start
  :05    │ ✅ Prerequisites checked
  :10    │ 💾 Database backed up (5 CSV files)
  :15    │ 🔍 Diagnostic complete
  :20    │ 🔄 Migration executed
  :25    │ ✔️  Verification passed
  :30    │ 🔄 Prisma client regenerated
  :35    │ 🎉 Complete!
─────────┴──────────────────────────────────────────
```

**Total time**: 2-5 minutes depending on data size

---

## 🔐 Safety Features

The migration includes multiple safety mechanisms:

1. **Automatic Backup**
   - Creates CSV exports before any changes
   - Timestamped for easy tracking
   - Includes restoration scripts

2. **Data Validation**
   - Verifies data count before and after
   - Checks for NULL values
   - Validates foreign keys

3. **Constraint Verification**
   - Ensures new constraint can be created
   - Checks for conflicts
   - Validates schema

4. **Transaction Support**
   - All-or-nothing execution
   - Atomic operations
   - Rollback on error

5. **Comprehensive Logging**
   - Full log file created
   - Timestamped entries
   - Error tracking

---

## 📚 Available Commands

```bash
# Comprehensive safe migration (RECOMMENDED)
npm run migrate:safe

# Individual operations
npm run migrate:backup          # Create backup only
npm run migrate:restore         # Restore from backup
npm run migrate:verify          # Verify database state

# Prisma built-in commands
npx prisma migrate deploy       # Run pending migrations
npx prisma generate            # Regenerate client
npx prisma validate            # Validate schema
npx prisma studio              # View database GUI
```

---

## 📞 Emergency Contacts & Support

If you encounter issues:

### 1. Check Logs
```bash
# View latest migration log
tail -f migration_*.log

# View all recent logs
ls -lt migration_*.log | head -5
```

### 2. Database Status
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check permissions table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permissions"

# Check schema
psql $DATABASE_URL -c "\d permissions"
```

### 3. Prisma Status
```bash
# Check migration status
npx prisma migrate status

# Check schema validity
npx prisma validate

# View Prisma docs
npx prisma studio
```

### 4. Restore if Needed
```bash
# Find latest backup
ls -t ccsa-mobile-api/backups/ | head -1

# Restore from it
bash ccsa-mobile-api/backups/migration_20251116_xxxxxx/RESTORE.sh
```

---

## ✨ Next Steps

1. **Read this document** completely
2. **Run diagnostics**:
   ```bash
   npm run migrate:verify
   ```
3. **Create backup** (even though safe-migrate does it):
   ```bash
   npm run migrate:backup
   ```
4. **Execute migration**:
   ```bash
   npm run migrate:safe
   ```
5. **Verify success**:
   ```bash
   npm run migrate:verify
   npm run dev
   ```
6. **Test your app**:
   - Check permission-based features
   - Verify role assignments work
   - Test user access controls

---

## 🎯 Success Criteria

After migration completes successfully, you should have:

✅ All 20 permission records preserved  
✅ `resource` column removed  
✅ `category` column populated with resource data  
✅ Unique constraint on `[category, action]` working  
✅ All API endpoints functioning  
✅ Permission checks working correctly  
✅ Role-based access control operational  
✅ No orphaned foreign keys  

---

## 📝 Final Checklist

- [ ] Read this complete guide
- [ ] Database backup exists (`npm run migrate:backup`)
- [ ] Diagnostic check passed (`npm run migrate:verify`)
- [ ] Team notified of migration
- [ ] Ready for migration (`npm run migrate:safe`)
- [ ] Migration completed successfully
- [ ] Verification passed
- [ ] Application tested
- [ ] Permission features working
- [ ] Team notified of completion

---

## 🎉 You're Ready!

Everything is configured for a **safe, zero-data-loss migration**. 

Run:
```bash
npm run migrate:safe
```

And you'll be done! 🚀

For any questions, refer back to this guide or check the individual script files in `scripts/`.

Good luck! 💪
