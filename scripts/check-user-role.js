const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const currentUserUid = 'szy8MgyQlSOdhjW5Hia4sy2aUAi1';
    
    console.log('\n=== CHECKING USER ROLE ===\n');
    
    const user = await prisma.user.findUnique({
      where: { id: currentUserUid },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found in database!');
      return;
    }
    
    console.log('User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Phone: ${user.phoneNumber}`);
    
    if (user.role !== 'agent') {
      console.log(`\n⚠️ PROBLEM FOUND!`);
      console.log(`The attendance API requires role='agent', but user has role='${user.role}'`);
      console.log(`\nThis is why the attendance API is failing.`);
    } else {
      console.log('\n✅ User has correct role!');
    }
    
    // Check if Agent record exists
    const agent = await prisma.agent.findUnique({
      where: { userId: currentUserUid },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    
    console.log('\n=== AGENT RECORD CHECK ===');
    if (agent) {
      console.log('✅ Agent record exists');
      console.log(`  ID: ${agent.id}`);
      console.log(`  Name: ${agent.firstName} ${agent.lastName}`);
      console.log(`  Status: ${agent.status}`);
    } else {
      console.log('⚠️ No Agent record found (will be auto-created on first attendance)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
