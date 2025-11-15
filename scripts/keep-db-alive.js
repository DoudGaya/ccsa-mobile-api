#!/usr/bin/env node

/**
 * Keep Neon Database Alive During Development
 * Prevents free tier auto-suspend by pinging every 4 minutes
 * 
 * Usage: node scripts/keep-db-alive.js
 * 
 * Press Ctrl+C to stop
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (before 5-min auto-suspend)
let pingCount = 0;

async function pingDatabase() {
  try {
    const start = Date.now();
    const result = await prisma.$executeRaw`SELECT 1 as ping`;
    const duration = Date.now() - start;
    
    pingCount++;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Ping #${pingCount} successful (${duration}ms)`);
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Ping failed:`, error.code || error.message);
    return false;
  }
}

async function startKeepAlive() {
  console.log('🔄 Starting database keep-alive service...');
  console.log(`📡 Pinging every ${PING_INTERVAL / 1000} seconds (4 minutes)`);
  console.log('⏹️  Press Ctrl+C to stop\n');

  // Initial ping
  await pingDatabase();

  // Set up interval
  const interval = setInterval(pingDatabase, PING_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Stopping keep-alive service...');
    clearInterval(interval);
    await prisma.$disconnect();
    console.log('👋 Database connection closed. Goodbye!');
    process.exit(0);
  });
}

// Start the service
startKeepAlive().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
