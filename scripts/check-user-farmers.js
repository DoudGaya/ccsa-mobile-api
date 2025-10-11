const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserFarmers() {
  try {
    const currentUserUid = 'szy8MgyQlSOdhjW5Hia4sy2aUAi1';
    
    console.log('\n=== YOUR FARMERS ===\n');
    
    const farmers = await prisma.farmer.findMany({
      where: { agentId: currentUserUid },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${farmers.length} farmers for agent ${currentUserUid}\n`);
    
    farmers.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.firstName} ${farmer.lastName}`);
      console.log(`   Status: ${farmer.status}`);
      console.log(`   Created: ${farmer.createdAt}`);
      console.log('');
    });
    
    // Count by status
    const statusCounts = {};
    farmers.forEach(f => {
      statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
    });
    
    console.log('=== STATUS BREAKDOWN ===');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    // Check with active filter
    const activeFarmers = await prisma.farmer.count({
      where: { 
        agentId: currentUserUid,
        status: 'active'
      }
    });
    
    console.log(`\n=== ACTIVE FILTER ===`);
    console.log(`Farmers with status='active': ${activeFarmers}`);
    console.log(`\n⚠️ The API filters by status='active' by default!`);
    console.log(`That's why you see 0 farmers in the app.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserFarmers();
