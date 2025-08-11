// Error handler middleware for API routes
export const errorHandler = (error, req, res, next) => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P1001':
        return res.status(503).json({ 
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again later.'
        });
      case 'P2002':
        return res.status(409).json({ 
          error: 'Duplicate entry',
          message: `A record with this ${error.meta?.target?.join(', ')} already exists.`
        });
      case 'P2025':
        return res.status(404).json({ 
          error: 'Record not found',
          message: 'The requested record does not exist.'
        });
      case 'P2003':
        return res.status(400).json({ 
          error: 'Foreign key constraint failed',
          message: 'Related record does not exist.'
        });
      default:
        return res.status(500).json({ 
          error: 'Database error',
          message: 'A database error occurred.'
        });
    }
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return res.status(400).json({ 
      error: 'Validation error',
      message: error.message,
      details: error.errors || error.issues
    });
  }

  // Firebase Auth errors
  if (error.code?.startsWith('auth/')) {
    return res.status(401).json({ 
      error: 'Authentication error',
      message: 'Invalid or expired authentication token.'
    });
  }

  // Default error response
  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      errorHandler(error, req, res, next);
    });
  };
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      errorHandler(error, req, res, next);
    }
  };
};

// CORS middleware
export const corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://fims.cosmopolitan.edu.ng', 'https://ccsa-admin.vercel.app']
    : ['http://https://fims.cosmopolitan.edu.ng', 'https://fims.cosmopolitan.edu.ng', '*'];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};
