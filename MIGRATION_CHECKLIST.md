# ✅ PRE-MIGRATION CHECKLIST

Use this checklist before running the migration to ensure everything is ready.

## 🔍 Pre-Migration Verification

### Environmental Setup
- [ ] `.env` file exists in `ccsa-mobile-api/` directory
- [ ] `DATABASE_URL` is set in `.env`
- [ ] Database is accessible (can connect via psql/Prisma)
- [ ] You have write permissions to the project directory
- [ ] Internet connection available

### Prerequisites Installed
- [ ] Node.js is installed (`node --version`)
- [ ] npm is installed (`npm --version`)
- [ ] PostgreSQL client tools available (psql)
  - Linux: `which psql`
  - Mac: `which psql`
  - Windows: Part of PostgreSQL installation
- [ ] Bash available (`bash --version`)

### Project Setup
- [ ] Latest code pulled from repository
- [ ] `npm install` has been run recently
- [ ] `node_modules` directory exists
- [ ] `.gitignore` includes backups/ directory
- [ ] Enough disk space for backups (~10MB minimum)

### Documentation Read
- [ ] Read: `QUICK_START_MIGRATION.md` (5 min)
- [ ] Understand: What the migration does
- [ ] Know: How to undo if needed (`npm run migrate:restore`)
- [ ] Familiar with: Basic npm commands

---

## 🔗 Connection Verification

Run these commands to verify everything is connected:

```bash
# 1. Check Node.js
node --version
# Expected: v16+ or v18+

# 2. Check npm
npm --version
# Expected: 8+

# 3. Check Prisma
npx prisma --version
# Expected: Prisma version info

# 4. Check database connection
# Windows/Mac:
psql $DATABASE_URL -c "SELECT 1"
# Linux:
psql "$DATABASE_URL" -c "SELECT 1"
# Expected: (1 row)

# 5. Check Prisma connectivity
npx prisma validate
# Expected: ✅ validation successful
```

---

## 🗄️ Database State Verification

Before migration, check the current database state:

```bash
# Check current permissions table
npm run migrate:verify
```

You should see:
- ✅ Total permissions: 20 (or similar)
- ✅ Resource column: EXISTS
- ✅ Category column: STATUS (may not exist yet)
- ✅ No duplicate category+action combinations
- ✅ Foreign keys: VALID

---

## 📝 Pre-Migration Checklist

### System Requirements
- [ ] Operating System: Windows / Mac / Linux
- [ ] Node.js: 16+
- [ ] npm: 8+
- [ ] RAM available: 500MB+
- [ ] Disk space: 100MB+

### Database Requirements
- [ ] PostgreSQL version: 12+
- [ ] Database: neondb (NeonDB)
- [ ] Current permissions: 20 records
- [ ] Connection: STABLE (not over quota)
- [ ] Schema: CURRENT (up-to-date)

### Project Requirements
- [ ] Git: Latest code pulled
- [ ] Dependencies: npm install run
- [ ] Env file: .env configured
- [ ] Backups: Directory writable
- [ ] Logs: Directory writable

### Knowledge Requirements
- [ ] Read: Migration guide (minimum QUICK_START)
- [ ] Understand: What changes in database
- [ ] Know: How to verify success
- [ ] Know: How to restore if needed
- [ ] Comfortable: Using terminal/bash

---

## 🎯 Go / No-Go Decision

### Go: If all of these are true
- ✅ All checkboxes above are checked
- ✅ Database connection works
- ✅ Documentation read
- ✅ Backups directory writable
- ✅ No production issues currently
- ✅ Team notified (if applicable)

### No-Go: If any of these are true
- ❌ Connection to database fails
- ❌ Missing dependencies
- ❌ Low disk space
- ❌ Documentation not read
- ❌ Uncertain about process
- ❌ Production has active issues

**No-Go Action**: Fix the issue, then re-check

---

## 🚀 Migration Execution

Once all checkboxes are complete, proceed:

```bash
cd ccsa-mobile-api

# Final verification (optional but recommended)
npm run migrate:verify

# Run the migration
npm run migrate:safe

# Monitor the process (wait 2-5 minutes)

# Verify success
npm run migrate:verify

# Test the application
npm run dev
```

---

## ✅ Post-Migration Checklist

After migration completes, verify success:

### Immediate Checks (1 minute)
- [ ] Migration script completed without errors
- [ ] Log file created (migration_*.log)
- [ ] Backup directory populated (backups/migration_*/...)
- [ ] No fatal errors in output

### Verification Checks (2 minutes)
```bash
npm run migrate:verify
```
- [ ] ✅ Resource column removed
- [ ] ✅ Category column exists
- [ ] ✅ 20 permissions preserved
- [ ] ✅ No NULL values
- [ ] ✅ No duplicate category+action
- [ ] ✅ Foreign keys valid
- [ ] ✅ Constraints applied

### Application Checks (3 minutes)
```bash
npm run dev
```
- [ ] Application starts without errors
- [ ] No compilation errors
- [ ] Can access: http://localhost:3000
- [ ] Can access: http://localhost:3000/api/health
- [ ] Permission-based features work
- [ ] Role-based features work
- [ ] User access control works

### Data Checks (2 minutes)
```bash
npx prisma studio
# Then check: permissions table
```
- [ ] Can view permissions in Prisma Studio
- [ ] All permissions displayed correctly
- [ ] Category values visible
- [ ] Action values correct
- [ ] No missing fields
- [ ] 20 records present

### Relationship Checks (2 minutes)
```bash
npx prisma studio
# Then check: role_permissions and user_permissions
```
- [ ] role_permissions still linked
- [ ] user_permissions still linked
- [ ] All foreign keys intact
- [ ] No broken relationships
- [ ] Can navigate relationships

---

## 🆘 If Something Goes Wrong

### Migration Failed - Automatic Rollback

The migration script should have automatically rolled back. Verify:

1. Check the log file:
   ```bash
   tail -f migration_*.log
   ```

2. Verify database state:
   ```bash
   npm run migrate:verify
   ```

3. If everything looks ok, retry:
   ```bash
   npm run migrate:safe
   ```

### Want to Manually Rollback

```bash
# Find your backup
ls ccsa-mobile-api/backups/

# Restore from it
npm run migrate:restore

# Or manually run restore script
bash ccsa-mobile-api/backups/migration_YYYYMMDD_HHMMSS/RESTORE.sh
```

### Database Connection Lost

```bash
# Verify connection
psql "$DATABASE_URL" -c "SELECT 1"

# If failed, check:
# 1. DATABASE_URL in .env
# 2. Internet connection
# 3. NeonDB status
# 4. Firewall rules

# Then retry
npm run migrate:safe
```

---

## 📞 Support Resources

### Quick Help
- **Quick reference**: See `QUICK_START_MIGRATION.md`
- **Common issues**: See `MIGRATION_GUIDE.md` → Troubleshooting
- **Scripts help**: `bash scripts/backup-restore.sh help`

### Detailed Help
- **Complete guide**: See `MIGRATION_GUIDE.md`
- **Technical details**: See `SAFE_MIGRATION_INSTRUCTIONS.md`
- **What was created**: See `MIGRATION_SETUP_COMPLETE.md`

### Emergency
- **Undo everything**: `npm run migrate:restore`
- **Check logs**: `tail -f migration_*.log`
- **Database status**: `npm run migrate:verify`

---

## 🎯 Success!

If all post-migration checks pass, your migration is complete! ✅

### Next Steps
1. Commit the changes (migration is now in history)
2. Deploy to staging/production as needed
3. Monitor for any permission-related issues
4. Keep backups for audit trail

### Cleanup (Optional)
```bash
# Keep backups for at least 30 days
# After 30 days, can be deleted if no issues found

# Remove old backups (keep recent ones):
rm -rf ccsa-mobile-api/backups/migration_*
```

---

## 📋 Sign-Off

- [ ] All pre-migration checks passed
- [ ] Migration executed successfully
- [ ] All post-migration checks passed
- [ ] Application tested and working
- [ ] Permission features verified
- [ ] Role features verified
- [ ] Team notified of completion
- [ ] Backups stored safely
- [ ] Ready for production deployment

---

**Date Completed**: ___________  
**Performed By**: ___________  
**Verified By**: ___________  

---

**Great job!** 🎉 Your database migration is complete and verified safe!
