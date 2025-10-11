import prisma from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate - web only for now
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Find the Agent record for this user
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!agent) {
      return res.status(200).json({
        attendanceRate: 0,
        presentDays: 0,
        totalDays: 0,
        checkIns: 0,
        checkOuts: 0
      });
    }

    // Calculate date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get attendance records for the last 30 days
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        agentId: agent.id,
        timestamp: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Group by date to find unique days
    const dateSet = new Set();
    let checkIns = 0;
    let checkOuts = 0;

    attendanceRecords.forEach(record => {
      const dateStr = new Date(record.timestamp).toDateString();
      dateSet.add(dateStr);
      
      if (record.type === 'check_in') {
        checkIns++;
      } else if (record.type === 'check_out') {
        checkOuts++;
      }
    });

    const presentDays = dateSet.size;
    const totalDays = 30;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return res.status(200).json({
      attendanceRate,
      presentDays,
      totalDays,
      checkIns,
      checkOuts,
      records: attendanceRecords.length
    });

  } catch (error) {
    console.error('Error fetching agent attendance summary:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      attendanceRate: 0,
      presentDays: 0,
      totalDays: 0
    });
  }
}
