import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { validatePermissions } from '../../../lib/authMiddleware'
import { PERMISSIONS } from '../../../lib/permissions'
import { PrismaClient } from '@prisma/client'
import { CertificateGenerator } from '../../../../lib/certificate/generator'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Get session
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Validate permissions
    const hasPermission = await validatePermissions(session, [PERMISSIONS.FARMERS_READ])
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    if (req.method === 'GET') {
      const { id } = req.query

      // Get certificate with farmer and farm data
      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
          farmer: {
            include: {
              farms: true
            }
          }
        }
      })

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' })
      }

      // Generate PDF
      const generator = new CertificateGenerator()
      const pdfArrayBuffer = await generator.generateFarmerCertificate(certificate.farmer, certificate.farmer.farms[0], null)

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="CCSA-Certificate-${certificate.certificateId}.pdf"`)
      res.setHeader('Content-Length', pdfArrayBuffer.byteLength)

      res.send(Buffer.from(pdfArrayBuffer))
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Download Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
