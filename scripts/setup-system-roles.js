const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureSystemRoles() {
  try {
    console.log('🔧 Ensuring all system roles are properly configured...')
    
    // All available permissions - matches lib/permissions.js
    const allPermissions = [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'agents.create', 'agents.read', 'agents.update', 'agents.delete',
      'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete', 'farmers.export',
      'farms.create', 'farms.read', 'farms.update', 'farms.delete', 'farms.export', 'farms.import',
      'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
      'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
      'roles.create', 'roles.read', 'roles.update', 'roles.delete',
      'gis.view', 'gis.edit', 'gis.export', 'gis.analyze',
      'analytics.read', 'settings.read', 'settings.update',
      'system.manage_permissions', 'system.manage_roles', 'system.view_logs', 'system.manage_backups', 'system.manage_integrations'
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
          'users.create', 'users.read', 'users.update', 'users.delete',
          'agents.create', 'agents.read', 'agents.update', 'agents.delete',
          'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete', 'farmers.export',
          'farms.create', 'farms.read', 'farms.update', 'farms.delete', 'farms.export', 'farms.import',
          'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
          'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
          'gis.view', 'gis.edit', 'gis.export', 'gis.analyze',
          'analytics.read', 'settings.read', 'settings.update'
        ],
        isSystem: true
      },
      {
        name: 'Manager',
        description: 'Management level access',
        permissions: [
          'agents.read',
          'farmers.read', 'farmers.update',
          'farms.read', 'farms.update',
          'clusters.read', 'clusters.update',
          'gis.view',
          'analytics.read'
        ],
        isSystem: true
      },
      {
        name: 'Agent',
        description: 'Field agent access',
        permissions: [
          'farmers.create', 'farmers.read', 'farmers.update',
          'farms.create', 'farms.read', 'farms.update',
          'gis.view',
          'clusters.read'
        ],
        isSystem: true
      },
      {
        name: 'Viewer',
        description: 'Read-only access',
        permissions: [
          'farmers.read', 'farms.read', 'clusters.read', 'gis.view', 'analytics.read'
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

    // Grant full Super Admin permissions to admin@cosmopolitan.edu.ng
    console.log('\n🔐 Granting full permissions to admin@cosmopolitan.edu.ng...')
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: 'Super Admin' }
    })

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@cosmopolitan.edu.ng' }
    })

    if (adminUser && superAdminRole) {
      // Check if user already has this role
      const existingAssignment = await prisma.user_roles.findFirst({
        where: {
          userId: adminUser.id,
          roleId: superAdminRole.id
        }
      })

      if (!existingAssignment) {
        await prisma.user_roles.create({
          data: {
            userId: adminUser.id,
            roleId: superAdminRole.id
          }
        })
        console.log(`✅ Granted Super Admin role to admin@cosmopolitan.edu.ng`)
      } else {
        console.log(`✅ admin@cosmopolitan.edu.ng already has Super Admin role`)
      }

      // Update user's role field for backward compatibility
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: 'super_admin' }
      })
      console.log(`✅ Updated user role field to super_admin`)
    } else {
      if (!adminUser) {
        console.log(`⚠️  User admin@cosmopolitan.edu.ng not found in database`)
      }
      if (!superAdminRole) {
        console.log(`⚠️  Super Admin role not found`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureSystemRoles()
