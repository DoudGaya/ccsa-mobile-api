import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    console.log('Total users in database:', userCount);

    // Get all users with their roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('All users:', allUsers);

    // Check specifically for agent role users
    const agents = await prisma.user.findMany({
      where: {
        role: 'agent'
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true
      }
    });

    console.log('Users with agent role:', agents);

    return res.status(200).json({
      success: true,
      userCount,
      allUsers,
      agents,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
