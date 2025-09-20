import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { verifyFirebaseToken } from '../../../lib/firebase-admin';

// Validation schema for attendance data
const attendanceSchema = z.object({
  type: z.enum(['check_in', 'check_out']),
  timestamp: z.string().datetime(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    timestamp: z.string().optional(),
  }),
  agentId: z.string().optional(),
  date: z.string(),
  duration: z.number().optional(),
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return createAttendanceRecord(req, res);
  } else if (req.method === 'GET') {
    return getAttendanceRecords(req, res);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function createAttendanceRecord(req, res) {
  try {
    // Try Firebase authentication first (for mobile app)
    let user = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await verifyFirebaseToken(token);
        user = { id: decodedToken.uid, email: decodedToken.email };
      } catch (firebaseError) {
        console.log('Firebase auth failed, trying NextAuth...');
      }
    }
    
    // Fallback to NextAuth session (for web app)
    if (!user) {
      const session = await getServerSession(req, res, authOptions);
      if (session) {
        user = session.user;
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validatedData = attendanceSchema.parse(req.body);

    // Get agent ID from request or user
    const agentId = validatedData.agentId || user.id;

    // Verify the agent exists
    const agent = await prisma.agent.findUnique({
      where: { userId: agentId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        agentId: agent.id,
        type: validatedData.type,
        timestamp: new Date(validatedData.timestamp),
        location: validatedData.location,
        date: validatedData.date,
        duration: validatedData.duration,
      },
    });

    return res.status(201).json({
      success: true,
      attendance: {
        id: attendance.id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: attendance.location,
        date: attendance.date,
        duration: attendance.duration,
      }
    });

  } catch (error) {
    console.error('Error creating attendance record:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid data',
        details: error.errors
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAttendanceRecords(req, res) {
  try {
    // Try Firebase authentication first (for mobile app)
    let user = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await verifyFirebaseToken(token);
        user = { id: decodedToken.uid, email: decodedToken.email };
      } catch (firebaseError) {
        console.log('Firebase auth failed, trying NextAuth...');
      }
    }
    
    // Fallback to NextAuth session (for web app)
    if (!user) {
      const session = await getServerSession(req, res, authOptions);
      if (session) {
        user = session.user;
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { agentId, startDate, endDate, limit = 50 } = req.query;

    // Build where clause
    let whereClause = {};

    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { userId: agentId },
        select: { id: true }
      });
      
      if (agent) {
        whereClause.agentId = agent.id;
      }
    } else {
      // If no agentId specified, get current user's records
      const agent = await prisma.agent.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });
      
      if (agent) {
        whereClause.agentId = agent.id;
      }
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: attendanceRecords.length,
      checkIns: attendanceRecords.filter(r => r.type === 'check_in').length,
      checkOuts: attendanceRecords.filter(r => r.type === 'check_out').length,
      totalDuration: attendanceRecords
        .filter(r => r.type === 'check_out' && r.duration)
        .reduce((total, r) => total + r.duration, 0),
    };

    return res.status(200).json({
      attendanceRecords,
      summary,
      pagination: {
        limit: parseInt(limit),
        total: attendanceRecords.length,
      }
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}