import prisma from '../../../lib/prisma';

// Sample coordinate data for Nigerian states (approximate boundaries)
const sampleCoordinates = {
  lagos: [
    [3.2, 6.4], [3.7, 6.4], [3.7, 6.8], [3.2, 6.8], [3.2, 6.4]
  ],
  kano: [
    [8.3, 11.8], [8.8, 11.8], [8.8, 12.3], [8.3, 12.3], [8.3, 11.8]
  ],
  rivers: [
    [6.8, 4.6], [7.3, 4.6], [7.3, 5.1], [6.8, 5.1], [6.8, 4.6]
  ],
  kaduna: [
    [7.2, 10.3], [7.7, 10.3], [7.7, 10.8], [7.2, 10.8], [7.2, 10.3]
  ],
  plateau: [
    [8.8, 9.0], [9.3, 9.0], [9.3, 9.5], [8.8, 9.5], [8.8, 9.0]
  ]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    console.log('🌱 Generating sample farm coordinate data...');

    // Get existing farms without coordinates
    const farmsWithoutCoordinates = await prisma.farm.findMany({
      where: {
        AND: [
          { farmCoordinates: null },
          { farmPolygon: null },
          { farmLatitude: null },
          { farmLongitude: null }
        ]
      },
      include: {
        farmer: true
      },
      take: 20 // Limit to first 20 farms
    });

    console.log(`📊 Found ${farmsWithoutCoordinates.length} farms without coordinates`);

    const updates = [];
    const states = Object.keys(sampleCoordinates);

    for (const farm of farmsWithoutCoordinates) {
      // Randomly select a state for sample coordinates
      const randomState = states[Math.floor(Math.random() * states.length)];
      const baseCoords = sampleCoordinates[randomState];
      
      // Add some randomness to create unique farm boundaries
      const randomOffset = () => (Math.random() - 0.5) * 0.02; // Small random offset
      
      const farmCoordinates = baseCoords.map(coord => [
        coord[0] + randomOffset(),
        coord[1] + randomOffset()
      ]);
      
      // Calculate center point for lat/lng
      const centerLng = farmCoordinates.reduce((sum, coord) => sum + coord[0], 0) / farmCoordinates.length;
      const centerLat = farmCoordinates.reduce((sum, coord) => sum + coord[1], 0) / farmCoordinates.length;
      
      // Update farm with coordinate data
      const updateData = {
        farmCoordinates: farmCoordinates,
        farmLatitude: centerLat,
        farmLongitude: centerLng,
        farmState: randomState.charAt(0).toUpperCase() + randomState.slice(1),
        coordinateSystem: 'WGS84'
      };

      const updatedFarm = await prisma.farm.update({
        where: { id: farm.id },
        data: updateData
      });

      updates.push({
        farmId: farm.id,
        farmerName: `${farm.farmer?.firstName} ${farm.farmer?.lastName}`,
        state: randomState,
        coordinatesAdded: farmCoordinates.length,
        centerPoint: [centerLat, centerLng]
      });

      console.log(`✅ Updated farm ${farm.id} with ${farmCoordinates.length} coordinate points`);
    }

    res.status(200).json({
      success: true,
      message: `Successfully added coordinates to ${updates.length} farms`,
      updates: updates,
      summary: {
        farmsUpdated: updates.length,
        states: [...new Set(updates.map(u => u.state))],
        totalCoordinatePoints: updates.reduce((sum, u) => sum + u.coordinatesAdded, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error generating sample coordinates:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample coordinates',
      error: error.message
    });
  }
}