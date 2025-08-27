/**
 * Setup Super Admin User
 * This script ensures admin@cosmopolitan.edu.ng has all necessary permissions
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupSuperAdmin() {
  try {
    console.log('🔧 Setting up super admin user...');

    const superAdminEmail = 'admin@cosmopolitan.edu.ng';
    const defaultPassword = 'admin123'; // Should be changed in production

    // First, ensure the super admin role exists
    let superAdminRole = await prisma.role.findFirst({
      where: {
        name: 'Super Admin'
      }
    });

    if (!superAdminRole) {
      console.log('📝 Creating Super Admin role...');
      
      // Get all available permissions
      const allPermissions = [
        'create_farmers', 'read_farmers', 'update_farmers', 'delete_farmers',
        'create_farms', 'read_farms', 'update_farms', 'delete_farms',
        'create_agents', 'read_agents', 'update_agents', 'delete_agents',
        'create_clusters', 'read_clusters', 'update_clusters', 'delete_clusters',
        'create_users', 'read_users', 'update_users', 'delete_users',
        'create_roles', 'read_roles', 'update_roles', 'delete_roles',
        'read_analytics', 'read_reports', 'manage_settings', 'manage_system'
      ];

      superAdminRole = await prisma.role.create({
        data: {
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          permissions: allPermissions,
          isSystem: true
        }
      });

      console.log('✅ Super Admin role created with permissions:', allPermissions);
    } else {
      console.log('📋 Super Admin role already exists');
    }

    // Check if the super admin user exists
    let superAdminUser = await prisma.user.findUnique({
      where: {
        email: superAdminEmail
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!superAdminUser) {
      console.log('👤 Creating super admin user...');
      
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          displayName: 'System Administrator',
          role: 'admin',
          isActive: true,
          emailVerified: new Date()
        }
      });

      console.log('✅ Super admin user created');
    } else {
      console.log('👤 Super admin user already exists');
    }

    // Check if user has the super admin role
    const hasSupeAdminRole = superAdminUser.userRoles.some(
      ur => ur.role.name === 'Super Admin'
    );

    if (!hasSupeAdminRole) {
      console.log('🔗 Assigning Super Admin role to user...');
      
      await prisma.userRole.create({
        data: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id
        }
      });

      console.log('✅ Super Admin role assigned to user');
    } else {
      console.log('✅ User already has Super Admin role');
    }

    // Verify the setup
    const verifyUser = await prisma.user.findUnique({
      where: {
        email: superAdminEmail
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true
              }
            }
          }
        }
      }
    });

    console.log('\n📊 Super Admin Setup Summary:');
    console.log('Email:', verifyUser.email);
    console.log('Display Name:', verifyUser.displayName);
    console.log('Role:', verifyUser.role);
    console.log('Active:', verifyUser.isActive);
    console.log('Roles:', verifyUser.userRoles.map(ur => ur.role.name));
    
    const allPermissions = verifyUser.userRoles.flatMap(ur => ur.role.permissions);
    console.log('Total Permissions:', allPermissions.length);
    console.log('Unique Permissions:', [...new Set(allPermissions)].length);

    console.log('\n✅ Super admin setup completed successfully!');
    console.log('🔑 Default password:', defaultPassword);
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupSuperAdmin()
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSuperAdmin };
