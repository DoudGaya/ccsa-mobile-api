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
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Error formatting
  errorFormat: 'minimal',
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
