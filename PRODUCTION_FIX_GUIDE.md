# 🚨 COMPLETE PRODUCTION FIX GUIDE

Your Neon database keeps suspending. Here's how to fix everything in one go when it wakes up.

---

## Issue Summary

1. **Database suspends** - Neon free tier auto-suspends after 5 mins inactivity
2. **Data type mismatch** - `secondaryCrop` is stored as text[] but schema expects String
3. **Missing SSO columns** - Need to add SSO fields to users table
4. **No user account** - Need to create your admin user

---

## OPTION 1: Quick Fix (Keep Database Awake)

### Step 1: Wake Database & Keep It Alive
```bash
# Start dev server first - this keeps database alive
npm run dev

# Leave this running in one terminal
```

### Step 2: Run Fixes (In New Terminal)
```bash
# Open new terminal
cd ccsa-mobile-api

# Fix secondaryCrop (while server is running)
node scripts/fix-secondary-crop.js

# Add SSO columns
node scripts/add-sso-columns.js

# Regenerate Prisma
npx prisma generate

# Create user
node scripts/setup-user-and-sso.js
```

### Step 3: Restart Server
```bash
# Stop old server (Ctrl+C in first terminal)
npm run dev

# Try logging in
```

---

## OPTION 2: One-Command Fix

I'll create a single script that does everything:

```bash
# This will keep retrying if DB is suspended
node scripts/complete-production-fix.js
```

---

## OPTION 3: Update Neon Settings (Best Long-term)

1. Go to https://console.neon.tech
2. Select your project
3. Go to **Settings** > **Compute**
4. Change **Auto-suspend delay** to **Max (5 hours)**
5. This gives you more time before it suspends

---

## Quick Recovery Commands

If database suspends mid-process:

```bash
# Test if DB is up
node scripts/test-db-connection.js

# If down, wake it from Neon console or:
# 1. Start dev server (npm run dev)
# 2. Wait 30 seconds
# 3. Run your fix scripts
```

---

## After All Fixes Complete

Your login credentials will be:
- **Email**: `abdulrahman.dauda@cosmopolitan.edu.ng`
- **Password**: `changeme123`
- **URL**: http://localhost:3000/auth/signin

You can use **either**:
- Credentials (email/password)
- Google SSO button

---

## If You're Stuck

The database suspension is the root cause. Two solutions:

**Immediate:**
1. Keep `npm run dev` running (makes requests every few seconds)
2. Run fix scripts quickly while it's alive

**Long-term:**
1. Upgrade Neon plan (removes auto-suspend)
2. Or switch to a database that doesn't auto-suspend

---

Let me know which option you prefer and I'll help you execute it!
