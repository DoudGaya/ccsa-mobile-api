import { CertificateGenerator } from './lib/certificate/generator.js'
import fs from 'fs'
import path from 'path'
async function testCertificateGeneration() {
  console.log('Testing Certificate Generation...')
  
  try {
    const generator = new CertificateGenerator()
    
    // Sample farmer data for testing
    const testFarmer = {
      id: 'test-farmer-1',
      firstName: 'John',
      lastName: 'Doe',
      nin: '12345678901',
      phone: '+2348012345678',
      email: 'john.doe@example.com',
      state: 'FCT',
      lga: 'Abuja Municipal',
      ward: 'Garki',
      address: '123 Test Street, Garki, Abuja',
      registrationDate: new Date('2024-01-15'),
      farms: [
        {
          id: 'farm-1',
          name: 'John\'s Rice Farm',
          location: 'Garki, FCT',
          farmSize: 5.2,
          cropType: 'Rice',
          coordinates: JSON.stringify([
            [9.0765, 7.3986],
            [9.0770, 7.3990],
            [9.0773, 7.3985],
            [9.0768, 7.3981],
            [9.0765, 7.3986]
          ])
        },
        {
          id: 'farm-2',
          name: 'Maize Plantation',
          location: 'Kubwa, FCT',
          farmSize: 3.1,
          cropType: 'Maize',
          coordinates: JSON.stringify([
            [9.1065, 7.3486],
            [9.1070, 7.3490],
            [9.1073, 7.3485],
            [9.1068, 7.3481],
            [9.1065, 7.3486]
          ])
        }
      ]
    }
    
    console.log('Generating certificate for:', testFarmer.firstName, testFarmer.lastName)
    
    const pdfBytes = await generator.generateFarmerCertificate(testFarmer, testFarmer.farms[0], null)
    
    console.log('✅ Certificate generated successfully!')
    if (pdfBytes) {
      console.log('📄 PDF Size:', pdfBytes.byteLength, 'bytes')
      console.log('📊 Size in KB:', Math.round(pdfBytes.byteLength / 1024), 'KB')
    } else {
      console.log('⚠️ PDF bytes not returned (but file may still be created)')
    }
    
    // Save test certificate to file
    const testDir = path.join(process.cwd(), 'test-certificates')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir)
    }
    
    const filename = `CCSA-Test-Certificate-${Date.now()}.pdf`
    const filepath = path.join(testDir, filename)
    
    if (pdfBytes) {
      fs.writeFileSync(filepath, Buffer.from(pdfBytes))
      console.log('💾 Test certificate saved to:', filepath)
    } else {
      console.log('❌ Could not save certificate - no PDF data returned')
    }
    console.log('🎉 Certificate generation test completed successfully!')
    
    return true
  } catch (error) {
    console.error('❌ Certificate generation failed:', error)
    return false
  }
}

// Run test if this script is executed directly
testCertificateGeneration()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Test script error:', error)
    process.exit(1)
  })

export { testCertificateGeneration }
