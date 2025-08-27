const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function grantAdminPermissions() {
  try {
    console.log('🔍 Looking for user: admin@cosmopolitan.edu.ng')
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cosmopolitan.edu.ng' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found. Creating user...')
      
      // Create the user if they don't exist
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@cosmopolitan.edu.ng',
          displayName: 'Super Administrator',
          firstName: 'Super',
          lastName: 'Administrator',
          role: 'super_admin',
          isActive: true
        }
      })
      
      console.log('✅ User created:', newUser.email)
      return await assignSuperAdminRole(newUser.id)
    }

    console.log('✅ User found:', user.email)
    console.log('📋 Current roles:', user.userRoles.map(ur => ur.role.name))
    
    return await assignSuperAdminRole(user.id)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function assignSuperAdminRole(userId) {
  try {
    // Find or create Super Admin role
    let superAdminRole = await prisma.roles.findFirst({
      where: { name: 'Super Admin' }
    })

    if (!superAdminRole) {
      console.log('🔧 Creating Super Admin role...')
      
      // All available permissions
      const allPermissions = [
        'users.create',
        'users.read', 
        'users.update',
        'users.delete',
        'agents.create',
        'agents.read',
        'agents.update', 
        'agents.delete',
        'farmers.create',
        'farmers.read',
        'farmers.update',
        'farmers.delete',
        'clusters.create',
        'clusters.read',
        'clusters.update',
        'clusters.delete',
        'analytics.read',
        'settings.update'
      ]

      superAdminRole = await prisma.roles.create({
        data: {
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          permissions: allPermissions,
          isSystem: true,
          isActive: true
        }
      })
      
      console.log('✅ Super Admin role created with', allPermissions.length, 'permissions')
    }

    // Check if user already has this role
    const existingAssignment = await prisma.user_roles.findFirst({
      where: {
        userId: userId,
        roleId: superAdminRole.id
      }
    })

    if (existingAssignment) {
      console.log('ℹ️  User already has Super Admin role')
      return superAdminRole
    }

    // Assign Super Admin role to user
    await prisma.user_roles.create({
      data: {
        userId: userId,
        roleId: superAdminRole.id,
        assignedBy: userId // Self-assigned for bootstrap
      }
    })

    console.log('🎉 Super Admin role assigned successfully!')
    console.log('📝 Permissions granted:', superAdminRole.permissions.length)
    
    return superAdminRole

  } catch (error) {
    console.error('❌ Error assigning role:', error)
    throw error
  }
}

// Run the script
grantAdminPermissions()
  .then(() => {
    console.log('✅ Admin permissions granted successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to grant admin permissions:', error)
    process.exit(1)
  })
