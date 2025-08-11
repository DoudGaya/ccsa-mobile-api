#!/usr/bin/env bash

# CCSA API Production Fix Script
# This script addresses the NextAuth session authentication issue in production

echo "🔧 Fixing CCSA API Production Authentication Issues"
echo "=================================================="

# 1. Set Node environment to production
export NODE_ENV=production

# 2. Check if we're running on Vercel
if [ ! -z "$VERCEL" ]; then
    echo "📍 Running on Vercel platform"
    
    # 3. Set critical environment variables for Vercel
    echo "🔐 Setting up authentication environment variables..."
    
    # These should be set in Vercel dashboard
    echo "⚠️  CRITICAL: Ensure these environment variables are set in Vercel:"
    echo "   - NEXTAUTH_URL: https://your-vercel-domain.vercel.app"
    echo "   - NEXTAUTH_SECRET: secure-random-string-for-production"
    echo "   - DATABASE_URL: your-production-database-connection-string"
    echo "   - NODE_ENV: production"
else
    echo "📍 Running locally or on other platform"
fi

# 4. Regenerate Prisma client for production
echo "🔄 Regenerating Prisma client for production..."
npx prisma generate

# 5. Push database schema to ensure it's up to date
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

# 6. Build the application with production settings
echo "🏗️  Building application for production..."
npm run build

# 7. Verify the build was successful
if [ -d ".next" ]; then
    echo "✅ Build successful - .next directory exists"
else
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

# 8. Check for required NextAuth files
if [ -f ".next/server/pages/api/auth/[...nextauth].js" ]; then
    echo "✅ NextAuth API route built successfully"
else
    echo "⚠️  NextAuth API route may not have built correctly"
fi

echo ""
echo "🎉 Production fix completed!"
echo ""
echo "📋 IMPORTANT: In your Vercel dashboard, set these environment variables:"
echo ""
echo "NEXTAUTH_URL=https://ccsa-mobile-1eeap3vjz-doudgayas-projects.vercel.app"
echo "NEXTAUTH_SECRET=your-secure-production-secret-key"
echo "NODE_ENV=production"
echo ""
echo "🔗 Then redeploy your application for the changes to take effect."
