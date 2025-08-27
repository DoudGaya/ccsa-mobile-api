import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')
    
    // Test farmers count
    const farmerCount = await prisma.farmer.count()
    console.log(`Found ${farmerCount} farmers in database`)
    
    // Test agents count (they might be in users table or agents table)
    let agentCount = 0
    try {
      agentCount = await prisma.agent.count()
      console.log(`Found ${agentCount} agents in agents table`)
    } catch (e) {
      console.log('No agents table, checking users table...')
      agentCount = await prisma.user.count({ where: { role: 'AGENT' } })
      console.log(`Found ${agentCount} agents in users table`)
    }
    
    // Test clusters count
    let clusterCount = 0
    try {
      clusterCount = await prisma.cluster.count()
      console.log(`Found ${clusterCount} clusters`)
    } catch (e) {
      console.log('No clusters table found')
    }
    
    // Test farms count
    let farmCount = 0
    try {
      farmCount = await prisma.farm.count()
      console.log(`Found ${farmCount} farms`)
    } catch (e) {
      console.log('No farms table found')
    }

    // Get sample farmer data
    const sampleFarmers = await prisma.farmer.findMany({
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        state: true,
        gender: true,
        createdAt: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      counts: {
        farmers: farmerCount,
        agents: agentCount,
        clusters: clusterCount,
        farms: farmCount
      },
      sampleData: sampleFarmers,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database test failed:', error)
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
