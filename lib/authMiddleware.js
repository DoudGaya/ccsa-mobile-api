import { auth } from './firebase-admin';

export async function authMiddleware(req, res) {
  console.log('=== AUTH MIDDLEWARE START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');

    // Extract token from Bearer token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
   
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...decodedToken
    };

    // Ensure user exists in database
    console.log('Ensuring user exists for UID:', decodedToken.uid);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: decodedToken.uid }
      });

      if (existingUser) {
        console.log('User found in database:', existingUser.email);
        // Update user info if needed
        console.log('Updating user info...');
        await prisma.user.update({
          where: { id: decodedToken.uid },
          data: {
            email: decodedToken.email,
            displayName: decodedToken.name || decodedToken.email,
          }
        });
        console.log('User updated successfully');
      } else {
        console.log('Creating new user in database...');
        // Create new user
        await prisma.user.create({
          data: {
            id: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name || decodedToken.email,
            role: 'agent'
          }
        });
        console.log('New user created successfully');
      }
    } catch (dbError) {
      console.error('Database error during user management:', dbError);
      // Continue anyway - don't block the request for DB issues
    } finally {
      await prisma.$disconnect();
    }

    console.log('Auth middleware successful, user:', decodedToken.email);
    console.log('=== AUTH MIDDLEWARE END ===');
    
    // Don't call next() - just return, the calling function will continue
    return;
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.log('=== AUTH MIDDLEWARE ERROR ===');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
