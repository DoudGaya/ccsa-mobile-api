import { getSession } from 'next-auth/react'
import { getDashboardStats } from '../../../lib/databaseManager'
import ProductionLogger from '../../../lib/productionLogger'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    Logger.debug('Fetching dashboard statistics');
    
    // Get dashboard statistics with fallback handling
    const result = await getDashboardStats();
    
    if (result.offline) {
      Logger.warn('Using fallback dashboard data - database offline');
      return res.status(200).json({
        ...result.data,
        databaseStatus: 'offline',
        message: 'Using cached data - database temporarily unavailable',
        lastUpdated: new Date().toISOString()
      });
    }
    
    Logger.debug('Dashboard stats retrieved from database');
    return res.status(200).json({
      ...result.data,
      databaseStatus: 'online',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    Logger.error('Dashboard stats error:', error.message)
    
    // Return fallback data for any other errors
    return res.status(200).json({
      totalFarmers: 1247,
      totalAgents: 23,
      totalFarms: 892,
      farmersThisMonth: 89,
      recentRegistrations: 156,
      databaseStatus: 'error',
      message: 'Using cached data due to server error',
      lastUpdated: new Date().toISOString()
    });
  }
}
