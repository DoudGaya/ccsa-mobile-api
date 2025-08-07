import { authMiddleware } from '../../lib/authMiddleware';

export default async function handler(req, res) {
  console.log('=== COMPLETE TEST ENDPOINT START ===');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing authentication middleware...');
    
    // Apply authentication middleware
    await authMiddleware(req, res);
    
    // Check if response was already sent by authMiddleware
    if (res.headersSent) {
      console.log('Response already sent by authMiddleware (likely 401)');
      return;
    }

    console.log('Authentication successful, user:', req.user?.email);
    console.log('Is admin:', req.isAdmin);
    
    // Return success response with user info
    return res.status(200).json({ 
      success: true,
      message: 'Authentication successful',
      user: {
        uid: req.user?.uid,
        email: req.user?.email,
        name: req.user?.name,
        isAdmin: req.isAdmin || false
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
