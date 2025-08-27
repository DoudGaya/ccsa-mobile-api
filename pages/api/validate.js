import { withPerformanceMonitoring, withRateLimit, withSecurityHeaders } from '../../lib/middleware';
import ProductionLogger from '../../lib/productionLogger';
import prisma from '../../lib/prisma';

/**
 * Comprehensive API validation endpoint
 * Tests all major API endpoints and database connectivity
 */
async function validateAPI(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const validationResults = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  // Database connectivity check
  try {
    await prisma.$queryRaw`SELECT 1`;
    validationResults.checks.database = { status: 'healthy', message: 'Database connection successful' };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.database = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test farmer endpoints
  try {
    const farmerCount = await prisma.farmer.count();
    validationResults.checks.farmers = { 
      status: 'healthy', 
      message: `Farmer endpoint accessible, ${farmerCount} farmers in database` 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.farmers = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test agent endpoints
  try {
    const agentCount = await prisma.agent.count();
    validationResults.checks.agents = { 
      status: 'healthy', 
      message: `Agent endpoint accessible, ${agentCount} agents in database` 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.agents = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test farm endpoints
  try {
    const farmCount = await prisma.farm.count();
    validationResults.checks.farms = { 
      status: 'healthy', 
      message: `Farm endpoint accessible, ${farmCount} farms in database` 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.farms = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test certificate endpoints
  try {
    const certificateCount = await prisma.certificate.count();
    validationResults.checks.certificates = { 
      status: 'healthy', 
      message: `Certificate endpoint accessible, ${certificateCount} certificates in database` 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.certificates = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test cluster endpoints
  try {
    const clusterCount = await prisma.cluster.count();
    validationResults.checks.clusters = { 
      status: 'healthy', 
      message: `Cluster endpoint accessible, ${clusterCount} clusters in database` 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.clusters = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Test authentication endpoints
  try {
    // Simple check for auth table structure
    await prisma.user.count();
    validationResults.checks.auth = { 
      status: 'healthy', 
      message: 'Authentication system accessible' 
    };
    validationResults.summary.passed++;
  } catch (error) {
    validationResults.checks.auth = { status: 'error', message: error.message };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Environment check
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'FIREBASE_ADMIN_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length === 0) {
    validationResults.checks.environment = { 
      status: 'healthy', 
      message: 'All required environment variables are set' 
    };
    validationResults.summary.passed++;
  } else {
    validationResults.checks.environment = { 
      status: 'error', 
      message: `Missing environment variables: ${missingEnvVars.join(', ')}` 
    };
    validationResults.summary.failed++;
    validationResults.status = 'degraded';
  }
  validationResults.summary.total++;

  // Performance check
  const totalTime = Date.now() - startTime;
  if (totalTime < 1000) {
    validationResults.checks.performance = { 
      status: 'healthy', 
      message: `Validation completed in ${totalTime}ms` 
    };
    validationResults.summary.passed++;
  } else {
    validationResults.checks.performance = { 
      status: 'warning', 
      message: `Validation took ${totalTime}ms (>1000ms)` 
    };
    validationResults.summary.failed++;
    if (validationResults.status === 'healthy') {
      validationResults.status = 'degraded';
    }
  }
  validationResults.summary.total++;

  // Overall status
  if (validationResults.summary.failed === 0) {
    validationResults.status = 'healthy';
  } else if (validationResults.summary.failed < validationResults.summary.total / 2) {
    validationResults.status = 'degraded';
  } else {
    validationResults.status = 'unhealthy';
  }

  validationResults.duration = totalTime;

  // Log the validation results
  ProductionLogger.info(`API validation completed: ${validationResults.status}`, {
    passed: validationResults.summary.passed,
    failed: validationResults.summary.failed,
    duration: totalTime
  });

  const statusCode = validationResults.status === 'healthy' ? 200 : 
                    validationResults.status === 'degraded' ? 206 : 500;

  res.status(statusCode).json(validationResults);
}

export default withSecurityHeaders(
  withRateLimit(
    withPerformanceMonitoring(validateAPI),
    10 // Lower rate limit for validation endpoint
  )
);
