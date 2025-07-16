import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import {
  ChartBarIcon,
  UsersIcon,
  MapIcon,
  CalendarIcon,
  TrendingUpIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

// Colors for charts
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Hide labels for very small slices

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Analytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [farms, setFarms] = useState([])
  const [analytics, setAnalytics] = useState({
    ageDistribution: [],
    landSizeDistribution: [],
    cropDistribution: [],
    stateDistribution: [],
    lgaDistribution: [],
    wardDistribution: [],
    pollingUnitDistribution: [],
    registrationTrends: [],
    farmingExperience: [],
    terrainDistribution: [],
    irrigationDistribution: [],
    ownershipDistribution: []
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard data
      const dashboardResponse = await fetch('/api/dashboard/stats')
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        setDashboardData(dashboardData)
      } else {
        // Mock dashboard data when API fails
        setDashboardData({
          totalFarmers: 0,
          totalAgents: 0,
          farmersThisMonth: 0
        })
      }

      // Fetch farmers
      const farmersResponse = await fetch('/api/farmers')
      if (farmersResponse.ok) {
        const farmersData = await farmersResponse.json()
        setFarmers(farmersData.farmers || [])
      } else {
        // Mock farmer data when API fails
        setFarmers([
          {
            id: 1,
            dateOfBirth: '1980-01-01',
            state: 'Lagos',
            localGovernment: 'Ikeja',
            ward: 'Ward 1',
            pollingUnit: 'PU 001',
            createdAt: '2024-01-01'
          },
          {
            id: 2,
            dateOfBirth: '1975-05-15',
            state: 'Ogun',
            localGovernment: 'Abeokuta North',
            ward: 'Ward 2',
            pollingUnit: 'PU 002',
            createdAt: '2024-02-01'
          },
          {
            id: 3,
            dateOfBirth: '1990-08-20',
            state: 'Lagos',
            localGovernment: 'Surulere',
            ward: 'Ward 3',
            pollingUnit: 'PU 003',
            createdAt: '2024-03-01'
          }
        ])
      }

      // Fetch farms
      const farmsResponse = await fetch('/api/farms')
      if (farmsResponse.ok) {
        const farmsData = await farmsResponse.json()
        setFarms(farmsData.farms || [])
      } else {
        // Mock farm data when API fails
        setFarms([
          {
            id: 1,
            farmSize: '2.5',
            primaryCrop: 'Maize',
            farmingExperience: '5',
            farmTerrain: 'Upland',
            irrigationMethod: 'Rain-fed',
            ownershipType: 'Owned'
          },
          {
            id: 2,
            farmSize: '1.0',
            primaryCrop: 'Rice',
            farmingExperience: '10',
            farmTerrain: 'Lowland',
            irrigationMethod: 'Irrigated',
            ownershipType: 'Rented'
          },
          {
            id: 3,
            farmSize: '3.0',
            primaryCrop: 'Cassava',
            farmingExperience: '15',
            farmTerrain: 'Mixed',
            irrigationMethod: 'Mixed',
            ownershipType: 'Family Land'
          }
        ])
      }

      // Fetch analytics if available
      const analyticsResponse = await fetch('/api/analytics')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        // Note: The current analytics API returns agent-specific data
        // We'll calculate our own analytics from the fetched data
      }

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err.message)
      
      // Set mock data even on error
      setDashboardData({
        totalFarmers: 0,
        totalAgents: 0,
        farmersThisMonth: 0
      })
      setFarmers([])
      setFarms([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate analytics from fetched data
  useEffect(() => {
    if (farmers.length > 0) {
      calculateAnalytics()
    }
  }, [farmers, farms])

  const calculateAnalytics = () => {
    // Age Distribution
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    }

    farmers.forEach(farmer => {
      if (farmer.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(farmer.dateOfBirth).getFullYear()
        if (age >= 18 && age <= 25) ageGroups['18-25']++
        else if (age >= 26 && age <= 35) ageGroups['26-35']++
        else if (age >= 36 && age <= 45) ageGroups['36-45']++
        else if (age >= 46 && age <= 55) ageGroups['46-55']++
        else if (age >= 56 && age <= 65) ageGroups['56-65']++
        else if (age > 65) ageGroups['65+']++
      }
    })

    const ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
      percentage: farmers.length > 0 ? ((count / farmers.length) * 100).toFixed(1) : 0
    }))

    // Land Size Distribution (from farms)
    const landSizeGroups = {
      '< 1 ha': 0,
      '1-5 ha': 0,
      '5-10 ha': 0,
      '10-20 ha': 0,
      '20+ ha': 0
    }

    farms.forEach(farm => {
      const size = parseFloat(farm.farmSize) || 0
      if (size < 1) landSizeGroups['< 1 ha']++
      else if (size >= 1 && size < 5) landSizeGroups['1-5 ha']++
      else if (size >= 5 && size < 10) landSizeGroups['5-10 ha']++
      else if (size >= 10 && size < 20) landSizeGroups['10-20 ha']++
      else if (size >= 20) landSizeGroups['20+ ha']++
    })

    const landSizeDistribution = Object.entries(landSizeGroups).map(([range, count]) => ({
      range,
      count,
      percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
    }))

    // Crop Distribution
    const cropCounts = {}
    farms.forEach(farm => {
      if (farm.primaryCrop) {
        cropCounts[farm.primaryCrop] = (cropCounts[farm.primaryCrop] || 0) + 1
      }
    })

    const cropDistribution = Object.entries(cropCounts)
      .map(([crop, count]) => ({
        crop,
        count,
        percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Geographic Distribution
    const stateCounts = {}
    const lgaCounts = {}
    const wardCounts = {}
    const pollingUnitCounts = {}

    farmers.forEach(farmer => {
      if (farmer.state) {
        stateCounts[farmer.state] = (stateCounts[farmer.state] || 0) + 1
      }
      if (farmer.localGovernment) {
        lgaCounts[farmer.localGovernment] = (lgaCounts[farmer.localGovernment] || 0) + 1
      }
      if (farmer.ward) {
        wardCounts[farmer.ward] = (wardCounts[farmer.ward] || 0) + 1
      }
      if (farmer.pollingUnit) {
        pollingUnitCounts[farmer.pollingUnit] = (pollingUnitCounts[farmer.pollingUnit] || 0) + 1
      }
    })

    const stateDistribution = Object.entries(stateCounts)
      .map(([state, count]) => ({
        name: state,
        count,
        percentage: farmers.length > 0 ? ((count / farmers.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const lgaDistribution = Object.entries(lgaCounts)
      .map(([lga, count]) => ({
        name: lga,
        count,
        percentage: farmers.length > 0 ? ((count / farmers.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const wardDistribution = Object.entries(wardCounts)
      .map(([ward, count]) => ({
        name: ward,
        count,
        percentage: farmers.length > 0 ? ((count / farmers.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const pollingUnitDistribution = Object.entries(pollingUnitCounts)
      .map(([unit, count]) => ({
        name: unit,
        count,
        percentage: farmers.length > 0 ? ((count / farmers.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Registration Trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRegistrations = {}
    farmers.forEach(farmer => {
      if (farmer.createdAt) {
        const date = new Date(farmer.createdAt)
        if (date >= sixMonthsAgo) {
          const monthKey = date.toISOString().substring(0, 7) // YYYY-MM
          monthlyRegistrations[monthKey] = (monthlyRegistrations[monthKey] || 0) + 1
        }
      }
    })

    const registrationTrends = Object.entries(monthlyRegistrations)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Farming Experience Distribution
    const experienceGroups = {
      'New (< 1 year)': 0,
      'Beginner (1-3 years)': 0,
      'Intermediate (3-10 years)': 0,
      'Experienced (10-20 years)': 0,
      'Expert (20+ years)': 0
    }

    farms.forEach(farm => {
      const experience = parseInt(farm.farmingExperience) || 0
      if (experience < 1) experienceGroups['New (< 1 year)']++
      else if (experience >= 1 && experience < 3) experienceGroups['Beginner (1-3 years)']++
      else if (experience >= 3 && experience < 10) experienceGroups['Intermediate (3-10 years)']++
      else if (experience >= 10 && experience < 20) experienceGroups['Experienced (10-20 years)']++
      else if (experience >= 20) experienceGroups['Expert (20+ years)']++
    })

    const farmingExperience = Object.entries(experienceGroups).map(([level, count]) => ({
      level,
      count,
      percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
    }))

    // Terrain Distribution (Upland vs Lowland)
    const terrainGroups = {
      'Upland': 0,
      'Lowland': 0,
      'Mixed': 0,
      'Unknown': 0
    }

    farms.forEach(farm => {
      const terrain = farm.farmTerrain || farm.terrain || 'Unknown'
      if (terrain.toLowerCase().includes('upland')) {
        terrainGroups['Upland']++
      } else if (terrain.toLowerCase().includes('lowland')) {
        terrainGroups['Lowland']++
      } else if (terrain.toLowerCase().includes('mixed')) {
        terrainGroups['Mixed']++
      } else {
        terrainGroups['Unknown']++
      }
    })

    const terrainDistribution = Object.entries(terrainGroups).map(([terrain, count]) => ({
      terrain,
      count,
      percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
    }))

    // Irrigation Distribution
    const irrigationGroups = {
      'Rain-fed': 0,
      'Irrigated': 0,
      'Mixed': 0,
      'Unknown': 0
    }

    farms.forEach(farm => {
      const irrigation = farm.irrigationMethod || farm.waterSource || 'Unknown'
      if (irrigation.toLowerCase().includes('rain') || irrigation.toLowerCase().includes('rainfed')) {
        irrigationGroups['Rain-fed']++
      } else if (irrigation.toLowerCase().includes('irrigat') || irrigation.toLowerCase().includes('pump') || irrigation.toLowerCase().includes('well') || irrigation.toLowerCase().includes('borehole')) {
        irrigationGroups['Irrigated']++
      } else if (irrigation.toLowerCase().includes('mixed') || irrigation.toLowerCase().includes('both')) {
        irrigationGroups['Mixed']++
      } else {
        irrigationGroups['Unknown']++
      }
    })

    const irrigationDistribution = Object.entries(irrigationGroups).map(([method, count]) => ({
      method,
      count,
      percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
    }))

    // Farm Ownership Distribution
    const ownershipGroups = {
      'Owned': 0,
      'Rented': 0,
      'Leased': 0,
      'Family Land': 0,
      'Other': 0
    }

    farms.forEach(farm => {
      const ownership = farm.ownershipType || farm.landOwnership || 'Other'
      if (ownership.toLowerCase().includes('own')) {
        ownershipGroups['Owned']++
      } else if (ownership.toLowerCase().includes('rent')) {
        ownershipGroups['Rented']++
      } else if (ownership.toLowerCase().includes('lease')) {
        ownershipGroups['Leased']++
      } else if (ownership.toLowerCase().includes('family') || ownership.toLowerCase().includes('inherit')) {
        ownershipGroups['Family Land']++
      } else {
        ownershipGroups['Other']++
      }
    })

    const ownershipDistribution = Object.entries(ownershipGroups).map(([type, count]) => ({
      type,
      count,
      percentage: farms.length > 0 ? ((count / farms.length) * 100).toFixed(1) : 0
    }))

    setAnalytics({
      ageDistribution,
      landSizeDistribution,
      cropDistribution,
      stateDistribution,
      lgaDistribution,
      wardDistribution,
      pollingUnitDistribution,
      registrationTrends,
      farmingExperience,
      terrainDistribution,
      irrigationDistribution,
      ownershipDistribution
    })
  }

  if (status === 'loading' || loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Analytics">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchData}
                className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Analytics Dashboard">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Comprehensive insights into farmer registrations, farm data, and agricultural trends.
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        {dashboardData && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Farmers</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.totalFarmers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Farms</dt>
                      <dd className="text-lg font-medium text-gray-900">{farms.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Agents</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.totalAgents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.farmersThisMonth}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Age Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Age Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="range"
                >
                  {analytics.ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Land Size Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Land Size Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.landSizeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Crops */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Crops</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.cropDistribution.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="crop" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Farming Experience */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Farming Experience</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.farmingExperience}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="level"
                >
                  {analytics.farmingExperience.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Top States */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top States</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.stateDistribution.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top LGAs */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Local Government Areas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.lgaDistribution.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Geographic Distribution */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Top Wards */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Wards</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.wardDistribution.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Polling Units */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Polling Units</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pollingUnitDistribution.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration Trends */}
        {analytics.registrationTrends.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Trends (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.registrationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Registrations']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Terrain Distribution */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Terrain Distribution (Upland vs Lowland)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.terrainDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="terrain"
              >
                {analytics.terrainDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Comprehensive Analytics Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Age Distribution vs Land Size */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Age Groups Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.ageDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={80} />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Experience Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Experience Levels</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.farmingExperience} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={120} />
                <Tooltip formatter={(value) => [value, 'Farmers']} />
                <Bar dataKey="count" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Crops Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Diversity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.cropDistribution.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="crop" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farms']} />
                <Bar dataKey="count" fill="#84CC16" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Farm Management Analytics */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Irrigation Methods */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Irrigation Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.irrigationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="method"
                >
                  {analytics.irrigationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Land Ownership */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Land Ownership Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.ownershipDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Farms']} />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{farmers.length}</div>
              <div className="text-sm text-gray-600">Total Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{farms.length}</div>
              <div className="text-sm text-gray-600">Total Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.stateDistribution.length}
              </div>
              <div className="text-sm text-gray-600">States Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.cropDistribution.length}
              </div>
              <div className="text-sm text-gray-600">Crop Varieties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {analytics.lgaDistribution.length}
              </div>
              <div className="text-sm text-gray-600">LGAs Covered</div>
            </div>
          </div>
          
          {/* Additional Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-teal-600">
                {analytics.terrainDistribution.reduce((sum, item) => sum + item.count, 0)}
              </div>
              <div className="text-xs text-gray-600">Terrain Mapped</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {analytics.irrigationDistribution.filter(item => item.method === 'Irrigated')[0]?.count || 0}
              </div>
              <div className="text-xs text-gray-600">Irrigated Farms</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-pink-600">
                {analytics.ownershipDistribution.filter(item => item.type === 'Owned')[0]?.count || 0}
              </div>
              <div className="text-xs text-gray-600">Owned Farms</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">
                {Math.round(farms.reduce((sum, farm) => sum + (parseFloat(farm.farmSize) || 0), 0))}
              </div>
              <div className="text-xs text-gray-600">Total Hectares</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
