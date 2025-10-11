const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFarmers() {
  try {
    console.log('\n=== CHECKING FARMERS IN DATABASE ===\n');
    
    // Get total count
    const totalFarmers = await prisma.farmer.count();
    console.log(`Total farmers in database: ${totalFarmers}`);
    
    if (totalFarmers === 0) {
      console.log('\n❌ NO FARMERS FOUND IN DATABASE');
      console.log('This explains why the API returns 0 farmers.\n');
      return;
    }
    
    // Get all farmers with their agentId
    const farmers = await prisma.farmer.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        agentId: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\nShowing first ${farmers.length} farmers:\n`);
    
    farmers.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.firstName} ${farmer.lastName}`);
      console.log(`   ID: ${farmer.id}`);
      console.log(`   Agent ID: ${farmer.agentId}`);
      console.log(`   Status: ${farmer.status}`);
      console.log(`   Created: ${farmer.createdAt}`);
      console.log('');
    });
    
    // Check if any match the current user
    const currentUserUid = 'szy8MgyQlSOdhjW5Hia4sy2aUAi1';
    const userFarmers = await prisma.farmer.count({
      where: { agentId: currentUserUid }
    });
    
    console.log(`\n=== USER SPECIFIC CHECK ===`);
    console.log(`Farmers for agentId '${currentUserUid}': ${userFarmers}`);
    
    if (userFarmers === 0) {
      console.log('\n❌ NO FARMERS FOUND FOR THIS AGENT');
      console.log('Possible reasons:');
      console.log('1. Farmers were registered with a different agentId');
      console.log('2. Farmers haven\'t been created yet');
      console.log('3. AgentId in database doesn\'t match Firebase UID');
      
      // Check what agentIds exist
      const uniqueAgentIds = await prisma.farmer.findMany({
        distinct: ['agentId'],
        select: { agentId: true }
      });
      
      console.log('\n=== EXISTING AGENT IDs IN DATABASE ===');
      uniqueAgentIds.forEach(item => {
        console.log(`- ${item.agentId}`);
      });
    } else {
      console.log('\n✅ FARMERS FOUND FOR THIS AGENT');
    }
    
  } catch (error) {
    console.error('Error checking farmers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFarmers();
