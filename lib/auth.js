import { auth } from './firebase-admin';
import prisma from './prisma';

export const verifyToken = async (token) => {
  try {
    console.log('Verifying Firebase token...');
    console.log('Token length:', token ? token.length : 'No token');
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Token verification successful');
    console.log('Decoded token UID:', decodedToken.uid);
    console.log('Decoded token email:', decodedToken.email);
    console.log('Token issued at:', new Date(decodedToken.iat * 1000));
    console.log('Token expires at:', new Date(decodedToken.exp * 1000));
    console.log('Current time:', new Date());
    
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token expired');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid token format');
    } else {
      throw new Error('Invalid token');
    }
  }
};

// Helper function to ensure user exists in database
const ensureUserExists = async (firebaseUser) => {
  try {
    console.log('Ensuring user exists for UID:', firebaseUser.uid);
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: firebaseUser.uid },
    });

    if (!user) {
      console.log('User not found in database, creating new user...');
      console.log('Firebase user data:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name,
        email_verified: firebaseUser.email_verified,
      });
      
      // Create user if it doesn't exist
      user = await prisma.user.create({
        data: {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.name || firebaseUser.email?.split('@')[0] || 'User',
          role: 'agent', // Default role
        },
      });
      console.log('User created successfully:', user.email);
    } else {
      console.log('User found in database:', user.email);
      
      // Update user info if needed (optional)
      if (user.email !== firebaseUser.email || user.displayName !== firebaseUser.name) {
        console.log('Updating user info...');
        user = await prisma.user.update({
          where: { id: firebaseUser.uid },
          data: {
            email: firebaseUser.email,
            displayName: firebaseUser.name || user.displayName,
          },
        });
        console.log('User updated successfully');
      }
    }

    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    // If user creation fails due to unique constraint (race condition), try to find the user again
    if (error.code === 'P2002') {
      console.log('Unique constraint error, trying to find user again...');
      const existingUser = await prisma.user.findUnique({
        where: { id: firebaseUser.uid },
      });
      if (existingUser) {
        console.log('Found existing user after constraint error');
        return existingUser;
      }
    }
    throw error;
  }
};

export const authMiddleware = (handler) => {
  return async (req, res) => {
    try {
      console.log('=== AUTH MIDDLEWARE START ===');
      console.log('Request method:', req.method);
      console.log('Request URL:', req.url);
      console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
      
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await verifyToken(token);
      
      // Ensure user exists in database
      const user = await ensureUserExists({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        email_verified: decodedToken.email_verified,
      });

      req.user = {
        id: user.id,
        email: user.email,
        emailVerified: decodedToken.email_verified,
        displayName: user.displayName,
        role: user.role,
      };
      
      console.log('Auth middleware successful, user:', req.user.email);
      console.log('=== AUTH MIDDLEWARE END ===');
      
      return handler(req, res);
    } catch (error) {
      console.log('Auth middleware error:', error.message);
      console.log('=== AUTH MIDDLEWARE ERROR ===');
      
      // Return specific error message
      if (error.message === 'Token expired') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (error.message === 'Invalid token format') {
        return res.status(401).json({ error: 'Invalid token format' });
      } else if (error.message === 'No token provided') {
        return res.status(401).json({ error: 'No token provided' });
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
  };
};
