import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import ProductionLogger from '../../../../lib/productionLogger'
import { getSSOAuditLogs } from '../../../../lib/sso/ssoAuditLog'

/**
 * Get SSO audit logs (admin only)
 * Query params:
 * - provider: filter by SSO provider
 * - status: filter by status (success, user_not_found, sso_disabled, error)
 * - email: filter by email (partial match)
 * - startDate: filter from date
 * - endDate: filter to date
 * - page: pagination (default 1)
 * - limit: results per page (default 50)
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check authorization (admin only)
  if (!session || session.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { provider, status, email, startDate, endDate, page = 1, limit = 50 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const result = await getSSOAuditLogs({
      provider,
      status,
      email,
      startDate,
      endDate,
      limit: parseInt(limit),
      skip
    })

    return res.status(200).json(result)
  } catch (error) {
    ProductionLogger.error('GET /api/admin/sso-audit-logs error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
