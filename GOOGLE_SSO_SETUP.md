# 🔐 Google OAuth Setup Guide for SSO

## Prerequisites
- Google account with access to Google Cloud Console
- Your production domain or localhost for development

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account

---

## Step 2: Create or Select a Project

### Create New Project:
1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"NEW PROJECT"**
3. Enter project details:
   - **Project name**: `CCSA Admin` (or any name you prefer)
   - **Organization**: Leave as default or select your organization
4. Click **"CREATE"**
5. Wait for the project to be created (takes ~10 seconds)
6. Select the newly created project from the dropdown

### Or Select Existing Project:
1. Click the project dropdown
2. Select your existing project

---

## Step 3: Enable Google+ API (Required for OAuth)

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to enable

---

## Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **User Type**:
   - **Internal**: If you have Google Workspace (users must be in your organization)
   - **External**: For anyone with a Google account (recommended for most cases)
3. Click **"CREATE"**

### Fill in OAuth Consent Screen:

#### App Information:
- **App name**: `CCSA Farmers Admin System`
- **User support email**: Select your email from dropdown
- **App logo** (optional): Upload your logo (120x120px recommended)

#### App Domain (Required):
- **Application home page**: `https://your-domain.com` (or `http://localhost:3000` for dev)
- **Application privacy policy link**: `https://your-domain.com/privacy` (create this page)
- **Application terms of service link**: `https://your-domain.com/terms` (create this page)

#### Authorized Domains:
- Click **"ADD DOMAIN"**
- Enter: `your-domain.com` (without https://)
- For localhost testing, you can skip this

#### Developer Contact Information:
- **Email addresses**: Enter your admin email

4. Click **"SAVE AND CONTINUE"**

#### Scopes Screen:
1. Click **"ADD OR REMOVE SCOPES"**
2. Select these scopes:
   - ✅ `../auth/userinfo.email`
   - ✅ `../auth/userinfo.profile`
   - ✅ `openid`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

#### Test Users (Only for External Apps in Testing):
1. Click **"ADD USERS"**
2. Add email addresses of users who can test SSO
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

5. Review summary and click **"BACK TO DASHBOARD"**

---

## Step 5: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth 2.0 Client ID"**

### Configure OAuth Client:

#### Application Type:
- Select: **"Web application"**

#### Name:
- Enter: `CCSA Admin Web Client`

#### Authorized JavaScript Origins:
Click **"+ ADD URI"** and add:
```
http://localhost:3000          (for development)
https://your-domain.com        (for production)
```

#### Authorized Redirect URIs:
Click **"+ ADD URI"** and add these **EXACT** URLs:

**For Development:**
```
http://localhost:3000/api/auth/callback/google
```

**For Production:**
```
https://your-domain.com/api/auth/callback/google
```

⚠️ **CRITICAL**: The redirect URI must match EXACTLY, including:
- Protocol (http vs https)
- Domain (localhost vs your-domain.com)
- Port (3000 or none)
- Path (/api/auth/callback/google)

4. Click **"CREATE"**

---

## Step 6: Copy Your Credentials

A popup will appear with your credentials:

```
Your Client ID
1234567890-abcdefghijklmnop.apps.googleusercontent.com

Your Client Secret
GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

1. Click **"DOWNLOAD JSON"** (optional, for backup)
2. Copy the **Client ID**
3. Copy the **Client Secret**
4. Click **"OK"**

⚠️ **Keep these safe!** Don't share them publicly or commit to Git.

---

## Step 7: Add Credentials to Your .env File

Open your `.env` file in the `ccsa-mobile-api` folder and add:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ

# Frontend (MUST be the same as GOOGLE_CLIENT_ID)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE
```

### Generate NEXTAUTH_SECRET:

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32|ForEach-Object{[byte](Get-Random -Maximum 256)}))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` value.

---

## Step 8: Update Production Environment

If deploying to Vercel, Heroku, or other platforms:

### Vercel:
1. Go to your project dashboard
2. Click **"Settings"** > **"Environment Variables"**
3. Add each variable:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXTAUTH_URL` (use your production domain)
   - `NEXTAUTH_SECRET`
4. Click **"Save"**
5. Redeploy your app

### Other Platforms:
- Set environment variables in your hosting platform's dashboard
- Ensure `NEXTAUTH_URL` matches your production domain

---

## Step 9: Test SSO

### Local Testing:

1. Start your development server:
   ```bash
   cd ccsa-mobile-api
   npm run dev
   ```

2. Open browser: `http://localhost:3000/auth/signin`

3. You should see:
   - Email/password form (credentials login)
   - **"Or continue with"** divider
   - **"Google"** button with Google logo

4. Click the **"Google"** button

5. You'll be redirected to Google's login page

6. **IMPORTANT**: 
   - The email you use **MUST exist in your database**
   - The user must have `isSSOEnabled = true` in the database
   - Otherwise you'll see an error message

### Expected Behaviors:

✅ **Success**: User exists + SSO enabled → Redirects to dashboard  
❌ **Error**: "User not found in system" → Email not in database  
❌ **Error**: "SSO is not enabled for your account" → User has `isSSOEnabled = false`

---

## Step 10: Enable SSO for Users

Before users can login with Google, you need to enable SSO in the database:

### Option A: Enable for One User (SQL)
```sql
UPDATE users 
SET "isSSOEnabled" = true 
WHERE email = 'user@example.com';
```

### Option B: Enable for All Users (SQL)
```sql
UPDATE users 
SET "isSSOEnabled" = true 
WHERE "isActive" = true;
```

### Option C: Use the Admin API
```bash
curl -X PUT https://your-domain.com/api/users/USER_ID/sso \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isSSOEnabled": true}'
```

---

## Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution**: 
- Check the redirect URI in Google Console matches **exactly**
- Common mistakes:
  - `http://localhost:3000/api/auth/callback/google` ✅
  - `http://localhost:3000/api/auth/callback/google/` ❌ (trailing slash)
  - `https://localhost:3000/api/auth/callback/google` ❌ (https instead of http)

### Issue: Google button not showing
**Solution**:
- Check `.env` has `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set
- Restart your dev server (`npm run dev`)
- Clear browser cache and reload

### Issue: "User not found"
**Solution**:
- The Google email must match a user in your `users` table
- Create the user first via the admin panel

### Issue: "SSO is not enabled for your account"
**Solution**:
- Run: `UPDATE users SET "isSSOEnabled" = true WHERE email = 'user@example.com';`

### Issue: "Access blocked: This app's request is invalid"
**Solution**:
- You need to publish your OAuth consent screen
- Or add the user as a test user in Google Console

---

## Security Best Practices

1. ✅ **Never commit** `.env` to Git (add to `.gitignore`)
2. ✅ **Use different credentials** for dev and production
3. ✅ **Rotate secrets** periodically
4. ✅ **Enable only for verified users** (set `isSSOEnabled = true` selectively)
5. ✅ **Monitor audit logs** at `/api/admin/sso-audit-logs`
6. ✅ **Keep credentials private** - don't share Client Secret

---

## Next Steps

After setup:
1. ✅ Test SSO login works
2. ✅ Enable SSO for your admin users
3. ✅ Monitor the SSO audit logs
4. ✅ Update your user documentation
5. ✅ Train support team on SSO troubleshooting

---

## Quick Reference

**Google Cloud Console**: https://console.cloud.google.com  
**OAuth Credentials**: APIs & Services > Credentials  
**Consent Screen**: APIs & Services > OAuth consent screen  

**Environment Variables Needed**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same as GOOGLE_CLIENT_ID)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

**Redirect URI Format**:
```
{NEXTAUTH_URL}/api/auth/callback/google
```

**Enable SSO for User**:
```sql
UPDATE users SET "isSSOEnabled" = true WHERE email = 'user@example.com';
```

---

**Need help?** Check the SSO_IMPLEMENTATION_STATUS.md file for more details.
