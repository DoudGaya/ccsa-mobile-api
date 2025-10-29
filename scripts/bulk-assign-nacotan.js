const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function bulkAssignFarmersToNacotan() {
  try {
    console.log('🔍 Starting bulk cluster assignment...');

    // First, find the NACOTAN cluster
    const nacotanCluster = await prisma.cluster.findFirst({
      where: {
        title: 'NACOTAN'
      }
    });

    if (!nacotanCluster) {
      throw new Error('NACOTAN cluster not found! Please run check-nacotan-cluster.js first.');
    }

    console.log(`✅ Found NACOTAN cluster: ${nacotanCluster.id}`);

    // Count farmers without cluster assignment
    const farmersWithoutCluster = await prisma.farmer.count({
      where: {
        clusterId: null
      }
    });

    console.log(`📊 Found ${farmersWithoutCluster} farmers without cluster assignment`);

    if (farmersWithoutCluster === 0) {
      console.log('🎉 All farmers already have cluster assignments. Nothing to do.');
      return;
    }

    // Get a sample of farmers to show what will be updated
    const sampleFarmers = await prisma.farmer.findMany({
      where: {
        clusterId: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nin: true
      },
      take: 5
    });

    console.log('📝 Sample farmers to be updated:');
    sampleFarmers.forEach(farmer => {
      console.log(`  - ${farmer.firstName} ${farmer.lastName} (NIN: ${farmer.nin})`);
    });

    if (farmersWithoutCluster > 5) {
      console.log(`  ... and ${farmersWithoutCluster - 5} more farmers`);
    }

    // Ask for confirmation (in a real script, this would be a command line prompt)
    console.log('\n⚠️  WARNING: This will update production data!');
    console.log(`🔄 About to assign ${farmersWithoutCluster} farmers to NACOTAN cluster`);
    console.log('⏳ Starting bulk update in 3 seconds...');

    // Wait a bit to allow for cancellation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Perform the bulk update
    console.log('🚀 Executing bulk update...');

    const updateResult = await prisma.farmer.updateMany({
      where: {
        clusterId: null
      },
      data: {
        clusterId: nacotanCluster.id
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} farmers`);
    console.log(`🎯 All farmers are now assigned to NACOTAN cluster`);

    // Verify the assignment worked
    const verificationCount = await prisma.farmer.count({
      where: {
        clusterId: nacotanCluster.id
      }
    });

    console.log(`🔍 Verification: ${verificationCount} farmers are now assigned to NACOTAN`);

    // Show cluster stats
    const clusterStats = await prisma.cluster.findMany({
      include: {
        _count: {
          select: { farmers: true }
        }
      }
    });

    console.log('\n📊 Final cluster distribution:');
    clusterStats.forEach(cluster => {
      console.log(`  ${cluster.title}: ${cluster._count.farmers} farmers`);
    });

  } catch (error) {
    console.error('❌ Error during bulk assignment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  bulkAssignFarmersToNacotan()
    .then(() => {
      console.log('\n🎉 Bulk assignment completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Bulk assignment failed:', error);
      process.exit(1);
    });
}

module.exports = { bulkAssignFarmersToNacotan };