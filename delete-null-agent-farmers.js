// Script to delete farmers with null agentId (for testing)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteNullAgentFarmers() {
  try {
    console.log('🗑️  Deleting farmers with null agentId...');
    
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
    
    // Delete referees first (due to foreign key constraint)
    for (const farmer of farmersWithNullAgent) {
      await prisma.referee.deleteMany({
        where: {
          farmerId: farmer.id
        }
      });
      console.log(`🗑️  Deleted referees for farmer: ${farmer.firstName} ${farmer.lastName}`);
    }
    
    // Delete farmers
    const deleteResult = await prisma.farmer.deleteMany({
      where: {
        agentId: null
      }
    });
    
    console.log(`✅ Deleted ${deleteResult.count} farmers with null agentId`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteNullAgentFarmers();
