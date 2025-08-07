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
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      data: localGovernments
    });
  } catch (error) {
    console.error('Error fetching local governments:', error);
    
    // Return empty array as fallback
    return res.status(200).json({
      success: true,
      data: [],
      note: 'No local governments found or database error'
    });
  }
}
