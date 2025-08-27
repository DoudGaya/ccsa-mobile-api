import ProductionLogger from './productionLogger';

/**
 * Performance monitoring middleware for API routes
 */
export function withPerformanceMonitoring(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    let statusCode = 200;
    
    // Override response methods to capture status
    res.json = function(body) {
      statusCode = this.statusCode || 200;
      return originalJson.call(this, body);
    };
    
    res.send = function(body) {
      statusCode = this.statusCode || 200;
      return originalSend.call(this, body);
    };
    
    res.end = function(chunk, encoding) {
      statusCode = this.statusCode || 200;
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log API performance
      ProductionLogger.api(req.url, req.method, statusCode, duration);
      
      // Log slow requests
      if (duration > 2000) {
        ProductionLogger.warn(`Slow API request: ${req.method} ${req.url} took ${duration}ms`);
      }
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    try {
      return await handler(req, res);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      ProductionLogger.error(`API error in ${req.method} ${req.url}`, error);
      ProductionLogger.api(req.url, req.method, 500, duration);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
      }
    }
  };
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // per window

export function withRateLimit(handler, customLimit = MAX_REQUESTS) {
  return async (req, res) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return handler(req, res);
    }
    
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [ip, requests] of requestCounts.entries()) {
      const filteredRequests = requests.filter(time => time > windowStart);
      if (filteredRequests.length === 0) {
        requestCounts.delete(ip);
      } else {
        requestCounts.set(ip, filteredRequests);
      }
    }
    
    // Check current IP
    const ipRequests = requestCounts.get(clientIP) || [];
    const recentRequests = ipRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= customLimit) {
      ProductionLogger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requestCounts.set(clientIP, recentRequests);
    
    return handler(req, res);
  };
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API-specific headers
    if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    }
    
    return handler(req, res);
  };
}
