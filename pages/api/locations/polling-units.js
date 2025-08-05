import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { wardId } = req.query;

    if (!wardId) {
      return res.status(400).json({
        success: false,
        message: 'Ward ID is required'
      });
    }

    const pollingUnits = await prisma.pollingUnit.findMany({
      where: {
        wardId: wardId
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
      data: pollingUnits
    });
  } catch (error) {
    console.error('Error fetching polling units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch polling units'
    });
  }
}
