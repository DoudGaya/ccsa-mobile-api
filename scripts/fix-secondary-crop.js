/**
 * Fix secondaryCrop data type issue in production
 * Some records have [] (array) instead of string
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSecondaryCropData() {
  console.log('🔧 Fixing secondaryCrop data type issue...\n')

  try {
    // Step 1: Check the actual column type
    console.log('Step 1: Checking actual column type in database...')
    
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'farms' 
        AND column_name = 'secondaryCrop'
    `
    
    console.log('Column info:', columnInfo[0])
    const columnType = columnInfo[0]?.udt_name || columnInfo[0]?.data_type
    
    // Step 2: Check current data
    console.log('\nStep 2: Checking current secondaryCrop values...')
    
    const problematicFarms = await prisma.$queryRaw`
      SELECT id, "secondaryCrop"
      FROM farms
      WHERE "secondaryCrop" IS NOT NULL
      LIMIT 10
    `
    
    console.log('Sample secondaryCrop values:')
    problematicFarms.forEach(farm => {
      console.log(`  ID: ${farm.id}, Value: ${JSON.stringify(farm.secondaryCrop)}`)
    })

    const totalFarms = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM farms
    `
    console.log(`\nTotal farms: ${totalFarms[0].total}`)

    // Step 3: Fix based on actual column type
    console.log('\nStep 3: Converting array values to strings...')
    console.log(`Column type detected: ${columnType}`)
    
    let result
    
    if (columnType === '_text' || columnType === 'ARRAY') {
      // It's a text array - convert to single string
      console.log('Converting text[] to text...')
      result = await prisma.$executeRawUnsafe(`
        UPDATE farms
        SET "secondaryCrop" = CASE
          WHEN array_length("secondaryCrop"::text[], 1) > 0 THEN
            REPLACE(REPLACE("secondaryCrop"[1], '{', ''), '}', '')
          ELSE NULL
        END
        WHERE "secondaryCrop" IS NOT NULL
      `)
    } else {
      // It's already text/varchar - just clean up the format
      console.log('Cleaning up string values...')
      result = await prisma.$executeRawUnsafe(`
        UPDATE farms
        SET "secondaryCrop" = TRIM(BOTH '{}' FROM "secondaryCrop")
        WHERE "secondaryCrop" LIKE '{%}'
          OR "secondaryCrop" LIKE '%}'
      `)
    }
    
    console.log(`✅ Processed ${result} farm records`)

    // Step 4: Verify fix
    console.log('\nStep 3: Verifying fix...')
    
    const afterFix = await prisma.$queryRaw`
      SELECT id, "secondaryCrop"
      FROM farms
      WHERE "secondaryCrop" IS NOT NULL
      LIMIT 5
    `
    
    console.log('Sample values after fix:')
    afterFix.forEach(farm => {
      console.log(`  ID: ${farm.id}, Value: ${farm.secondaryCrop}`)
    })

    console.log('\n✅ SUCCESS! Data fixed.')
    console.log('\n📝 Next steps:')
    console.log('1. Restart your dev server')
    console.log('2. Dashboard should load without errors')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixSecondaryCropData()
