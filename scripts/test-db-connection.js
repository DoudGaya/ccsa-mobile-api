#!/usr/bin/env node

/**
 * Database Connection Test Utility
 * Tests NeonDB PostgreSQL connection and provides diagnostics
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient({
  log: ['error', 'warn', 'info', 'query'],
  errorFormat: 'pretty',
});

async function testDatabaseConnection() {
  console.log('🔍 Testing NeonDB PostgreSQL Connection...');
  console.log('📊 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));
  
  const startTime = Date.now();
  
  try {
    // Test 1: Basic connection
    console.log('\n📡 Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully');
    
    // Test 2: Raw query test
    console.log('\n🔍 Testing raw query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query successful:', result);
    
    // Test 3: Database info query
    console.log('\n📊 Checking database info...');
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `;
    console.log('✅ Database info:', dbInfo[0]);
    
    // Test 4: Check table existence
    console.log('\n📋 Checking core tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
    
    // Test 5: Simple model query
    console.log('\n👤 Testing user model query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}`);
    
    // Test 6: Farmer model query
    console.log('\n🌾 Testing farmer model query...');
    const farmerCount = await prisma.farmer.count();
    console.log(`✅ Farmers in database: ${farmerCount}`);
    
    const endTime = Date.now();
    console.log(`\n🎉 All tests passed! Total time: ${endTime - startTime}ms`);
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`\n❌ Database connection failed after ${endTime - startTime}ms`);
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    if (error.meta?.target) {
      console.error('Target:', error.meta.target);
    }
    
    // Provide diagnostic suggestions
    console.log('\n🔧 Diagnostic suggestions:');
    
    if (error.message.includes("Can't reach database server")) {
      console.log('- NeonDB server may be temporarily down');
      console.log('- Check NeonDB dashboard for service status');
      console.log('- Verify connection string is correct');
      console.log('- Check if your IP is whitelisted (if applicable)');
    }
    
    if (error.message.includes('connection_limit')) {
      console.log('- Connection pool may be exhausted');
      console.log('- Consider reducing connection pool size');
      console.log('- Check for connection leaks in application');
    }
    
    if (error.message.includes('timeout')) {
      console.log('- Network or query timeout occurred');
      console.log('- Consider increasing timeout values');
      console.log('- Check network connectivity');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testDatabaseConnection()
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });