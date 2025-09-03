const { PrismaClient } = require('@prisma/client');

// Test different connection configurations
const connectionConfigs = [
  {
    name: "Original Connection",
    url: process.env.DATABASE_URL
  },
  {
    name: "Direct Connection (no pooler)",
    url: process.env.DATABASE_URL?.replace('-pooler', '')
  },
  {
    name: "Connection with reduced timeout",
    url: process.env.DATABASE_URL?.replace('connect_timeout=10', 'connect_timeout=30')
  }
];

async function testDatabaseConnection() {
  console.log('🔍 Testing database connections...\n');
  
  for (const config of connectionConfigs) {
    if (!config.url) continue;
    
    console.log(`Testing: ${config.name}`);
    console.log(`URL: ${config.url.replace(/:[^@]*@/, ':****@')}`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.url
        }
      }
    });
    
    try {
      const startTime = Date.now();
      await prisma.$connect();
      const connectTime = Date.now() - startTime;
      
      const count = await prisma.farmer.count();
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ SUCCESS! Connected in ${connectTime}ms, query in ${totalTime}ms`);
      console.log(`📊 Farmers in database: ${count}\n`);
      
      await prisma.$disconnect();
      return config; // Return the working config
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      await prisma.$disconnect();
    }
  }
  
  return null;
}

async function checkDatabaseStatus() {
  console.log('🏥 Database Health Check\n');
  
  const workingConfig = await testDatabaseConnection();
  
  if (workingConfig) {
    console.log(`🎉 Found working connection: ${workingConfig.name}`);
    
    // Update .env file if a different config worked
    if (workingConfig.url !== process.env.DATABASE_URL) {
      console.log('💡 Consider updating your DATABASE_URL in .env to:');
      console.log(workingConfig.url);
    }
    
    return true;
  } else {
    console.log('❌ No working database connection found');
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check if Neon database is active and not paused');
    console.log('2. Verify the connection string in .env');
    console.log('3. Check if your IP is whitelisted');
    console.log('4. Try connecting from Neon dashboard');
    
    return false;
  }
}

if (require.main === module) {
  checkDatabaseStatus()
    .catch(console.error)
    .finally(() => process.exit());
}

module.exports = { testDatabaseConnection, checkDatabaseStatus };
