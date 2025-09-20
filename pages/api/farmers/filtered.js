import { getSession } from 'next-auth/react'
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { 
      type, 
      value, 
      page = 1, 
      limit = 20, 
      sort = 'createdAt', 
      direction = 'desc',
      search 
    } = req.query

    if (!type || !value) {
      return res.status(400).json({ message: 'Filter type and value are required' })
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build the where clause based on filter type
    let whereClause = {}
    
    switch (type) {
      case 'state':
        whereClause = {
          state: {
            equals: value,
            mode: 'insensitive'
          }
        }
        break
        
      case 'cluster':
        whereClause = {
          clusterId: value
        }
        break
        
      case 'crop':
        whereClause = {
          OR: [
            {
              farms: {
                some: {
                  primaryCrop: {
                    equals: value,
                    mode: 'insensitive'
                  }
                }
              }
            },
            {
              farms: {
                some: {
                  secondaryCrop: {
                    contains: value,
                    mode: 'insensitive'
                  }
                }
              }
            }
          ]
        }
        break
        
      default:
        return res.status(400).json({ message: 'Invalid filter type' })
    }

    // Add search functionality
    if (search) {
      const searchCondition = {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            phone: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            nin: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }

      whereClause = {
        AND: [whereClause, searchCondition]
      }
    }

    // Build order by clause
    let orderBy = {}
    switch (sort) {
      case 'firstName':
        orderBy = { firstName: direction }
        break
      case 'lastName':
        orderBy = { lastName: direction }
        break
      case 'phone':
        orderBy = { phone: direction }
        break
      case 'status':
        orderBy = { status: direction }
        break
      case 'createdAt':
      default:
        orderBy = { createdAt: direction }
        break
    }

    // Get total count for pagination
    const totalCount = await prisma.farmer.count({
      where: whereClause
    })

    // Get farmers with pagination
    const farmers = await prisma.farmer.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        nin: true,
        state: true,
        lga: true,
        status: true,
        createdAt: true,
        clusterId: true,
        cluster: {
          select: {
            title: true
          }
        },
        farms: {
          select: {
            primaryCrop: true,
            secondaryCrop: true,
            farmSize: true
          }
        }
      }
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    return res.status(200).json({
      farmers,
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      filter: {
        type,
        value
      }
    })

  } catch (error) {
    console.error('Error fetching filtered farmers:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    })
  }
}
