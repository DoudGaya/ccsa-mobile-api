# ⚡ QUICK START - Safe Migration in 3 Steps

## 🚀 TL;DR (Just Want to Run It?)

```bash
cd ccsa-mobile-api
npm run migrate:safe
```

Done! ✅

---

## 📋 Before You Run It

### Make Sure:
- [ ] `.env` file is in place (already is)
- [ ] Database is accessible (Neon is up)
- [ ] PostgreSQL tools installed (or use the script's built-in support)
- [ ] You have the latest code

### Optional But Recommended:
```bash
# First, just check the current state
npm run migrate:verify
```

This shows you:
- Number of permissions (should be 20)
- Any duplicate category+action combinations
- Current column structure
- Foreign key status

---

## 🎯 The Three Commands You Need to Know

### 1. Run the Safe Migration
```bash
npm run migrate:safe
```
**What it does**: Creates backups, runs migration, verifies, logs everything  
**Time**: 2-5 minutes  
**Result**: If it works → ✅ Done. If it fails → 🔄 Auto-rollback  

### 2. Check if Everything Worked
```bash
npm run migrate:verify
```
**What it does**: Verifies schema, data integrity, constraints, foreign keys  
**Result**: ✅ All good OR ❌ Problems identified  

### 3. If You Need to Undo It
```bash
npm run migrate:restore
```
**What it does**: Restores from automatic backup  
**Prompt**: You'll be asked to select which backup to restore  
**Result**: Database back to pre-migration state  

---

## 🏃 Quick Workflow

```bash
# Step 1: Verify current state (optional but smart)
npm run migrate:verify

# Step 2: Run the migration (automatic backup included)
npm run migrate:safe

# Step 3: Verify it worked
npm run migrate:verify

# Step 4: Test your app
npm run dev
```

---

## ⚠️ Windows Users

If you get bash errors, use:

```bash
# Instead of npm scripts, run directly:
bash scripts/safe-migrate.sh
```

Or in PowerShell:
```powershell
bash scripts/safe-migrate.sh
```

---

## 🆘 Something Went Wrong?

### "Migration failed"
→ **Don't worry!** It auto-rolled back. Check the log file:
```bash
tail -f migration_*.log
```

### "Can't connect to database"
→ Make sure `.env` has the right DATABASE_URL

### "Permission denied"
→ Try: `bash scripts/safe-migrate.sh` instead

### "I want to undo it"
→ Run: `npm run migrate:restore`

---

## ✅ Success Looks Like This

After running `npm run migrate:safe`, you should see:

```
✅ MIGRATION SUCCESSFUL

Backup location: ccsa-mobile-api/backups/migration_20251116_143022
Log file: migration_20251116_143022.log

Next steps:
  1. Test your application: npm run dev
  2. Verify permissions are working
  3. Check logs for any errors
```

---

## 📚 Need More Details?

- **Full guide**: Open `MIGRATION_GUIDE.md`
- **How it works**: Open `SAFE_MIGRATION_INSTRUCTIONS.md`
- **What was created**: Open `MIGRATION_SETUP_COMPLETE.md`

---

## 🎯 What Happens

| Step | Time | Action |
|------|------|--------|
| 1 | :05 | ✅ Check requirements |
| 2 | :10 | 💾 Create backups |
| 3 | :15 | 🔍 Diagnostic check |
| 4 | :20 | 🚀 Run migration |
| 5 | :25 | ✔️ Verify data |
| 6 | :30 | 🔄 Update client |
| 7 | :35 | ✅ Done |

---

## 💾 Your Backups

After migration runs, backups are saved in:
```
ccsa-mobile-api/backups/migration_YYYYMMDD_HHMMSS/

Inside you'll find:
- permissions.csv
- role_permissions.csv
- user_permissions.csv
- roles.csv
- user_roles.csv
- RESTORE.sh (to restore if needed)
```

Keep these! You can restore if needed.

---

## 🎉 Ready?

```bash
cd ccsa-mobile-api
npm run migrate:safe
```

Then grab a coffee ☕ while it runs!

---

## 📞 Quick Help

| Need | Command |
|------|---------|
| Run migration | `npm run migrate:safe` |
| Check status | `npm run migrate:verify` |
| Restore backup | `npm run migrate:restore` |
| Manual backup | `npm run migrate:backup` |
| Help menu | `bash scripts/backup-restore.sh help` |
| View logs | `tail -f migration_*.log` |

---

**That's it! You've got this.** 🚀
