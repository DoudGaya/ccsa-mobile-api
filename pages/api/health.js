// Health check endpoint for production monitoring
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'CCSA FIMS Backend API',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'connected',
      sms: 'enabled'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'CCSA FIMS Backend API',
      error: 'Database connection failed'
    });
  }
}