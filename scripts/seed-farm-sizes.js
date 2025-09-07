// Seeder utility to update farmSize for all farms based on farmPolygon, and print total hectares
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Shoelace formula and helpers (copy from mobile/src/utils/farmCalculations.js)
function calculatePolygonArea(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) return 0;
  const earthRadius = 6371000;
  const normalizedCoords = coordinates.map(coord => {
    if (Array.isArray(coord)) return [coord[0], coord[1]];
    if (coord.latitude !== undefined && coord.longitude !== undefined) return [coord.longitude, coord.latitude];
    if (coord.lng !== undefined && coord.lat !== undefined) return [coord.lng, coord.lat];
    return coord;
  });
  let area = 0;
  const n = normalizedCoords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = normalizedCoords[i][1] * Math.PI / 180;
    const lon1 = normalizedCoords[i][0] * Math.PI / 180;
    const lat2 = normalizedCoords[j][1] * Math.PI / 180;
    const lon2 = normalizedCoords[j][0] * Math.PI / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area) * earthRadius * earthRadius / 2;
  return area;
}
function metersToHectares(squareMeters) {
  return squareMeters / 10000;
}
function calculateFarmSizeFromPolygon(farmPolygon) {
  try {
    if (!farmPolygon) return 0;
    let coordinates;
    if (typeof farmPolygon === 'string') {
      const parsed = JSON.parse(farmPolygon);
      coordinates = parsed.coordinates || parsed;
    } else if (Array.isArray(farmPolygon)) {
      coordinates = farmPolygon;
    } else if (farmPolygon.coordinates) {
      coordinates = farmPolygon.coordinates;
    } else {
      return 0;
    }
    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
      coordinates = coordinates[0];
    }
    const areaInSquareMeters = calculatePolygonArea(coordinates);
    const areaInHectares = metersToHectares(areaInSquareMeters);
    return Math.round(areaInHectares * 100) / 100;
  } catch (error) {
    console.error('Error calculating farm size:', error);
    return 0;
  }
}

async function main() {
  const farms = await prisma.farm.findMany();
  let totalHectares = 0;
  let updated = 0;
  for (const farm of farms) {
    if (!farm.farmPolygon) continue;
    const size = calculateFarmSizeFromPolygon(farm.farmPolygon);
    if (size > 0 && farm.farmSize !== size) {
      await prisma.farm.update({ where: { id: farm.id }, data: { farmSize: size } });
      updated++;
    }
    totalHectares += size;
  }
  console.log(`Updated ${updated} farms with calculated size.`);
  console.log(`Total hectares captured: ${totalHectares.toFixed(2)} ha`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
