import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a sample farm with polygon data for testing
    const testFarm = await prisma.farm.create({
      data: {
        farmerId: 'cme7b119v0003wkdllt1vrc16', // Use an existing farmer ID
        farmSize: 5.2,
        primaryCrop: 'Maize',
        produceCategory: 'Cereal',
        farmOwnership: 'Owned',
        farmState: 'Kano',
        farmLocalGovernment: 'Municipal',
        farmingSeason: 'Rainy',
        farmWard: 'Central Ward',
        farmingExperience: 15,
        farmLatitude: 9.057001,
        farmLongitude: 7.491302,
        farmPolygon: {
          "type": "Polygon",
          "coordinates": [[
            [7.491302, 9.057001],
            [7.491502, 9.057201], 
            [7.491702, 9.056801],
            [7.491402, 9.056601],
            [7.491302, 9.057001]
          ]]
        },
        soilType: 'Clay',
        soilPH: 6.5,
        soilFertility: 'High',
        coordinateSystem: 'WGS84',
        farmElevation: 485.5
      },
      include: {
        farmer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nin: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      farm: testFarm,
      message: 'Test farm with polygon created successfully',
      farmUrl: `/farms/${testFarm.id}`
    });
  } catch (error) {
    console.error('Error creating test farm:', error);
    return res.status(500).json({ 
      error: 'Failed to create test farm',
      details: error.message 
    });
  }
}
