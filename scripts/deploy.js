#!/usr/bin/env node

/**
 * Production Deployment Script for CCSA Mobile API
 * This script prepares the application for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production deployment preparation...\n');

// Set production environment
process.env.NODE_ENV = 'production';

try {
  // 1. Clean previous builds
  console.log('📦 Cleaning previous builds...');
  try {
    execSync('rm -rf .next dist build', { stdio: 'inherit' });
  } catch (e) {
    // Ignore if files don't exist
  }

  // 2. Install production dependencies
  console.log('📥 Installing production dependencies...');
  execSync('npm ci --production=false', { stdio: 'inherit' });

  // 3. Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 4. Run database migrations
  console.log('🗄️  Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (e) {
    console.warn('⚠️  Database migration failed, using db push instead...');
    execSync('npx prisma db push', { stdio: 'inherit' });
  }

  // 5. Build the application
  console.log('🏗️  Building application...');
  execSync('NODE_ENV=production npx next build', { stdio: 'inherit' });

  // 6. Run production checks
  console.log('✅ Running production checks...');
  
  // Check if build was successful
  const buildDir = path.join(__dirname, '../.next');
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found. Build may have failed.');
  }

  // Check for required files
  const requiredFiles = [
    '.next/package.json',
    '.next/BUILD_ID',
    '.next/routes-manifest.json'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Warning: ${file} not found`);
    }
  }

  console.log('\n🎉 Production build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   • Run: npm start (to start production server)');
  console.log('   • Or deploy the .next folder to your hosting platform');
  console.log('   • Make sure all environment variables are set in production');
  console.log('   • Ensure database connection is configured');

} catch (error) {
  console.error('\n❌ Production build failed:', error.message);
  process.exit(1);
}
