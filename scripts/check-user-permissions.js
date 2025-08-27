const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserPermissions() {
  try {
    console.log('🔍 Checking permissions for: admin@cosmopolitan.edu.ng')
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cosmopolitan.edu.ng' },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: true,
                isSystem: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('\n📋 User Details:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.displayName || user.firstName + ' ' + user.lastName}`)
    console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`)
    console.log(`   Role (legacy): ${user.role}`)

    console.log('\n🎭 Assigned Roles:')
    user.userRoles.forEach((userRole, index) => {
      const role = userRole.role
      console.log(`   ${index + 1}. ${role.name}`)
      console.log(`      Description: ${role.description}`)
      console.log(`      System Role: ${role.isSystem ? 'Yes' : 'No'}`)
      console.log(`      Status: ${role.isActive ? 'Active' : 'Inactive'}`)
      console.log(`      Permissions: ${role.permissions ? role.permissions.length : 0}`)
    })

    // Collect all permissions
    const allPermissions = new Set()
    user.userRoles.forEach(userRole => {
      if (userRole.role.permissions && Array.isArray(userRole.role.permissions)) {
        userRole.role.permissions.forEach(permission => allPermissions.add(permission))
      }
    })

    console.log('\n🔐 All Permissions:')
    const sortedPermissions = Array.from(allPermissions).sort()
    sortedPermissions.forEach((permission, index) => {
      console.log(`   ${index + 1}. ${permission}`)
    })

    console.log(`\n✅ Total Permissions: ${sortedPermissions.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserPermissions()
