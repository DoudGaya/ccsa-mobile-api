// Seeder script to update farm sizes using farmCalculations utility
// Does NOT delete or reset any data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateFarmSize } = require('../lib/farmCalculations');

async function main() {
  const farms = await prisma.farm.findMany({});
  let updatedCount = 0;

  for (const farm of farms) {
    // Only update if farmPolygon or farmCoordinates exist
    if (farm.farmPolygon || farm.farmCoordinates) {
      try {
        const size = calculateFarmSize(farm.farmPolygon || farm.farmCoordinates);
        if (size && typeof size === 'number' && size > 0) {
          await prisma.farm.update({
            where: { id: farm.id },
            data: { farmSize: size }
          });
          updatedCount++;
          console.log(`Updated farm ${farm.id}: size = ${size}`);
        }
      } catch (err) {
        console.error(`Error calculating size for farm ${farm.id}:`, err);
      }
    }
  }
  console.log(`Done. Updated ${updatedCount} farms.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
