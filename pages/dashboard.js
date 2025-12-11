import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { DashboardLoader } from '../components/PageLoader'
import { usePermissions, PERMISSIONS } from '../components/PermissionProvider'
import { getFirstAvailableRoute } from '../lib/redirectHelper'
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

// Dynamically import Chart.js components to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
})
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
})
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
})

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Check dashboard access permission
    if (!hasPermission(PERMISSIONS.DASHBOARD_ACCESS)) {
      // Redirect to first available route instead of signin
      const firstAvailableRoute = getFirstAvailableRoute(hasPermission)
      router.push(firstAvailableRoute)
      return
    }
    
    fetchDashboardAnalytics()
  }, [session, status, hasPermission])

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
      return (num / 1000).toFixed(1) + ('K')
    }
    return num?.toLocaleString() || 0
  }

  // Chart configurations
  const createBarChartData = (trends) => {
    if (!trends?.monthly) return null
    
    // Filter to start from 2025 and ensure consistent bar sizes
    const monthlyData = trends.monthly.filter(month => {
      const year = new Date(month.date).getFullYear()
      return year >= 2025
    })

    return {
      labels: monthlyData.map(month => month.month),
      datasets: [
        {
          label: 'Farmer Registrations',
          data: monthlyData.map(month => month.count),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    }
  }

  const createDoughnutChartData = (demographics) => {
    if (!demographics?.byGender) return null
    
    const colors = ['#3B82F6', '#EC4899', '#6B7280']
    return {
      labels: demographics.byGender.map(g => g.gender),
      datasets: [
        {
          data: demographics.byGender.map(g => g.count),
          backgroundColor: colors.slice(0, demographics.byGender.length),
          borderColor: colors.slice(0, demographics.byGender.length),
          borderWidth: 2,
        }
      ]
    }
  }

  const createProgressChartData = (overview) => {
    const progress = overview?.progressPercentage || 0
    const remaining = 100 - progress
    
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [
        {
          data: [progress, remaining],
          backgroundColor: ['#10B981', '#E5E7EB'],
          borderColor: ['#059669', '#D1D5DB'],
          borderWidth: 2,
        }
      ]
    }
  }

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: '#6B7280',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${context.formattedValue} (${percentage}%)`
          }
        }
      },
    },
    cutout: '60%',
  }

  const progressOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context) {
            const percentage = context.parsed.toFixed(1)
            return `${context.label}: ${percentage}%`
          }
        }
      },
    },
    cutout: '70%',
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Dashboard">
        <DashboardLoader />
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
        <div className=" border border-gray-200 rounded-lg bg-white  ">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 ">
                <h3 className="text-2xl font-sans font-bold mb-2">
                  {session.user.name || session.user.email}
                </h3>
                <p className=" textblue-950 mb-4">
                  Farmer Information Management System (FIMS)
                </p>
                
                {/* Goal Progress */}
                <div className=" rounded-lg py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Target 2 Million Farmers by 2026</span>
                    <span className="text-lg font-bold">{overview.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-500 bg-opacity-30 rounded-md h-4">
                    <div 
                      className=" bg-blue-900 h-4 rounded-md transition-all duration-500" 
                      style={{ width: `${Math.min(overview.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-black">
                    <span className=' font-semibold'>{formatNumber(overview.totalFarmers)} registered</span>
                    <span className=' font-semibold'>{formatNumber(overview.remaining)}</span>
                  </div>
                </div>
              </div>
              
              <div className="ml-8">
                {/* <TrophyIcon className="h-20 w-20 text-yellow-300" /> */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/farmers')}>
            <div className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-full">
                  <div className=" rounded-md bg-blue-900/20 p-3">
                    <UsersIcon className="h-12 w-12 text-blue-950" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dd className="text-4xl font-semibold font-sans text-gray-900">{formatNumber(overview.totalFarmers)}</dd>
                    <dt className="text-sm font-medium text-gray-500 truncate">Farmers</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/agents')}>
            <div className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-900/20 p-3">
                    <UserGroupIcon className="h-12 w-12 text-blue-950" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dd className="text-4xl font-semibold font-sans text-gray-900">{formatNumber(overview.totalAgents)}</dd>
                    <dt className="text-sm font-medium text-gray-800 truncate"> Agents</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/clusters')}>
            <div className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-900/20 p-3">
                    <BuildingOfficeIcon className="h-12 w-12 text-blue-950" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dd className="text-4xl font-semibold font-sans text-gray-900">{formatNumber(overview.totalClusters)}</dd>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clusters</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* This is be card to display total hectares based on the hectace calculation utility */}
          <div className="bg-white overflow-hidden shadow rounded-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push('/farms')}>
            <div className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-900/20 rounded-md p-3">
                    <GlobeAltIcon className="h-12 w-12 text-blue-950" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dd className="text-4xl font-semibold font-sans text-gray-900">
                      {formatNumber(overview.totalHectares)}
                    </dd>
                    <dt className="text-sm font-medium text-gray-500 truncate">Hectares</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Monthly Trends Chart */}
          <div className=" bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
                Registration Trends (From 2025)
              </h3>
              <p className="text-sm text-gray-500 mt-1">Monthly farmer registration statistics</p>
            </div>
            <div className="p-6">
              <div className="h-80">
                {trends?.monthly && createBarChartData(trends) ? (
                  <Bar data={createBarChartData(trends)} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No registration data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
             {/* Gender Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Gender Distribution</h3>
              <p className="text-sm text-gray-500 mt-1">Farmer demographics</p>
            </div>
            <div className="p-6">
              <div className="h-80">
                {demographics?.byGender && createDoughnutChartData(demographics) ? (
                  <Doughnut data={createDoughnutChartData(demographics)} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No gender data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

             {/* Top Crops Chart */}
          <div className=" bg-white col-span-2 p-2 shadow rounded-lg">
            <div className="px-6 py-4 bg-gray-100 rounded-lg border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Registered Crops/Animals</h3>
              <p className="text-sm text-gray-500 mt-1">
                {crops?.totalCrops || 0} different crops • {crops?.topCrops?.reduce((sum, crop) => sum + crop.count, 0) || 0} Total registrations • Click to view farmers
              </p>
            </div>
            <div className=" py-2">
              <div className=" grid grid-cols-3 gap-4">
                {(crops?.topCrops || []).slice(0, 9).map((crop, index) => {
                  const maxCount = Math.max(...(crops?.topCrops || []).slice(0, 9).map(c => c.count))
                  const relativePercentage = maxCount > 0 ? (crop.count / maxCount) * 100 : 0
                    const colors = [
                    'bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500',
                    'bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500'
                  ]
                  
                  // const colors = [
                  //   'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
                  //   'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
                  // ]
                  
                  return (
                    <div 
                      key={crop.crop} 
                      className="flex flex-col shadow-md mt-6 border p-1 rounded-lg hover:bg-gray-white hover:shadow-md hover:drop-shadow-md transition-colors cursor-pointer"
                      onClick={() => router.push(`/filtered-farmers?type=crop&value=${encodeURIComponent(crop.crop)}&label=${encodeURIComponent(crop.crop)}`)}
                    >
                      <div className="flex flex-col ">
                        {/* <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`}></div> */}
                        <div className=' p-2 rounded-lg mb-2 flex  space-x-2'>
                        
      
                         <div className=' flex space-y-3 flex-col items-start w-full'>
                          <div className=' flex items-end space-x-1' >
                            <span className="text-4xl font-sans font-semibold text-gray-600">
                              {formatNumber(crop.count)}
                            </span>
                             <p className=' text-lg text-gray-600 font-semibold'>{crop.crop}</p>
                          </div>
                          
                           <div className=' flex items-end justify-end text-right'>
                            <div className="text-xs flex text-end space-x-2  items-end justify-end text-gray-500">
                              <span className=' bg-green-600/20 text-end py-1 rounded-full text-green-950 font-semibold px-3 max-w-max'>{crop.primary || 0} Primary</span>
                              <span className=' max-w-max font-semibold bg-yellow-600/20 py-1 rounded-full text-yellow-900 px-3'>{crop.secondary || 0} Secondary</span>
                           </div>
                           </div>
                          </div>

                           <div className='flex items-center justify-center h-14 w-14  rounded-lg relative '>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className=" p-1 absolute top-0 right-0 bg-green-200/40 rounded-lg stroke-green-900 size-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                          </svg>
                         </div>
                         
                        
                        </div>
                        
                        <span className="text-sm font-medium text-gray-900 capitalize w-32 truncate">
                        </span>
                        <div className="flex-1">
                          <div className="w-full bg-gray-300 rounded-full h-1">
                            <div 
                              className={`${colors[index % colors.length].replace('bg-', 'bg-')} h-1 rounded-full transition-all duration-500`}
                              style={{ width: `${relativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                      
                       
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {(!crops?.topCrops || crops.topCrops.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <MapIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No crop data available yet</p>
                  <p className="text-sm">Crops will appear as farmers register their farms</p>
                </div>
              )}
            </div>
          </div>
          
          

              {/* Goal Progress Chart */}
        {/* <div className="grid grid-cols-1 gap-6">
          <div className="lg:col-span-1 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Goal Progress</h3>
              <p className="text-sm text-gray-500 mt-1">2M farmers target</p>
            </div>
            <div className="p-6">
              <div className="h-60">
                {overview && createProgressChartData(overview) ? (
                  <div className="relative">
                    <Doughnut data={createProgressChartData(overview)} options={progressOptions} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {overview.progressPercentage?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Complete</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <TrophyIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div> */}

        </div>

    

        {/* Geographic and Cluster Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Top States */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapIcon className="h-5 w-5 mr-2 text-green-500" />
                Top States by Farmers
              </h3>
              <p className="text-sm text-gray-500 mt-1">Geographic distribution across Nigeria • Click to view farmers</p>
            </div>
            <div className="p-6">
              <div className=" grid grid-cols-1 lg:grid-cols-3 gap-4">
                {geography.byState.slice(0, 12).map((state, index) => {
                  const maxCount = Math.max(...geography.byState.slice(0, 10).map(s => s.count))
                  const relativePercentage = maxCount > 0 ? (state.count / maxCount) * 100 : 0
                  const statePercentage = overview.totalFarmers > 0 ? (state.count / overview.totalFarmers) * 100 : 0
                  
                  return (
                    <div 
                      key={state.state} 
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/filtered-farmers?type=state&value=${encodeURIComponent(state.state)}&label=${encodeURIComponent(state.state)}`)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-green-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {state.state}
                            </span>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">
                                {formatNumber(state.count)}
                              </span>
                              <div className="text-xs text-gray-500">
                                {statePercentage.toFixed(1)}% of total
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${relativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Clusters */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-500" />
                Cluster Performance
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {/* {clusters.activeClusters} active  */}
               <span className=' bg-green-300/30 text-green-950 font-semibold rounded-full px-3'> {clusters.totalClusters} total Clusters </span>
              </p>
            </div>
            <div className="p-6">
              <div className=" gap-4 grid grid-cols-3">
                {clusters.byClusters.slice(0, 8).map((cluster, index) => {
                  const maxFarmers = Math.max(...clusters.byClusters.map(c => c.farmersCount));
                  const barWidth = maxFarmers > 0 ? (cluster.farmersCount / maxFarmers) * 100 : 0;
                  
                  return (
                    <div 
                      key={cluster.clusterId} 
                      className=" bg-stone-100 rounded-lg hover:bg-stone-50 pt-10 px-4 p-1 transition-colors cursor-pointer"
                      onClick={() => router.push(`/filtered-farmers?type=cluster&value=${encodeURIComponent(cluster.clusterId)}&label=${encodeURIComponent(cluster.clusterTitle)}`)}
                    >
                      <div className="flex w-full flex-col text-center items-center justify-between mb-3">
                        <div className="flex-1 flex w-full flex-col items-center justify-center">
                          <div className="flex flex-col items-center text-center mb-1">
                             <BuildingOfficeIcon className="h-16 w-16 pt-5 stroke-slate-800" />
                            <h4 className="text-lg max-w-[300px] font-bold px-3 text-gray-900 line-clamp-2">
                              {cluster.clusterTitle}
                            </h4>
                          </div>
                          <p className="text-lg text-gray-800 font-semibold  line-clamp-1 mb-2">
                            {cluster.clusterDescription}
                          </p>
                         <div className=' flex py-4 bg-white p-2 rounded-lg items-center justify-between w-full'>
                          
                           {cluster.clusterLeadName && (
                           <div className='text-start'>
                            <p className="text-xs font-semibold font-sans text-gray-800">Cluster Lead:</p>
                             <p className="text-md font-semibold font-sans text-gray-700">
                              {cluster.clusterLeadName}
                            </p>
                           </div>
                          )}

                           <div className=" text-end text-gray-900">
                            <p className=' text-xl font-semibold '>{formatNumber(cluster.farmersCount)}</p>
                          <div className="text-xs text-gray-700">Farmers Registered</div>
                          </div>

                         </div>

                          
                        </div>
                        <div className=" text-center ml-4 bg-whte">
                         
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Performance</span>
                          <span>{cluster.progressPercentage}% of total</span>
                        </div>
                        <div className="w-full bg-stone-400 rounded-full h-1">
                          <div 
                            className="bg-stone-900 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {clusters.byClusters.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BuildingOfficeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No clusters found</p>
                  <p className="text-sm">Please assign farmers to clusters</p>
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
