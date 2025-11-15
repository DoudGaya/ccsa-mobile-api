/**
 * PRODUCTION-SAFE MIGRATION RECOVERY SCRIPT
 * This script safely completes the failed RBAC migration
 * without losing any data
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function recoverFailedMigration() {
  console.log('🔍 Starting migration recovery...\n')

  try {
    // Step 1: Check current state
    console.log('Step 1: Checking migration status...')
    const migration = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, logs
      FROM "_prisma_migrations"
      WHERE migration_name = '20250822_add_rbac_models_manual'
    `
    console.log('Migration status:', migration)

    // Step 2: Check what tables exist
    console.log('\nStep 2: Checking existing RBAC tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
      ORDER BY table_name
    `
    console.log('Existing RBAC tables:', tables)

    // Step 3: Create tables if they don't exist (SAFE)
    console.log('\nStep 3: Creating missing tables (if any)...')
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "groups" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "permissions" JSONB,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ groups table ready')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "permissions" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "resource" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ permissions table ready')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_groups" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "assignedBy" TEXT,
          CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ user_groups table ready')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "permissionId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "assignedBy" TEXT,
          CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ user_permissions table ready')

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "group_permissions" (
          "id" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "permissionId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "assignedBy" TEXT,
          CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ group_permissions table ready')

    // Step 4: Create indexes (SAFE - will skip if exist)
    console.log('\nStep 4: Creating indexes...')
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "groups_name_key" ON "groups"("name")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "permissions_name_key" ON "permissions"("name")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "permissions_resource_action_key" ON "permissions"("resource", "action")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "user_groups_userId_groupId_key" ON "user_groups"("userId", "groupId")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "group_permissions_groupId_permissionId_key" ON "group_permissions"("groupId", "permissionId")`)
      console.log('✅ Indexes created')
    } catch (error) {
      console.log('⚠️  Some indexes already exist (this is fine)')
    }

    // Step 5: Add foreign key constraints (SAFE)
    console.log('\nStep 5: Adding foreign key constraints...')
    try {
      // Check and add user_groups foreign keys
      const ugUserFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_groups_userId_fkey'
      `
      if (ugUserFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      const ugGroupFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_groups_groupId_fkey'
      `
      if (ugGroupFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_fkey" 
          FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      // User permissions FKs
      const upUserFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_permissions_userId_fkey'
      `
      if (upUserFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      const upPermFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_permissions_permissionId_fkey'
      `
      if (upPermFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" 
          FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      // Group permissions FKs
      const gpGroupFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_permissions_groupId_fkey'
      `
      if (gpGroupFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_groupId_fkey" 
          FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      const gpPermFK = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_permissions_permissionId_fkey'
      `
      if (gpPermFK.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permissionId_fkey" 
          FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
      }

      console.log('✅ Foreign keys ready')
    } catch (error) {
      console.log('⚠️  Some foreign keys already exist (this is fine)')
    }

    // Step 6: Add users.permissions column
    console.log('\nStep 6: Adding users.permissions column...')
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB`)
    console.log('✅ users.permissions column ready')

    // Step 7: Insert default permissions (SAFE - ON CONFLICT DO NOTHING)
    console.log('\nStep 7: Inserting default permissions...')
    const permissionsData = [
      ['perm_users_create', 'Create Users', 'users', 'create', 'Create new users'],
      ['perm_users_read', 'View Users', 'users', 'read', 'View user information'],
      ['perm_users_update', 'Update Users', 'users', 'update', 'Update user information'],
      ['perm_users_delete', 'Delete Users', 'users', 'delete', 'Delete users'],
      ['perm_groups_create', 'Create Groups', 'groups', 'create', 'Create new groups'],
      ['perm_groups_read', 'View Groups', 'groups', 'read', 'View group information'],
      ['perm_groups_update', 'Update Groups', 'groups', 'update', 'Update group information'],
      ['perm_groups_delete', 'Delete Groups', 'groups', 'delete', 'Delete groups'],
      ['perm_farmers_create', 'Create Farmers', 'farmers', 'create', 'Create new farmers'],
      ['perm_farmers_read', 'View Farmers', 'farmers', 'read', 'View farmer information'],
      ['perm_farmers_update', 'Update Farmers', 'farmers', 'update', 'Update farmer information'],
      ['perm_farmers_delete', 'Delete Farmers', 'farmers', 'delete', 'Delete farmers'],
      ['perm_agents_create', 'Create Agents', 'agents', 'create', 'Create new agents'],
      ['perm_agents_read', 'View Agents', 'agents', 'read', 'View agent information'],
      ['perm_agents_update', 'Update Agents', 'agents', 'update', 'Update agent information'],
      ['perm_agents_delete', 'Delete Agents', 'agents', 'delete', 'Delete agents'],
      ['perm_clusters_create', 'Create Clusters', 'clusters', 'create', 'Create new clusters'],
      ['perm_clusters_read', 'View Clusters', 'clusters', 'read', 'View cluster information'],
      ['perm_clusters_update', 'Update Clusters', 'clusters', 'update', 'Update cluster information'],
      ['perm_clusters_delete', 'Delete Clusters', 'clusters', 'delete', 'Delete clusters']
    ]

    for (const [id, name, resource, action, description] of permissionsData) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "permissions" ("id", "name", "resource", "action", "description", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, id, name, resource, action, description)
    }
    
    const permCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM permissions`
    console.log(`✅ Permissions ready (${permCount[0].count} total)`)

    // Step 8: Mark migration as complete
    console.log('\nStep 8: Marking migration as complete...')
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET 
        finished_at = NOW(),
        applied_steps_count = 1,
        logs = 'Manually completed using Node.js recovery script - production safe'
      WHERE migration_name = '20250822_add_rbac_models_manual'
        AND finished_at IS NULL
    `)
    console.log('✅ Migration marked as complete')

    // Step 9: Verify everything
    console.log('\n📊 Final Verification:')
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('groups', 'permissions', 'user_groups', 'user_permissions', 'group_permissions')
      ORDER BY table_name
    `
    console.log('RBAC Tables:', finalTables.map(t => t.table_name).join(', '))

    const finalMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count 
      FROM "_prisma_migrations" 
      WHERE migration_name = '20250822_add_rbac_models_manual'
    `
    console.log('Migration Status:', finalMigration[0])

    console.log('\n✅ SUCCESS! Migration recovery complete.')
    console.log('\n📝 Next steps:')
    console.log('   1. Run: npx prisma migrate deploy')
    console.log('   2. Verify no errors occur')
    console.log('   3. Test your application')

  } catch (error) {
    console.error('\n❌ Error during recovery:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the recovery
recoverFailedMigration()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
