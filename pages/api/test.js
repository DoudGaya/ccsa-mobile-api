// Simple test endpoint to verify API connectivity
export default function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  // Log the request for debugging
  console.log(`[${timestamp}] Test API called from: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
  
  res.status(200).json({
    success: true,
    message: 'Backend API is working correctly',
    timestamp,
    method: req.method,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });
}