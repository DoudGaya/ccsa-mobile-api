import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { hasPermission, PERMISSIONS } from '../../../lib/permissions'
import { CertificateGenerator } from '../../../lib/certificate/generator'

export default async function handler(req, res) {
  console.log('Certificate generate API called:', req.method, req.url)
  
  try {
    const session = await getServerSession(req, res, authOptions)
    console.log('Session check:', session ? 'Found' : 'Not found')
    
    if (!session) {
      console.log('No session - returning 401')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check permissions
    const hasPerms = await hasPermission(session.user.id, PERMISSIONS.FARMERS_READ)
    console.log('Permission check:', hasPerms ? 'Granted' : 'Denied')
    
    if (!hasPerms) {
      console.log('No permissions - returning 403')
      return res.status(403).json({ error: 'Insufficient permissions to generate certificates' })
    }

    switch (req.method) {
      case 'POST':
        console.log('Calling generateCertificate function')
        return await generateCertificate(req, res)
      default:
        console.log('Method not allowed:', req.method)
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Certificate API error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

async function generateCertificate(req, res) {
  try {
    console.log('generateCertificate function called')
    const { farmerId } = req.body
    console.log('Farmer ID received:', farmerId)

    if (!farmerId) {
      console.log('No farmer ID provided')
      return res.status(400).json({ error: 'Farmer ID is required' })
    }

    console.log('Fetching farmer data from database...')
    // Fetch farmer data with related information
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: {
        farms: true,
        cluster: true
      }
    })

    console.log('Farmer found:', farmer ? 'Yes' : 'No')
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' })
    }

    // Get the primary farm or first farm
    const primaryFarm = farmer.farms.find(farm => farm.primaryCrop) || farmer.farms[0]
    console.log('Primary farm found:', primaryFarm ? 'Yes' : 'No')
    
    if (!primaryFarm) {
      return res.status(400).json({ error: 'No farm data found for this farmer' })
    }

    console.log('Generating certificate PDF...')
    // Generate certificate
    const generator = new CertificateGenerator()
    const pdfArrayBuffer = await generator.generateFarmerCertificate(farmer, primaryFarm, farmer.cluster)
    console.log('PDF generated, size:', pdfArrayBuffer ? pdfArrayBuffer.byteLength : 'undefined')

    // Generate certificate ID for database storage
    const certificateId = `CCSA-${new Date().getFullYear()}-${farmerId.slice(-6).toUpperCase()}`
    console.log('Certificate ID:', certificateId)

    console.log('Saving certificate record to database...')
    // Save certificate record to database
    const certificate = await prisma.certificate.upsert({
      where: { certificateId },
      update: {
        issuedDate: new Date(),
        status: 'active',
        qrCode: certificateId // For now, using certificateId as QR code data
      },
      create: {
        certificateId,
        farmerId,
        issuedDate: new Date(),
        status: 'active',
        qrCode: certificateId
      }
    })
    console.log('Certificate record saved:', certificate.id)

    // Return PDF as buffer
    const pdfBuffer = Buffer.from(pdfArrayBuffer)
    console.log('Sending PDF response, buffer size:', pdfBuffer.length)

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="CCSA-Certificate-${farmer.firstName}-${farmer.lastName}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.status(200).send(pdfBuffer)

  } catch (error) {
    console.error('Error generating certificate:', error)
    return res.status(500).json({ error: 'Failed to generate certificate', details: error.message })
  }
}

// Export config for handling binary data
export const config = {
  api: {
    responseLimit: '10mb',
  },
}
