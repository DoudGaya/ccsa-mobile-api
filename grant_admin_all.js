const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allPermissions = [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'agents.create', 'agents.read', 'agents.update', 'agents.delete',
    'farmers.create', 'farmers.read', 'farmers.update', 'farmers.delete', 'farmers.export',
    'farms.create', 'farms.read', 'farms.update', 'farms.delete', 'farms.export', 'farms.import',
    'clusters.create', 'clusters.read', 'clusters.update', 'clusters.delete',
    'certificates.create', 'certificates.read', 'certificates.update', 'certificates.delete',
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    'analytics.read', 'dashboard.access', 'settings.read', 'settings.update',
    'gis.view', 'gis.edit', 'gis.export', 'gis.analyze',
    'system.manage_permissions', 'system.manage_roles', 'system.view_logs', 
    'system.manage_backups', 'system.manage_integrations'
  ];

  const user = await prisma.user.findUnique({ where: { email: 'admin@cosmopolitan.edu.ng' } });
  if (!user) { console.log('User not found'); process.exit(1); }

  let role = await prisma.roles.findFirst({ where: { name: 'Admin' } });
  if (!role) {
    role = await prisma.roles.create({ 
      data: { name: 'Admin', description: 'Full admin access', permissions: allPermissions, isActive: true } 
    });
  } else {
    role = await prisma.roles.update({ where: { id: role.id }, data: { permissions: allPermissions } });
  }

  await prisma.user_roles.deleteMany({ where: { userId: user.id } });
  await prisma.user_roles.create({ data: { userId: user.id, roleId: role.id } });
  await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });

  console.log('SUCCESS: Granted all', allPermissions.length, 'permissions to admin@cosmopolitan.edu.ng');
  await prisma.$disconnect();
}

main();
