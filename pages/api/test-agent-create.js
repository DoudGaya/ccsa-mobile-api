import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('TEST: Agent creation test started');
    console.log('TEST: Request body:', req.body);

    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      console.log('TEST: Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('TEST: Authentication successful', { user: session.user.email });

    const { email, firstName, lastName, displayName, phoneNumber } = req.body;
    console.log('TEST: Extracted fields:', { email, firstName, lastName, displayName, phoneNumber });

    // Basic validation
    if (!email) {
      console.log('TEST: Email missing');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Test database connection
    console.log('TEST: Testing database connection...');
    const testQuery = await prisma.user.count();
    console.log('TEST: Database connection successful, user count:', testQuery);

    // Check if user exists
    console.log('TEST: Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('TEST: User already exists:', existingUser.email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    console.log('TEST: User does not exist, proceeding with creation');

    // Try to create the user
    console.log('TEST: Attempting to create user...');
    const userData = {
      email,
      displayName: displayName || `${firstName} ${lastName}`.trim() || email,
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      role: 'agent',
      isActive: true,
      isVerified: true
    };
    console.log('TEST: User data for creation:', userData);

    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    });

    console.log('TEST: User created successfully:', newUser);

    return res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent: newUser,
      tempPassword: '1234567890'
    });

  } catch (error) {
    console.error('TEST: Error details:');
    console.error('  - Name:', error.name);
    console.error('  - Message:', error.message);
    console.error('  - Code:', error.code);
    console.error('  - Meta:', error.meta);
    console.error('  - Stack:', error.stack);

    return res.status(500).json({
      error: 'Internal server error',
      details: {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      }
    });
  }
}
