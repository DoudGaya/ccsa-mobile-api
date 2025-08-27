import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    console.log('=== SESSION DEBUG ===');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Session exists:', !!session);
    if (session) {
      console.log('Session user:', JSON.stringify(session.user, null, 2));
      console.log('Session expires:', session.expires);
    }
    console.log('=== END DEBUG ===');

    return res.status(200).json({
      hasSession: !!session,
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        cookie: req.headers.cookie ? 'Present' : 'Missing',
        userAgent: req.headers['user-agent']
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return res.status(500).json({
      error: 'Failed to get session',
      message: error.message
    });
  }
}
