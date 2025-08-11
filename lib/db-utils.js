// Database utilities for connection management and monitoring
import prisma from './prisma';

// Connection pool monitoring
export const getConnectionStats = async () => {
  try {
    // This is a simple query to check if the connection is working
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

// Wrapper for database operations with timeout and retry logic
export const withConnectionRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timeout')), 15000)
        )
      ]);
    } catch (error) {
      console.error(`Database operation attempt ${attempt} failed:`, error.message);
      
      // Don't retry for certain errors
      if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Optimized farmer query with minimal relations
export const findFarmersOptimized = async (whereClause, options = {}) => {
  const { 
    includeAgent = false, 
    includeReferees = false,
    includeCertificates = false,
    includeFarms = false,
    limit = 10,
    offset = 0
  } = options;

  return await withConnectionRetry(() => prisma.farmer.findMany({
    where: whereClause,
    select: {
      id: true,
      nin: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      state: true,
      lga: true,
      maritalStatus: true,
      phone: true,
      email: true,
      address: true,
      ward: true,
      status: true,
      registrationDate: true,
      createdAt: true,
      updatedAt: true,
      agentId: true,
      ...(includeAgent && {
        agent: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      }),
      ...(includeReferees && { referees: true }),
      ...(includeCertificates && { certificates: true }),
      ...(includeFarms && { farms: true }),
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  }));
};

// Optimized count query
export const countFarmersOptimized = async (whereClause) => {
  return await withConnectionRetry(() => prisma.farmer.count({
    where: whereClause
  }));
};

// Health check for database
export const healthCheck = async () => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Cleanup connections (for graceful shutdown)
export const disconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};
