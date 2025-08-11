import prisma from '../../../lib/prisma';
import { findFarmersOptimized, countFarmersOptimized } from '../../../lib/db-utils';
import { authMiddleware } from '../../../lib/authMiddleware';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Apply authentication middleware
    await authMiddleware(req, res);
    
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { query, type, limit = 10, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let whereClause = {
      status: 'active',
      agentId: req.user.uid, // Only return farmers registered by the current user
    };

    // Build search conditions based on type
    switch (type) {
      case 'nin':
        whereClause.nin = { contains: query, mode: 'insensitive' };
        break;
      case 'name':
        whereClause.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { middleName: { contains: query, mode: 'insensitive' } },
        ];
        break;
      case 'phone':
        whereClause.phone = { contains: query, mode: 'insensitive' };
        break;
      case 'email':
        whereClause.email = { contains: query, mode: 'insensitive' };
        break;
      default:
        // Search all fields
        whereClause.OR = [
          { nin: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { middleName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
    }

    // For NIN searches, we typically only need the farmer without count
    // This reduces database load for the most common search type
    if (type === 'nin') {
      const farmers = await findFarmersOptimized(whereClause, {
        includeAgent: true,
        includeReferees: false, // Skip referees for NIN search to reduce load
        includeCertificates: false, // Skip certificates for NIN search
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.status(200).json({
        farmers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: farmers.length, // For NIN searches, we don't need exact total
          hasMore: farmers.length >= parseInt(limit),
        },
      });
    }

    // For other search types, use optimized queries but with full data
    const farmers = await findFarmersOptimized(whereClause, {
      includeAgent: true,
      includeReferees: true,
      includeCertificates: true,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Only get total count for non-NIN searches when really needed
    const total = farmers.length >= parseInt(limit) 
      ? await countFarmersOptimized(whereClause)
      : farmers.length;

    return res.status(200).json({
      farmers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        hasMore: total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error searching farmers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
