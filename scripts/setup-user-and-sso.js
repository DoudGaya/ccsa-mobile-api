/**
 * Fix SSO + Create Test User
 * Run this after stopping dev server
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function fixAndSetup() {
  console.log('🔧 Setting up SSO and creating test user...\n')

  try {
    // Step 1: Create or update user
    const email = 'abdulrahman.dauda@cosmopolitan.edu.ng'
    const password = 'changeme123' // Change this!

    console.log(`Step 1: Checking if user exists: ${email}`)
    
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('User not found. Creating new user...')
      const hashedPassword = await bcrypt.hash(password, 10)
      
      user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          displayName: 'Abdulrahman Dauda',
          firstName: 'Abdulrahman',
          lastName: 'Dauda',
          role: 'super_admin',
          isActive: true,
          isVerified: true,
          isSSOEnabled: true, // Enable SSO for this user
        }
      })
      
      console.log('✅ User created successfully!')
      console.log(`   Email: ${email}`)
      console.log(`   Temporary Password: ${password}`)
      console.log('   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!')
    } else {
      console.log('✅ User already exists')
      
      // Enable SSO for existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSSOEnabled: true,
          isActive: true
        }
      })
      console.log('✅ SSO enabled for user')
    }

    // Step 2: Verify schema
    console.log('\nStep 2: Verifying database schema...')
    
    const roleCount = await prisma.roles.count()
    console.log(`✅ Roles table exists (${roleCount} roles)`)
    
    const permCount = await prisma.permission.count()
    console.log(`✅ Permissions table exists (${permCount} permissions)`)

    // Step 3: Create a super_admin role if it doesn't exist
    console.log('\nStep 3: Setting up super_admin role...')
    
    let superAdminRole = await prisma.roles.findFirst({
      where: { name: 'super_admin' }
    })

    if (!superAdminRole) {
      superAdminRole = await prisma.roles.create({
        data: {
          name: 'super_admin',
          description: 'System Administrator with full access',
          isSystem: true,
          isActive: true,
          permissions: {
            all: true // Full access
          }
        }
      })
      console.log('✅ super_admin role created')
    } else {
      console.log('✅ super_admin role already exists')
    }

    // Step 4: Assign role to user
    console.log('\nStep 4: Assigning role to user...')
    
    const existingUserRole = await prisma.user_roles.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id
      }
    })

    if (!existingUserRole) {
      await prisma.user_roles.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
          assignedBy: 'system'
        }
      })
      console.log('✅ Role assigned to user')
    } else {
      console.log('✅ User already has role')
    }

    // Step 5: Final verification
    console.log('\n📊 Final Status:')
    console.log('─'.repeat(50))
    
    const verifiedUser = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    console.log(`Email: ${verifiedUser.email}`)
    console.log(`Name: ${verifiedUser.displayName}`)
    console.log(`Role: ${verifiedUser.role}`)
    console.log(`Active: ${verifiedUser.isActive}`)
    console.log(`SSO Enabled: ${verifiedUser.isSSOEnabled}`)
    console.log(`Assigned Roles: ${verifiedUser.userRoles.map(ur => ur.role.name).join(', ') || 'None'}`)
    
    console.log('\n✅ Setup complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Stop your dev server (Ctrl+C)')
    console.log('2. Run: npx prisma generate')
    console.log('3. Run: npm run dev')
    console.log('4. Try logging in with credentials OR Google SSO')
    console.log('\nCredentials Login:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\nGoogle SSO:')
    console.log(`   Click "Sign in with Google"`)
    console.log(`   Use: ${email}`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixAndSetup()
