const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureSystemRoles() {
  try {
    console.log('🔧 Ensuring all system roles are properly configured...')
    
    // All available permissions
    const allPermissions = [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
      'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
      'analytics.read', 'settings.update'
    ]

    const systemRoles = [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: allPermissions,
        isSystem: true
      },
      {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        permissions: [
          'users.create', 'users.read', 'users.update',
          'agents.create', 'agents.read', 'agents.update', 'agents.delete',
          'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete',
          'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
          'analytics.read', 'settings.update'
        ],
        isSystem: true
      },
      {
        name: 'Manager',
        description: 'Management level access',
        permissions: [
          'agents.read', 'agents.update',
          'farmers.create', 'farmers.read', 'farmers.update',
          'clusters.read', 'clusters.update',
          'analytics.read'
        ],
        isSystem: true
      },
      {
        name: 'Agent',
        description: 'Field agent access',
        permissions: [
          'farmers.create', 'farmers.read', 'farmers.update',
          'clusters.read'
        ],
        isSystem: true
      },
      {
        name: 'Viewer',
        description: 'Read-only access',
        permissions: [
          'farmers.read', 'clusters.read', 'analytics.read'
        ],
        isSystem: true
      }
    ]

    for (const roleData of systemRoles) {
      const existingRole = await prisma.roles.findFirst({
        where: { name: roleData.name }
      })

      if (existingRole) {
        // Update existing role with latest permissions
        await prisma.roles.update({
          where: { id: existingRole.id },
          data: {
            description: roleData.description,
            permissions: roleData.permissions,
            isSystem: roleData.isSystem,
            isActive: true
          }
        })
        console.log(`✅ Updated role: ${roleData.name} (${roleData.permissions.length} permissions)`)
      } else {
        // Create new role
        await prisma.roles.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions: roleData.permissions,
            isSystem: roleData.isSystem,
            isActive: true
          }
        })
        console.log(`🆕 Created role: ${roleData.name} (${roleData.permissions.length} permissions)`)
      }
    }

    console.log('\n📊 Final Role Summary:')
    const roles = await prisma.roles.findMany({
      orderBy: { isSystem: 'desc' }
    })

    roles.forEach(role => {
      console.log(`   ${role.name}: ${role.permissions?.length || 0} permissions ${role.isSystem ? '(System)' : '(Custom)'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureSystemRoles()
