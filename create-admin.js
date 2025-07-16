const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      return
    }

    // Create admin user
    const adminEmail = 'admin@ccsa.gov.ng'
    const adminPassword = 'admin123' // Change this to a secure password
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        firstName: 'System',
        lastName: 'Administrator',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 Role:', adminUser.role)
    console.log('')
    console.log('🚨 IMPORTANT: Change the default password after first login!')
    console.log('🌐 Access the admin dashboard at: http://localhost:3001')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
