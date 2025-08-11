// Database connection manager with fallback handling
import prisma from './prisma';

let isDbConnected = true;
let lastConnectionTest = null;
const CONNECTION_TEST_INTERVAL = 30000; // 30 seconds

// Test database connection
export async function testDatabaseConnection() {
  const now = Date.now();
  
  // Only test connection every 30 seconds to avoid spam
  if (lastConnectionTest && (now - lastConnectionTest) < CONNECTION_TEST_INTERVAL) {
    return isDbConnected;
  }
  
  try {
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    console.log('✅ Database connection successful');
  } catch (error) {
    isDbConnected = false;
    console.log('❌ Database connection failed:', error.message);
  }
  
  lastConnectionTest = now;
  return isDbConnected;
}

// Execute database query with fallback
export async function executeWithFallback(queryFn, fallbackData = null) {
  try {
    // Test connection first
    const connected = await testDatabaseConnection();
    
    if (!connected) {
      console.log('Database offline, returning fallback data');
      return { success: false, data: fallbackData, offline: true };
    }
    
    const result = await queryFn();
    return { success: true, data: result, offline: false };
    
  } catch (error) {
    console.error('Database query failed:', error);
    
    // Mark connection as failed if it's a connection error
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      isDbConnected = false;
    }
    
    return { success: false, data: fallbackData, offline: true, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Get dashboard stats with fallback
export async function getDashboardStats() {
  const fallbackStats = {
    totalFarmers: 1247,
    totalAgents: 23,
    totalFarms: 892,
    farmersThisMonth: 89,
    recentRegistrations: 156,
    recentActivities: [
      { type: 'registration', count: 12, date: '2025-08-06' },
      { type: 'verification', count: 8, date: '2025-08-06' },
      { type: 'farm_visit', count: 15, date: '2025-08-05' }
    ]
  };
  
  return await executeWithFallback(async () => {
    const [totalFarmers, totalAgents, totalFarms, farmersThisMonth, recentRegistrations] = await Promise.all([
      // Total farmers count
      prisma.farmer.count({
        where: { status: 'active' }
      }),
      
      // Total agents count  
      prisma.user.count({
        where: { role: 'agent', isActive: true }
      }),
      
      // Total farms count
      prisma.farm.count(),
      
      // Farmers this month
      prisma.farmer.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Recent registrations (last 30 days)
      prisma.farmer.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    return {
      totalFarmers,
      totalAgents,
      totalFarms,
      farmersThisMonth,
      recentRegistrations
    };
  }, fallbackStats);
}
