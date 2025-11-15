# 🚀 SSO Production Deployment Guide

## Pre-Deployment Checklist

- [ ] Database is online and healthy
- [ ] All code changes have been reviewed
- [ ] Environment variables prepared
- [ ] Google OAuth credentials obtained
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Team notification sent

---

## Step 1: Environment Variables Setup

### Local Development (.env.local)
```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate random

# Frontend (for conditional rendering)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

### Production (.env or Vercel Settings)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_PROD_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_PROD_GOOGLE_CLIENT_SECRET

# NextAuth
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=YOUR_PROD_RANDOM_SECRET

# Frontend
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_PROD_GOOGLE_CLIENT_ID
```

### How to Generate NEXTAUTH_SECRET
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32|ForEach-Object{[byte](Get-Random -Maximum 256)}))
```

---

## Step 2: Google OAuth Setup

### Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "CCSA Admin"
3. Go to APIs & Services > OAuth consent screen
4. Configure consent screen:
   - User type: Internal
   - App name: CCSA Farmers Admin
   - User support email: admin@cosmopolitan.edu.ng
   - Developer contact: your-email@cosmopolitan.edu.ng

### Create OAuth 2.0 Credentials
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > OAuth 2.0 Client ID
3. Choose: Web application
4. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google        # Development
   https://your-staging-domain.com/api/auth/callback/google  # Staging
   https://your-production-domain.com/api/auth/callback/google # Production
   ```
5. Copy Client ID and Client Secret

---

## Step 3: Enable SSO for Users

### Option A: Manual Per-User
1. Deploy the code to staging/production
2. Log in as super_admin
3. Go to Users management
4. Find a user
5. Toggle "Enable SSO Login"
6. Save changes

### Option B: Bulk Enable (Script)

Create `scripts/enable-sso-for-all-users.js`:
```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function enableSSO() {
  try {
    const result = await prisma.user.updateMany({
      where: { isActive: true },  // Only active users
      data: { isSSOEnabled: true }
    })
    console.log(`✅ Enabled SSO for ${result.count} users`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableSSO()
```

Run it:
```bash
cd ccsa-mobile-api
node scripts/enable-sso-for-all-users.js
```

### Option C: Bulk Enable (API)
```bash
curl -X POST https://your-domain.com/api/users/sso/bulk \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1_id", "user2_id", "user3_id"],
    "isSSOEnabled": true
  }'
```

---

## Step 4: Deploy to Production

### Vercel Deployment
```bash
# Set environment variables in Vercel dashboard
# Then push to main branch
git push origin main

# Vercel auto-deploys
```

### Manual Deployment
```bash
# Build
npm run build

# Test build
npm run start

# Deploy to your server
# (Copy .next, node_modules, public, pages, lib, etc.)
```

---

## Step 5: Verification Tests

### Test 1: Credentials Login Still Works
```
1. Go to https://your-domain.com/auth/signin
2. Enter admin credentials
3. Should log in successfully
4. Verify dashboard loads
```

### Test 2: Google SSO Button Appears
```
1. If NEXT_PUBLIC_GOOGLE_CLIENT_ID is set:
2. "Sign in with Google" button should appear
3. Click it to test OAuth flow
```

### Test 3: User Not Found Error
```
1. Use Google account NOT in database
2. Click "Sign in with Google"
3. Should see: "User not found in system"
4. Check audit logs (should have entry with status: user_not_found)
```

### Test 4: SSO Disabled Error
```
1. Create a test user with isSSOEnabled = false
2. Try SSO with that user's email
3. Should see: "SSO is not enabled for your account"
4. Check audit logs (should have entry with status: sso_disabled)
```

### Test 5: Successful SSO
```
1. Create/enable SSO for a test user
2. Use Google account with that email
3. Click "Sign in with Google"
4. Should log in successfully
5. Check audit logs (should have entry with status: success)
6. Verify lastSSOLogin timestamp updated
```

### Test 6: Check Audit Logs API
```bash
curl https://your-domain.com/api/admin/sso-audit-logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response should show recent SSO attempts
```

---

## Step 6: Monitor Production

### Daily Checks
- ✅ Are SSO login attempts being logged?
- ✅ Are there any failed attempts?
- ✅ Are credentials logins still working?
- ✅ Check error logs for SSO-related issues

### Monitoring Commands
```bash
# Check recent SSO attempts
SELECT * FROM sso_audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

# Check failed attempts
SELECT email, COUNT(*) as failures 
FROM sso_audit_logs
WHERE status != 'success'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email;

# Check which users have SSO enabled
SELECT id, email, isSSOEnabled, lastSSOLogin
FROM users
WHERE isSSOEnabled = true
ORDER BY lastSSOLogin DESC;
```

---

## Troubleshooting

### Issue: "Google button not showing"
**Solution**: 
- Check `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Rebuild app and clear browser cache
- Check browser console for errors

### Issue: "Redirect URI mismatch"
**Solution**:
- Verify redirect URI in Google Cloud Console matches exactly:
  `https://your-domain.com/api/auth/callback/google`
- Check for trailing slashes, http vs https
- Wait a few minutes for Google to propagate changes

### Issue: "User not found" even though user exists
**Solution**:
- Check user email matches exactly (case-sensitive in some cases)
- Verify `isSSOEnabled = true` for that user
- Check SSOAuditLog for detailed error

### Issue: "Session not persisting"
**Solution**:
- Verify `NEXTAUTH_SECRET` is set and same across all servers
- Check `NEXTAUTH_URL` matches domain exactly
- Verify cookies are enabled in browser
- Check NextAuth logs for errors

### Issue: "Internal Server Error during SSO"
**Solution**:
- Check database is online
- Check Prisma connection string is correct
- Review server logs for detailed error
- Check if user record structure matches schema

---

## Rollback Procedure

### If SSO Causes Critical Issues:

#### Option 1: Disable via Environment (Fastest)
```bash
# In Vercel/your hosting:
# Remove or unset: GOOGLE_CLIENT_ID
# Remove or unset: NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Google button will disappear automatically
# Users can still use credentials
# Redeploy or restart app
```

#### Option 2: Revert Code
```bash
# If code is the issue:
git revert <commit-hash>
git push origin main

# Vercel auto-deploys or redeploy manually
```

#### Option 3: Disable SSO for All Users (Database)
```sql
UPDATE users SET isSSOEnabled = false;

-- Or just for specific users
UPDATE users SET isSSOEnabled = false 
WHERE email IN ('user1@domain.com', 'user2@domain.com');
```

---

## Post-Deployment

### Notify Users
Send email to users with SSO enabled:
```
Subject: New Sign-In Option Available

Hi there,

We've added a new "Sign in with Google" option to the CCSA Admin dashboard. 
You can now use your Google account to log in instead of your password.

Both login methods work - choose whichever you prefer!

If you have any issues, contact the administrator.
```

### Update Documentation
- [ ] Update admin guide with SSO instructions
- [ ] Add troubleshooting section
- [ ] Document the new SSO audit logs feature
- [ ] Update security policy if needed

### Team Communication
- [ ] Notify support team about new SSO feature
- [ ] Share troubleshooting guide
- [ ] Schedule training if needed

---

## Success Indicators

✅ **Successful Deployment When:**
- Google SSO button appears on signin page
- Users can log in with Google (if SSO enabled)
- SSO audit logs are being created
- Dashboard works after SSO login
- Credentials login still works
- No error logs related to SSO

---

## Support & Escalation

**If issues persist:**
1. Check SSO_IMPLEMENTATION_STATUS.md for architecture details
2. Review error logs for specific error messages
3. Check SSOAuditLog table for failed attempts
4. Contact: your-admin@cosmopolitan.edu.ng
5. Escalate: Have rollback plan ready

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Status**: [ ] Success  [ ] Rolled Back  [ ] In Progress  
**Notes**: _________________________________________________

