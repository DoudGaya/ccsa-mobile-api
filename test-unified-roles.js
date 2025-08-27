// Simple test script to verify the unified roles system
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUnifiedRoles() {
  console.log('🧪 Testing Unified Roles System...\n')
  
  try {
    // 1. Test if the roles table exists and has system roles
    console.log('1️⃣ Testing if roles table exists...')
    const systemRoles = await prisma.roles.findMany({
      where: { isSystem: true },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: true
      }
    })
    
    console.log(`✅ Found ${systemRoles.length} system roles:`)
    systemRoles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`)
    })
    
    // 2. Test if custom roles can be created
    console.log('\n2️⃣ Testing custom role creation...')
    
    // Check if a test role already exists
    const existingTestRole = await prisma.roles.findFirst({
      where: { name: 'Test Custom Role' }
    })
    
    if (existingTestRole) {
      console.log('   🗑️ Removing existing test role...')
      await prisma.roles.delete({
        where: { id: existingTestRole.id }
      })
    }
    
    const customRole = await prisma.roles.create({
      data: {
        name: 'Test Custom Role',
        description: 'A test role for verification',
        permissions: ['farms.read', 'farmers.read'],
        isSystem: false,
        isActive: true
      }
    })
    
    console.log(`✅ Created custom role: ${customRole.name}`)
    
    // 3. Test if user_roles table exists
    console.log('\n3️⃣ Testing user_roles relationship...')
    const userRolesCount = await prisma.user_roles.count()
    console.log(`✅ user_roles table exists with ${userRolesCount} assignments`)
    
    // 4. Get all available permissions
    console.log('\n4️⃣ Testing permissions system...')
    const allRoles = await prisma.roles.findMany({
      select: {
        name: true,
        permissions: true,
        isSystem: true
      }
    })
    
    const allPermissions = new Set()
    allRoles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(perm => allPermissions.add(perm))
      }
    })
    
    console.log(`✅ Found ${allPermissions.size} unique permissions across all roles:`)
    Array.from(allPermissions).sort().forEach(perm => {
      console.log(`   - ${perm}`)
    })
    
    // 5. Cleanup test role
    console.log('\n5️⃣ Cleaning up test data...')
    await prisma.roles.delete({
      where: { id: customRole.id }
    })
    console.log('✅ Test role cleaned up')
    
    console.log('\n🎉 Unified Roles System Test Completed Successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - System Roles: ${systemRoles.length}`)
    console.log(`   - User Role Assignments: ${userRolesCount}`)
    console.log(`   - Available Permissions: ${allPermissions.size}`)
    console.log('   - Custom Role Creation: ✅ Working')
    console.log('   - Database Schema: ✅ Compatible')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testUnifiedRoles()
