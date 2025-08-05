import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { lgaId } = req.query;

    if (!lgaId) {
      return res.status(400).json({
        success: false,
        message: 'Local Government ID is required'
      });
    }

    const wards = await prisma.ward.findMany({
      where: {
        localGovernmentId: lgaId
      },
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: wards
    });
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wards'
    });
  }
}
