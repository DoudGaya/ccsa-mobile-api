import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { 
  UsersIcon, 
  UserGroupIcon, 
  MapIcon, 
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchDashboardAnalytics()
  }, [session, status])

  const fetchDashboardAnalytics = async () => {
    try {
      console.log('Fetching analytics...')
      const response = await fetch('/api/dashboard/analytics') // Back to original
      console.log('Analytics response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Analytics data received:', data)
        setAnalytics(data)
      } else {
        console.error('Analytics API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || 0
  }

  // Helper function to get progress color
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Please sign in to view dashboard.</div>
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Failed to load analytics data. Please refresh the page.</div>
        </div>
      </Layout>
    )
  }

  const { overview, geography, demographics, clusters, trends, crops } = analytics

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section with Goal Progress */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">
                  Welcome back, {session.user.name || session.user.email}!
                </h3>
                <p className="text-green-100 mb-4">
                  Farmer Registration Management System
                </p>
                
                {/* Goal Progress */}
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Goal : 2 Million Farmers</span>
                    <span className="text-lg font-bold">{overview.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(overview.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-green-100">
                    <span>{formatNumber(overview.totalFarmers)} registered</span>
                    <span>{formatNumber(overview.remaining)} remaining</span>
                  </div>
                </div>
              </div>
              
              <div className="ml-8">
                <TrophyIcon className="h-20 w-20 text-yellow-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/farmers')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-500 rounded-md p-3">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Farmers</dt>
                    <dd className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalFarmers)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/agents')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-green-500 rounded-md p-3">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate"> Agents</dt>
                    <dd className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalAgents)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/clusters')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-purple-500 rounded-md p-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clusters</dt>
                    <dd className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalClusters)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* This is be card to display total hectares based on the hectace calculation utility */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/farms')}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-yellow-500 rounded-md p-3">
                    <GlobeAltIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Hectares</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {formatNumber(overview.totalHectares)} ha
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
                Registration Trends (12 Months)
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between space-x-2">
                {trends.monthly.map((month, index) => {
                  const maxCount = Math.max(...trends.monthly.map(m => m.count))
                  // Ensure proper height calculation with minimum height for non-zero values
                  let height = 0
                  if (month.count === 0) {
                    height = 0
                  } else if (maxCount === 0) {
                    height = 20 // Default height if all are zero
                  } else {
                    height = Math.max(10, (month.count / maxCount) * 90) // 10% minimum, 90% maximum
                  }
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t hover:bg-blue-600 transition-colors duration-200 ${
                          month.count === 0 ? 'bg-gray-300' : 'bg-blue-500'
                        }`}
                        style={{ 
                          height: `${height}%`,
                          minHeight: month.count > 0 ? '8px' : '2px'
                        }}
                        title={`${month.month}: ${month.count} farmers`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center">
                        {month.month}
                      </div>
                      <div className="text-xs font-medium text-gray-700 mt-1">
                        {month.count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Gender</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {demographics.byGender.map((gender, index) => {
                  const percentage = overview.totalFarmers > 0 ? (gender.count / overview.totalFarmers) * 100 : 0
                  const colors = ['bg-blue-500', 'bg-pink-500', 'bg-gray-400']
                  const color = colors[index] || 'bg-gray-400'
                  
                  return (
                    <div key={gender.gender}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">{gender.gender}</span>
                        <span className="text-gray-500">{gender.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Geographic and Cluster Analysis */}
        <div className="grid grid-cols-1 gap-6">
          {/* Top Crops */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Registered Crops</h3>
              <p className="text-sm text-gray-500 mt-1">
                {crops?.totalCrops || 0} different crops • {crops?.topCrops?.reduce((sum, crop) => sum + crop.count, 0) || 0} total registrations
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(crops?.topCrops || []).slice(0, 10).map((crop, index) => {
                  // Calculate relative percentage based on the highest crop count
                  const maxCount = Math.max(...(crops?.topCrops || []).slice(0, 10).map(c => c.count))
                  const relativePercentage = maxCount > 0 ? (crop.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={crop.crop} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-medium text-gray-900 capitalize w-24 truncate">
                          {crop.crop}
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${relativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-sm text-gray-600">
                          {formatNumber(crop.count)}
                        </span>
                        <div className="text-xs text-gray-500">
                          P:{crop.primary || 0} S:{crop.secondary || 0}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {(!crops?.topCrops || crops.topCrops.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No crop data available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top States */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top States by Farmers</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {geography.byState.slice(0, 10).map((state, index) => {
                  // Calculate relative percentage based on the highest state count
                  const maxCount = Math.max(...geography.byState.slice(0, 10).map(s => s.count))
                  const relativePercentage = maxCount > 0 ? (state.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={state.state} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-sm font-medium text-gray-900 capitalize w-20 truncate">
                          {state.state}
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${relativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {formatNumber(state.count)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Clusters */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Cluster Performance & Progress</h3>
              <p className="text-sm text-gray-500 mt-1">
                {clusters.activeClusters} active clusters • {clusters.totalClusters} total
              </p>
            </div>
            <div className="p-6">
              <div className="gap-4 grid grid-cols-3">
                {clusters.byClusters.slice(0, 10).map((cluster, index) => {
                  // Calculate relative bar width for visual comparison
                  const maxFarmers = Math.max(...clusters.byClusters.map(c => c.farmersCount));
                  const barWidth = maxFarmers > 0 ? (cluster.farmersCount / maxFarmers) * 100 : 0;
                  
                  return (
                    <div key={cluster.clusterId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              #{index + 1}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {cluster.clusterTitle}
                            </h4>
                            {cluster.isActive && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {cluster.clusterDescription}
                          </p>
                          {cluster.clusterLeadName && (
                            <p className="text-xs text-gray-600 mt-1">
                              Lead: {cluster.clusterLeadName}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-green-600">
                            {formatNumber(cluster.farmersCount)}
                          </div>
                          <div className="text-xs text-gray-500">farmers</div>
                          <div className="text-xs text-blue-600 font-medium">
                            {cluster.progressPercentage}% of total
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar for this cluster */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Cluster Progress</span>
                          <span>{cluster.farmersCount} farmers</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {clusters.byClusters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No clusters found. Please assign farmers to clusters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => router.push('/agents/new')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Create New Agent
              </button>
              <button
                onClick={() => router.push('/farmers')}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                View All Farmers
              </button>
              <button
                onClick={() => router.push('/clusters')}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                Manage Clusters
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
            </div>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${analytics.databaseStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Database: {analytics.databaseStatus}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
