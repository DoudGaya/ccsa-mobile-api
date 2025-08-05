import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { stateId } = req.query;

    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: 'State ID is required'
      });
    }

    const localGovernments = await prisma.localGovernment.findMany({
      where: {
        stateId: stateId
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
      data: localGovernments
    });
  } catch (error) {
    console.error('Error fetching local governments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch local governments'
    });
  }
}
