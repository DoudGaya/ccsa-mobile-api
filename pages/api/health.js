// Health check endpoint for production monitoring
import { healthCheck } from '../../lib/db-utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection using optimized utility
    const dbHealth = await healthCheck();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json({
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      service: 'CCSA FIMS Backend API',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
        error: dbHealth.error || undefined
      },
      sms: 'enabled'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'CCSA FIMS Backend API',
      error: error.message || 'Unknown error',
      database: {
        status: 'error',
        error: error.message
      }
    });
  }
}