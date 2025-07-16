// Migration script to fix farmers with null agentId
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNullAgentIds() {
  try {
    console.log('🔧 Fixing farmers with null agentId...');
    
    // Find farmers with null agentId
    const farmersWithNullAgent = await prisma.farmer.findMany({
      where: {
        agentId: null
      },
      select: {
        id: true,
        nin: true,
        firstName: true,
        lastName: true,
        phone: true,
      }
    });
    
    console.log(`📊 Found ${farmersWithNullAgent.length} farmers with null agentId:`);
    farmersWithNullAgent.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.firstName} ${farmer.lastName} (NIN: ${farmer.nin})`);
    });
    
    if (farmersWithNullAgent.length === 0) {
      console.log('✅ No farmers with null agentId found');
      return;
    }
    
    // For testing, we'll assign them to a test user
    // In production, you should assign them to the actual user who created them
    const testAgentId = 'test-agent-001'; // Replace with actual user UID
    
    const updateResult = await prisma.farmer.updateMany({
      where: {
        agentId: null
      },
      data: {
        agentId: testAgentId
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} farmers with agentId: ${testAgentId}`);
    
    // Verify the update
    const updatedFarmers = await prisma.farmer.findMany({
      where: {
        agentId: testAgentId
      },
      select: {
        id: true,
        nin: true,
        firstName: true,
        lastName: true,
        agentId: true,
      }
    });
    
    console.log('📋 Updated farmers:');
    updatedFarmers.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.firstName} ${farmer.lastName} (Agent: ${farmer.agentId})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullAgentIds();
