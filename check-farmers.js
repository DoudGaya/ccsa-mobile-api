// Test script to check farmers directly in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFarmers() {
  try {
    console.log('🔍 Checking farmers in database...');
    
    const totalFarmers = await prisma.farmer.count();
    console.log('📊 Total farmers in database:', totalFarmers);
    
    const farmers = await prisma.farmer.findMany({
      take: 5, // Get first 5 farmers
      select: {
        id: true,
        nin: true,
        firstName: true,
        lastName: true,
        agentId: true,
        status: true,
        createdAt: true,
      }
    });
    
    console.log('📋 Sample farmers:');
    farmers.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.firstName} ${farmer.lastName} (NIN: ${farmer.nin}, Agent: ${farmer.agentId}, Status: ${farmer.status})`);
    });
    
    // Check agents
    const agents = await prisma.farmer.groupBy({
      by: ['agentId'],
      _count: {
        agentId: true
      }
    });
    
    console.log('👥 Farmers by agent:');
    agents.forEach(agent => {
      console.log(`Agent ${agent.agentId}: ${agent._count.agentId} farmers`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFarmers();
