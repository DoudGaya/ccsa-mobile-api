import { prisma } from './prisma'

/**
 * Automatically update farmer status based on their farm count
 * @param {string} farmerId - The ID of the farmer to update
 * @returns {Promise<string>} The new status
 */
export async function updateFarmerStatusByFarms(farmerId) {
  try {
    // Get farmer's current status and farm count
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            farms: true
          }
        }
      }
    })

    if (!farmer) {
      throw new Error('Farmer not found')
    }

    // Don't update if status is already Validated or Verified (manual statuses)
    if (farmer.status === 'Validated' || farmer.status === 'Verified') {
      return farmer.status
    }

    // Determine new status based on farm count
    let newStatus = 'Enrolled' // Default status
    
    if (farmer._count.farms > 0) {
      newStatus = 'FarmCaptured'
    }

    // Update status if it has changed
    if (newStatus !== farmer.status) {
      await prisma.farmer.update({
        where: { id: farmerId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      })
      
      console.log(`Farmer status updated: ${farmerId} from ${farmer.status} to ${newStatus}`)
    }

    return newStatus

  } catch (error) {
    console.error('Error updating farmer status:', error)
    throw error
  }
}

/**
 * Get farmer status statistics for dashboard
 * @returns {Promise<Object>} Status breakdown
 */
export async function getFarmerStatusStats() {
  try {
    const statusCounts = await prisma.farmer.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    return statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {
      'Enrolled': 0,
      'FarmCaptured': 0,
      'Validated': 0,
      'Verified': 0
    })

  } catch (error) {
    console.error('Error getting farmer status stats:', error)
    return {
      'Enrolled': 0,
      'FarmCaptured': 0,
      'Validated': 0,
      'Verified': 0
    }
  }
}

/**
 * Bulk update farmer statuses based on their farm counts
 * This can be run as a maintenance task
 * @returns {Promise<Object>} Update results
 */
export async function bulkUpdateFarmerStatuses() {
  try {
    const farmers = await prisma.farmer.findMany({
      where: {
        status: {
          notIn: ['Validated', 'Verified'] // Don't update manual statuses
        }
      },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            farms: true
          }
        }
      }
    })

    let updated = 0
    const results = {
      total: farmers.length,
      updated: 0,
      errors: []
    }

    for (const farmer of farmers) {
      try {
        const newStatus = farmer._count.farms > 0 ? 'FarmCaptured' : 'Enrolled'
        
        if (newStatus !== farmer.status) {
          await prisma.farmer.update({
            where: { id: farmer.id },
            data: { 
              status: newStatus,
              updatedAt: new Date()
            }
          })
          updated++
        }
      } catch (error) {
        results.errors.push({
          farmerId: farmer.id,
          error: error.message
        })
      }
    }

    results.updated = updated
    console.log(`Bulk farmer status update completed: ${updated}/${farmers.length} farmers updated`)

    return results

  } catch (error) {
    console.error('Error in bulk farmer status update:', error)
    throw error
  }
}
