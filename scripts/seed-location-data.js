const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedLocationData() {
  try {
    console.log('🌱 Starting location data seeding...');
    
    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../ccsa-mobile/states-and-lgas-and-wards-and-polling-units.json');
    const locationData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${locationData.length} states to process`);
    
    for (const stateData of locationData) {
      console.log(`\n🏛️  Processing state: ${stateData.state}`);
      
      // Create or update state
      const state = await prisma.state.upsert({
        where: { name: stateData.state },
        update: {},
        create: {
          name: stateData.state,
          code: stateData.state.toUpperCase().replace(/\s+/g, '_')
        }
      });
      
      console.log(`   ✅ State created/updated: ${state.name}`);
      
      // Process LGAs
      for (const lgaData of stateData.lgas) {
        console.log(`   🏢 Processing LGA: ${lgaData.lga}`);
        
        const lga = await prisma.localGovernment.upsert({
          where: { 
            name_stateId: { 
              name: lgaData.lga, 
              stateId: state.id 
            } 
          },
          update: {},
          create: {
            name: lgaData.lga,
            code: lgaData.lga.toUpperCase().replace(/\s+/g, '_'),
            stateId: state.id
          }
        });
        
        // Process Wards
        for (const wardData of lgaData.wards) {
          console.log(`      🏘️  Processing ward: ${wardData.ward}`);
          
          const ward = await prisma.ward.upsert({
            where: { 
              name_localGovernmentId: { 
                name: wardData.ward, 
                localGovernmentId: lga.id 
              } 
            },
            update: {},
            create: {
              name: wardData.ward,
              code: wardData.ward.toUpperCase().replace(/\s+/g, '_'),
              localGovernmentId: lga.id
            }
          });
          
          // Process Polling Units
          console.log(`         📍 Processing ${wardData.polling_units.length} polling units...`);
          
          for (const pollingUnitName of wardData.polling_units) {
            await prisma.pollingUnit.upsert({
              where: { 
                name_wardId: { 
                  name: pollingUnitName, 
                  wardId: ward.id 
                } 
              },
              update: {},
              create: {
                name: pollingUnitName,
                code: pollingUnitName.toUpperCase().replace(/\s+/g, '_'),
                wardId: ward.id
              }
            });
          }
        }
      }
      
      console.log(`   ✅ Completed state: ${stateData.state}`);
    }
    
    // Get final counts
    const counts = await Promise.all([
      prisma.state.count(),
      prisma.localGovernment.count(),
      prisma.ward.count(),
      prisma.pollingUnit.count()
    ]);
    
    console.log('\n🎉 Location data seeding completed successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   States: ${counts[0]}`);
    console.log(`   Local Governments: ${counts[1]}`);
    console.log(`   Wards: ${counts[2]}`);
    console.log(`   Polling Units: ${counts[3]}`);
    
  } catch (error) {
    console.error('❌ Error seeding location data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedLocationData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = seedLocationData;
