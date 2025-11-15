/**
 * Add SSO columns to database (production safe)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addSSOColumns() {
  console.log('🔧 Adding SSO columns to users table...\n')

  try {
    // Step 1: Check if columns already exist
    console.log('Step 1: Checking existing columns...')
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('ssoProviderId', 'ssoProvider', 'ssoEmail', 'lastSSOLogin', 'isSSOEnabled')
      ORDER BY column_name
    `
    
    const existingColumns = columns.map(c => c.column_name)
    console.log('Existing SSO columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'None')

    // Step 2: Add missing columns
    console.log('\nStep 2: Adding missing SSO columns...')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoProviderId" TEXT
    `)
    console.log('✅ ssoProviderId column ready')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoProvider" TEXT
    `)
    console.log('✅ ssoProvider column ready')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoEmail" TEXT
    `)
    console.log('✅ ssoEmail column ready')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSSOLogin" TIMESTAMP(3)
    `)
    console.log('✅ lastSSOLogin column ready')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSSOEnabled" BOOLEAN NOT NULL DEFAULT false
    `)
    console.log('✅ isSSOEnabled column ready')

    // Step 3: Create SSOAuditLog table
    console.log('\nStep 3: Creating SSOAuditLog table...')
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SSOAuditLog" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "reason" TEXT,
        "metadata" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SSOAuditLog_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ SSOAuditLog table ready')

    // Step 4: Create indexes
    console.log('\nStep 4: Creating indexes...')
    
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SSOAuditLog_email_idx" ON "SSOAuditLog"("email")`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SSOAuditLog_timestamp_idx" ON "SSOAuditLog"("timestamp")`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SSOAuditLog_provider_idx" ON "SSOAuditLog"("provider")`)
      console.log('✅ Indexes created')
    } catch (e) {
      console.log('⚠️  Some indexes already exist (this is fine)')
    }

    // Step 5: Verify
    console.log('\nStep 5: Verifying changes...')
    
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('ssoProviderId', 'ssoProvider', 'ssoEmail', 'lastSSOLogin', 'isSSOEnabled')
      ORDER BY column_name
    `
    
    console.log('SSO Columns in users table:')
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'SSOAuditLog'
    `
    
    if (tableExists.length > 0) {
      console.log('  - SSOAuditLog table exists ✅')
    }

    console.log('\n✅ SUCCESS! All SSO columns and tables added.')
    console.log('\n📝 Next steps:')
    console.log('1. Stop dev server (Ctrl+C)')
    console.log('2. Run: npx prisma generate')
    console.log('3. Run: npm run dev')
    console.log('4. Try logging in again')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n🔧 Database is offline! Please:')
      console.error('1. Go to https://console.neon.tech')
      console.error('2. Resume your database')
      console.error('3. Wait 30 seconds, then run this script again')
    } else {
      console.error('\nFull error:', error)
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addSSOColumns()
