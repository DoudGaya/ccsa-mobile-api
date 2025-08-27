const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedClusters() {
  try {
    console.log('🌱 Seeding clusters...');
    
    const clusters = [
      {
        id: 'cluster_nacotan_001',
        title: 'NACOTAN',
        description: 'Nigeria Agricultural Commodity Association cluster for northern agriculture',
        clusterLeadFirstName: 'Ahmad',
        clusterLeadLastName: 'Ibrahim',
        clusterLeadEmail: 'ahmad.ibrahim@nacotan.org',
        clusterLeadPhone: '+2348012345678',
      },
      {
        id: 'cluster_mangara_001',
        title: 'MANGARA',
        description: 'Mangara Agricultural Development cluster for sustainable farming',
        clusterLeadFirstName: 'Fatima',
        clusterLeadLastName: 'Mohammed',
        clusterLeadEmail: 'fatima.mohammed@mangara.org',
        clusterLeadPhone: '+2348023456789',
      },
      {
        id: 'cluster_kaduna_coop_001',
        title: 'Kaduna Farmers Cooperative',
        description: 'Kaduna state farmers cooperative for grain production',
        clusterLeadFirstName: 'Musa',
        clusterLeadLastName: 'Yakubu',
        clusterLeadEmail: 'musa.yakubu@kadunafarmers.org',
        clusterLeadPhone: '+2348034567890',
      },
      {
        id: 'cluster_kano_rice_001',
        title: 'Kano Rice Producers',
        description: 'Specialized cluster for rice production in Kano state',
        clusterLeadFirstName: 'Amina',
        clusterLeadLastName: 'Suleiman',
        clusterLeadEmail: 'amina.suleiman@kanorice.org',
        clusterLeadPhone: '+2348045678901',
      },
      {
        id: 'cluster_plateau_veg_001',
        title: 'Plateau Vegetable Growers',
        description: 'Plateau state cluster focused on vegetable and cash crop production',
        clusterLeadFirstName: 'John',
        clusterLeadLastName: 'Danjuma',
        clusterLeadEmail: 'john.danjuma@plateauveggies.org',
        clusterLeadPhone: '+2348056789012',
      },
    ];

    for (const cluster of clusters) {
      const existing = await prisma.cluster.findUnique({
        where: { title: cluster.title }
      });

      if (!existing) {
        await prisma.cluster.create({
          data: cluster
        });
        console.log(`✅ Created cluster: ${cluster.title}`);
      } else {
        console.log(`⏭️  Cluster already exists: ${cluster.title}`);
      }
    }

    const clusterCount = await prisma.cluster.count();
    console.log(`🎉 Cluster seeding completed! Total clusters: ${clusterCount}`);

  } catch (error) {
    console.error('❌ Error seeding clusters:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedClusters()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = seedClusters;
