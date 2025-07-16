import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { 
  UsersIcon, 
  UserGroupIcon, 
  MapIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalAgents: 0,
    totalFarms: 0,
    recentRegistrations: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchDashboardStats()
  }, [session, status])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null
  }

  const statCards = [
    {
      title: 'Total Farmers',
      value: stats.totalFarmers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      href: '/farmers'
    },
    {
      title: 'Active Agents',
      value: stats.totalAgents,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      href: '/agents'
    },
    {
      title: 'Registered Farms',
      value: stats.totalFarms,
      icon: MapIcon,
      color: 'bg-purple-500',
      href: '/farms'
    },
    {
      title: 'Recent Registrations',
      value: stats.recentRegistrations,
      icon: ArrowTrendingUpIcon,
      color: 'bg-orange-500',
      href: '/analytics'
    }
  ]

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome back, {session.user.name || session.user.email}!
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Here's an overview of your farmer registration and management system.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => router.push(card.href)}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} rounded-md p-3`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => router.push('/agents/new')}
                className="btn-primary text-center"
              >
                Create New Agent
              </button>
              <button
                onClick={() => router.push('/farmers')}
                className="btn-secondary text-center"
              >
                View All Farmers
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="btn-secondary text-center"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-sm text-gray-500">
              Recent farmer registrations and agent activities will appear here.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
