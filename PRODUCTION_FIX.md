# 🚨 CCSA API Production Authentication Fix

## Issue Diagnosis
The production deployment is failing because NextAuth is receiving HTML instead of JSON when trying to fetch the session. This is typically caused by:

1. **Missing or incorrect `NEXTAUTH_URL` environment variable**
2. **Missing `NEXTAUTH_SECRET` environment variable** 
3. **Incorrect authentication configuration for production**

## 🔧 Required Fixes

### 1. Vercel Environment Variables
**❗ CRITICAL:** Add these environment variables in your Vercel dashboard:

```bash
NEXTAUTH_URL=https://ccsa-mobile-1eeap3vjz-doudgayas-projects.vercel.app
NEXTAUTH_SECRET=your-very-secure-secret-key-minimum-32-characters
NODE_ENV=production
```

**Steps to add environment variables in Vercel:**
1. Go to your Vercel dashboard
2. Select your project: `ccsa-mobile`
3. Go to Settings → Environment Variables
4. Add each variable with the values above
5. Ensure they're set for "Production" environment

### 2. Database Connection
Ensure your production database URL is set:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_ODtzkedBZ4U0@ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=25&pool_timeout=30&connect_timeout=10
```

### 3. Other Production Variables
```bash
# Firebase (should already be set)
FIREBASE_PROJECT_ID=ccsa-mobile
FIREBASE_PRIVATE_KEY_ID=bfdf68794944a511643d3f9d594fa8c4beda3885
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ccsa-mobile.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# External APIs
NIN_API_BASE_URL=https://e-nvs.digitalpulseapi.net
NIN_API_KEY=CCVb73G1EDmPpU4z13s4BWA

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=adaag.ad@gmail.com
EMAIL_PASSWORD="pxmm bgcc fajy udyw"

# CORS
CORS_ORIGIN=https://ccsa-mobile-1eeap3vjz-doudgayas-projects.vercel.app
```

## 🚀 Deployment Steps

### Step 1: Update Environment Variables
1. **Login to Vercel Dashboard**
2. **Navigate to Project Settings → Environment Variables**
3. **Add/Update all variables listed above**
4. **Save changes**

### Step 2: Redeploy
After setting environment variables, trigger a new deployment:
```bash
# Option A: Push a commit to trigger auto-deployment
git add .
git commit -m "fix: production authentication configuration"
git push

# Option B: Manual redeploy in Vercel dashboard
# Go to Deployments tab and click "Redeploy"
```

### Step 3: Verify Deployment
After redeployment, test these endpoints:
- `https://your-vercel-url.vercel.app/api/auth/session` (should return JSON, not HTML)
- `https://your-vercel-url.vercel.app/api/health` (should return healthy status)
- `https://your-vercel-url.vercel.app/api/farmers` (should work with proper authentication)

## 🔍 Troubleshooting

### If still getting HTML responses:
1. Check Vercel function logs for errors
2. Verify `NEXTAUTH_URL` exactly matches your domain
3. Ensure `NEXTAUTH_SECRET` is set and not empty
4. Check that all environment variables are set for "Production" environment

### If database connection fails:
1. Verify `DATABASE_URL` is correctly formatted
2. Test database connection from Prisma Studio
3. Check database connection limits (current: 25 connections)

### If authentication still fails:
1. Check Firebase configuration is complete
2. Verify mobile app is sending proper Authorization headers
3. Test with a simple API endpoint first

## 📝 Files Modified

The following files have been updated to fix production issues:
- ✅ `pages/api/auth/[...nextauth].js` - Added production-specific configuration
- ✅ `lib/authMiddleware.js` - Improved logging and error handling  
- ✅ `next.config.js` - Added NextAuth-specific headers
- ✅ Production environment template created

## ⚡ Quick Fix Command

Run this after setting environment variables:
```bash
chmod +x scripts/fix-production.sh
./scripts/fix-production.sh
```

## 🔄 Expected Results

After implementing these fixes:
- ✅ NextAuth session endpoint returns JSON (not HTML)
- ✅ Authentication middleware works properly
- ✅ Database queries return real data
- ✅ Mobile app can fetch farmer data
- ✅ All API endpoints function correctly

---

**🚨 Important:** The production deployment will not work until the `NEXTAUTH_URL` and `NEXTAUTH_SECRET` environment variables are properly set in Vercel.
