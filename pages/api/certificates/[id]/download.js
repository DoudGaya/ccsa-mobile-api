import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import prisma from '../../../../lib/prisma'
import ProductionLogger from '../../../../lib/productionLogger'

export default async function handler(req, res) {
  try {
    // Get session
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      ProductionLogger.warn('Unauthorized certificate download attempt')
      return res.status(401).json({ error: 'Unauthorized' })
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
        ProductionLogger.warn(`Certificate not found: ${id}`)
        return res.status(404).json({ error: 'Certificate not found' })
      }

      ProductionLogger.info(`Certificate download requested: ${certificate.certificateId}`)

      // For now, return a simple PDF info response
      // TODO: Implement actual PDF generation when certificate generator is available
      res.status(200).json({
        message: 'Certificate download feature coming soon',
        certificate: {
          id: certificate.id,
          certificateId: certificate.certificateId,
          farmer: certificate.farmer.firstName + ' ' + certificate.farmer.lastName,
          createdAt: certificate.createdAt
        }
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    ProductionLogger.error('Certificate download error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
