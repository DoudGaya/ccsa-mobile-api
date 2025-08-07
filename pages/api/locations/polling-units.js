import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      data: pollingUnits
    });
  } catch (error) {
    console.error('Error fetching polling units:', error);
    
    // Return empty array as fallback
    return res.status(200).json({
      success: true,
      data: [],
      note: 'No polling units found or database error'
    });
  }
}
