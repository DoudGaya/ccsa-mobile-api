const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndCreateNacotanCluster() {
  try {
    console.log('🔍 Checking for NACOTAN cluster...');

    // Check if NACOTAN cluster exists
    const existingCluster = await prisma.cluster.findFirst({
      where: {
        title: 'NACOTAN'
      }
    });

    if (existingCluster) {
      console.log('✅ NACOTAN cluster already exists:', existingCluster.id);
      return existingCluster;
    }

    console.log('❌ NACOTAN cluster not found, creating...');

    // Create NACOTAN cluster with minimal required fields
    const nacotanCluster = await prisma.cluster.create({
      data: {
        title: 'NACOTAN',
        description: 'National Cotton Association of Tanzania - Default cluster for existing farmers',
        clusterLeadFirstName: 'NACOTAN',
        clusterLeadLastName: 'Admin',
        clusterLeadEmail: 'admin@nacotan.org',
        clusterLeadPhone: '+255-XXX-XXXXXXX',
        clusterLeadState: 'Default',
        clusterLeadLGA: 'Default',
        clusterLeadPosition: 'Administrator',
      }
    });

    console.log('✅ NACOTAN cluster created:', nacotanCluster.id);
    return nacotanCluster;

  } catch (error) {
    console.error('❌ Error checking/creating NACOTAN cluster:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndCreateNacotanCluster()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndCreateNacotanCluster };