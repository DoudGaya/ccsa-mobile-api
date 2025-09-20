import { auth } from './firebase-admin';
import ProductionLogger from './productionLogger';
import prisma from './prisma';

export async function authMiddleware(req, res) {
  ProductionLogger.debug('AUTH MIDDLEWARE START', { method: req.method, url: req.url });

  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      ProductionLogger.warn('No authorization header provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Extract token from Bearer token
    const token = authHeader.split(' ')[1];
    if (!token) {
      ProductionLogger.warn('No token in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    ProductionLogger.debug('Verifying Firebase token');

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    ProductionLogger.debug('Token verification successful', { uid: decodedToken.uid, email: decodedToken.email });

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...decodedToken
    };

    // Ensure user exists in database using singleton prisma instance
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: decodedToken.uid }
      });

      if (existingUser) {
        ProductionLogger.debug('User found in database', { email: existingUser.email });
        // Update last login timestamp and user info if needed
        await prisma.user.update({
          where: { id: decodedToken.uid },
          data: {
            email: decodedToken.email,
            displayName: decodedToken.name || decodedToken.email,
            lastLogin: new Date(),
          }
        });
      } else {
        ProductionLogger.debug('Creating new user in database', { uid: decodedToken.uid });
        // Create new user
        await prisma.user.create({
          data: {
            id: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name || decodedToken.email,
            role: 'agent',
            lastLogin: new Date(),
          }
        });
      }
    } catch (dbError) {
      ProductionLogger.error('Database error during user management:', dbError.message);
      // Continue anyway - don't block the request for DB issues
    }

    ProductionLogger.debug('Auth middleware successful', { email: decodedToken.email });
    
    // Don't call next() - just return, the calling function will continue
    return;
  } catch (error) {
    ProductionLogger.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
