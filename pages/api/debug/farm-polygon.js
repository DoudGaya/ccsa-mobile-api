import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Get a farm with polygon data
    const farm = await prisma.farm.findFirst({
      where: {
        farmPolygon: {
          not: null
        }
      },
      select: {
        id: true,
        farmPolygon: true,
        farmLatitude: true,
        farmLongitude: true
      }
    });

    if (!farm) {
      return res.status(404).json({ error: 'No farm with polygon data found' });
    }

    return res.status(200).json({
      farm: {
        id: farm.id,
        farmPolygon: farm.farmPolygon,
        farmLatitude: farm.farmLatitude,
        farmLongitude: farm.farmLongitude,
        polygonType: typeof farm.farmPolygon,
        polygonStringified: JSON.stringify(farm.farmPolygon, null, 2)
      }
    });
  } catch (error) {
    console.error('Debug polygon error:', error);
    return res.status(500).json({ error: error.message });
  }
}
