# 🚨 FINAL SETUP STEPS - DO THIS WHEN DATABASE IS ONLINE

## Current Status
✅ Migrations fixed and deployed
✅ Prisma Client regenerated  
✅ SSO code updated (no more ANSI color error)
❌ Database is offline (Neon suspended)

---

## Step-by-Step (When Database is Online)

### 1️⃣ Wake Up Neon Database
1. Go to: https://console.neon.tech
2. Sign in
3. Find project: `ep-withered-wind-ad4vodrm`
4. Click **Resume** or **Wake Up**
5. Wait 30 seconds

---

### 2️⃣ Create Your User Account
```bash
cd ccsa-mobile-api
node scripts/setup-user-and-sso.js
```

This will:
- Create user: `abdulrahman.dauda@cosmopolitan.edu.ng`
- Set temporary password: `changeme123`
- Enable SSO for this user
- Assign super_admin role

---

### 3️⃣ Start Development Server
```bash
npm run dev
```

---

### 4️⃣ Test Login - Two Ways

#### Option A: Credentials Login
1. Go to: http://localhost:3000/auth/signin
2. Email: `abdulrahman.dauda@cosmopolitan.edu.ng`
3. Password: `changeme123`
4. Should redirect to dashboard

#### Option B: Google SSO
1. Go to: http://localhost:3000/auth/signin
2. Click **"Sign in with Google"** button
3. Choose your `@cosmopolitan.edu.ng` Google account
4. Should redirect to dashboard

---

## What Was Fixed

### Issue 1: "Email not authorized" ✅
**Cause**: User didn't exist in database  
**Fix**: Script creates user with SSO enabled

### Issue 2: "Invalid character in header" ✅
**Cause**: Prisma error messages contain ANSI color codes  
**Fix**: Updated NextAuth callback to:
- Strip ANSI codes from errors
- Return clean redirect URLs instead of throwing errors
- Handle all errors gracefully

### Issue 3: "Unknown field rolePermissions" ✅
**Cause**: Prisma Client was out of sync  
**Fix**: Ran `npx prisma generate` to regenerate client

---

## Error Messages (Fixed)

Before SSO login, you might see these **expected** errors:

### ✅ "User not found in system"
**Meaning**: Email not in database  
**Solution**: Run the setup script to create user

### ✅ "SSO is not enabled for your account"  
**Meaning**: User exists but `isSSOEnabled = false`  
**Solution**: Script sets `isSSOEnabled = true`

### ✅ "An error occurred during sign-in"
**Meaning**: Generic error (check server logs)  
**Solution**: Check terminal for details

---

## Troubleshooting

### Database Still Won't Connect
```bash
# Test connection
cd ccsa-mobile-api
node scripts/test-db-connection.js
```

If it fails:
- Check Neon console - is it actually running?
- Try pinging from Neon's SQL editor
- Wait a few minutes - first connection after suspend takes time

### SSO Button Not Showing
Check `.env` has:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=391097625860-ulhgpckvkk0d0nve3692a07ai16slauh.apps.googleusercontent.com
```

Restart dev server after adding.

### "AccessDenied" After Google Login
This means one of:
1. User doesn't exist in DB → Run setup script
2. User has `isSSOEnabled = false` → Run setup script
3. Database is offline → Wake up Neon

---

## Quick Commands Reference

```bash
# Wake database + setup user
node scripts/setup-user-and-sso.js

# Start dev server
npm run dev

# Test database
node scripts/test-db-connection.js

# Check migration status
npx prisma migrate status

# Regenerate Prisma (if schema changes)
npx prisma generate
```

---

## Production Checklist

Before deploying to production:

- [ ] Change default password `changeme123`
- [ ] Create users for your team
- [ ] Enable SSO only for verified users
- [ ] Test both login methods
- [ ] Monitor SSO audit logs: `/api/admin/sso-audit-logs`
- [ ] Set up proper Google OAuth app (not test credentials)
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate new `NEXTAUTH_SECRET`

---

## Next Steps

1. **Right now**: Wake up Neon database at console.neon.tech
2. **Then**: Run `node scripts/setup-user-and-sso.js`
3. **Finally**: Run `npm run dev` and test both login methods

Everything is ready - just waiting for database to come online! 🚀
