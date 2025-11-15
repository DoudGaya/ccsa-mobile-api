import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import ProductionLogger from '../../../lib/productionLogger'
import { enableSSO, disableSSO } from '../../../lib/sso/ssoAuditLog'

/**
 * Manage SSO access for users
 * GET - Check SSO status for a user
 * PUT - Enable/disable SSO for a user
 * POST - Bulk enable SSO
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check authorization (admin only)
  if (!session || session.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    return handleGetSSO(req, res)
  } else if (req.method === 'PUT') {
    return handleUpdateSSO(req, res, session)
  } else if (req.method === 'POST') {
    return handleBulkSSO(req, res, session)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetSSO(req, res) {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        isSSOEnabled: true,
        ssoProvider: true,
        lastSSOLogin: true,
        role: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error) {
    ProductionLogger.error('GET /api/users/[id]/sso error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdateSSO(req, res, session) {
  try {
    const { userId } = req.query
    const { isSSOEnabled } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    if (typeof isSSOEnabled !== 'boolean') {
      return res.status(400).json({ error: 'isSSOEnabled must be boolean' })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update SSO setting
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isSSOEnabled }
    })

    ProductionLogger.info(`SSO ${isSSOEnabled ? 'enabled' : 'disabled'} for user`, {
      userId,
      userEmail: user.email,
      changedBy: session.user.email
    })

    return res.status(200).json({
      message: `SSO ${isSSOEnabled ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSSOEnabled: updatedUser.isSSOEnabled
      }
    })
  } catch (error) {
    ProductionLogger.error('PUT /api/users/[id]/sso error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleBulkSSO(req, res, session) {
  try {
    const { userIds, isSSOEnabled } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array required' })
    }

    if (typeof isSSOEnabled !== 'boolean') {
      return res.status(400).json({ error: 'isSSOEnabled must be boolean' })
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isSSOEnabled }
    })

    ProductionLogger.info(`SSO ${isSSOEnabled ? 'enabled' : 'disabled'} for ${result.count} users`, {
      userCount: result.count,
      changedBy: session.user.email
    })

    return res.status(200).json({
      message: `SSO ${isSSOEnabled ? 'enabled' : 'disabled'} for ${result.count} users`,
      count: result.count
    })
  } catch (error) {
    ProductionLogger.error('POST /api/users/sso/bulk error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
