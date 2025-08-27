import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

/**
 * API endpoint to update farmer status
 * PUT /api/farmers/status
 */
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get session for authentication
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { farmerId, status } = req.body

    // Validate input
    if (!farmerId || !status) {
      return res.status(400).json({ message: 'Farmer ID and status are required' })
    }

    // Validate status values
    const validStatuses = ['Enrolled', 'FarmCaptured', 'Validated', 'Verified']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    // Update farmer status
    const updatedFarmer = await prisma.farmer.update({
      where: { id: farmerId },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true
      }
    })

    console.log(`Farmer status updated: ${farmerId} -> ${status}`)

    return res.status(200).json({
      message: 'Farmer status updated successfully',
      farmer: updatedFarmer
    })

  } catch (error) {
    console.error('Error updating farmer status:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Farmer not found' })
    }
    
    return res.status(500).json({ 
      message: 'Failed to update farmer status',
      error: error.message 
    })
  }
}
