import prisma from '../prisma'
import ProductionLogger from '../productionLogger'

/**
 * Log SSO authentication attempts for audit and security
 * @param {string} email - User email attempting SSO
 * @param {string} provider - SSO provider (google, microsoft, etc.)
 * @param {string} status - Result status (success, user_not_found, sso_disabled, error)
 * @param {string} reason - Detailed reason for the status
 * @param {object} metadata - Additional metadata (sanitized)
 * @param {string} ipAddress - User's IP address
 * @param {string} userAgent - User's browser agent
 */
export async function logSSOAttempt(
  email,
  provider,
  status,
  reason = null,
  metadata = null,
  ipAddress = null,
  userAgent = null
) {
  try {
    // Find user ID if user exists
    let userId = null
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      })
      userId = user?.id
    } catch (err) {
      // User doesn't exist, that's okay
    }

    // Log to database
    const auditLog = await prisma.sSOAuditLog.create({
      data: {
        userId,
        email,
        provider,
        status,
        reason,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      }
    })

    // Also log to production logger
    ProductionLogger.info(`SSO attempt [${status}]`, {
      email,
      provider,
      reason,
      userId,
      timestamp: new Date().toISOString()
    })

    return auditLog
  } catch (error) {
    ProductionLogger.error('Failed to log SSO attempt:', {
      email,
      provider,
      error: error.message
    })
    // Don't throw - logging failure shouldn't break auth
  }
}

/**
 * Get SSO audit logs with filtering
 */
export async function getSSOAuditLogs(filters = {}) {
  try {
    const { provider, status, email, startDate, endDate, limit = 50, skip = 0 } = filters

    const where = {}
    
    if (provider) where.provider = provider
    if (status) where.status = status
    if (email) where.email = { contains: email, mode: 'insensitive' }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.sSOAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: { select: { id: true, email: true, displayName: true } }
        }
      }),
      prisma.sSOAuditLog.count({ where })
    ])

    return {
      logs,
      total,
      page: Math.ceil(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    }
  } catch (error) {
    ProductionLogger.error('Failed to get SSO audit logs:', error.message)
    throw error
  }
}

/**
 * Check for suspicious SSO activity (brute force)
 */
export async function checkSuspiciousActivity(email, provider = null, timeWindowMinutes = 15) {
  try {
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000)

    const where = {
      email,
      createdAt: { gte: since },
      status: 'user_not_found' // Failed attempts
    }

    if (provider) where.provider = provider

    const failedAttempts = await prisma.sSOAuditLog.count({ where })

    return {
      isSuspicious: failedAttempts > 5,
      failedAttempts,
      timeWindowMinutes,
      recommendation: failedAttempts > 5 ? 'BLOCK_TEMPORARILY' : 'ALLOW'
    }
  } catch (error) {
    ProductionLogger.error('Failed to check suspicious activity:', error.message)
    return { isSuspicious: false, failedAttempts: 0 }
  }
}

/**
 * Enable SSO for a user
 */
export async function enableSSO(userId, enabledBy) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSSOEnabled: true }
    })

    ProductionLogger.info(`SSO enabled for user`, { userId, enabledBy })

    return user
  } catch (error) {
    ProductionLogger.error('Failed to enable SSO:', error.message)
    throw error
  }
}

/**
 * Disable SSO for a user
 */
export async function disableSSO(userId, disabledBy) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSSOEnabled: false }
    })

    ProductionLogger.info(`SSO disabled for user`, { userId, disabledBy })

    return user
  } catch (error) {
    ProductionLogger.error('Failed to disable SSO:', error.message)
    throw error
  }
}

/**
 * Bulk enable SSO for multiple users
 */
export async function bulkEnableSSO(userIds, enabledBy) {
  try {
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isSSOEnabled: true }
    })

    ProductionLogger.info(`SSO enabled for ${result.count} users`, { enabledBy })

    return result
  } catch (error) {
    ProductionLogger.error('Failed to bulk enable SSO:', error.message)
    throw error
  }
}
