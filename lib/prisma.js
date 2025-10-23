import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  // Connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log configuration for debugging
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'info'] : ['error'],
  // Error formatting
  errorFormat: 'pretty',
});

// Add retry logic for connection failures
export const withRetry = async (fn, maxRetries = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'P1001' && attempt < maxRetries) {
        // Database connection error - retry with exponential backoff
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        console.warn(`Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
};

// Test connection on startup
prisma.$connect()
  .then(() => console.log('✅ Database connection established'))
  .catch(error => {
    console.error('⚠️  Database connection warning on startup:', error.message);
    // Don't exit - connection might restore automatically
  });

// Handle connection cleanup on process termination
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
