import Head from 'next/head'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  MapIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  UserPlusIcon,
  GlobeAltIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Farmers', href: '/farmers', icon: UsersIcon },
  { name: 'Agents', href: '/agents', icon: UserGroupIcon },
  { name: 'Clusters', href: '/clusters', icon: BuildingOfficeIcon },
  { name: 'Farms', href: '/farms', icon: GlobeAltIcon },
  { name: 'Map View', href: '/map', icon: MapIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  // { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'GIS (Google)', href: '/gis-map-google', icon: MapIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Layout({ children, title = 'CCSA Dashboard' }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    setSidebarCollapsed(collapsed)
  },
   [])

  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    if (session?.user?.name) {
      return session.user.name
    }
    if (session?.user?.email) {
      return session.user.email.split('@')[0]
    }
    return 'User'
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content="CCSA Farmer Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            {/* Mobile navigation */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-green-700">CCSA</h1>
                  <p className="text-xs text-gray-500 -mt-1">Farmer Registry</p>
                </div>
              </div>
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-green-100 text-green-900 border-r-2 border-green-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-colors duration-200`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-4 h-6 w-6 flex-shrink-0`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            {/* Mobile user section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {getUserInitials()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-base font-medium text-gray-700 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center mt-1 transition-colors duration-200"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-1" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'md:w-20' : 'md:w-64'
      }`}>
        <div className="flex flex-col w-full">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200 shadow-sm">
            {/* Logo and collapse button */}
            <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
              <div className="flex items-center">
                {/* CCSA Logo */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-green-700">CCSA</h1>
                    <p className="text-xs text-gray-500 -mt-1">Farmer Registry</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-green-100 text-green-900 border-r-2 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      sidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                      } flex-shrink-0 h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <div className="p-4">
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {getUserInitials()}
                      </span>
                    </div>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email}
                      </p>
                      <button
                        onClick={handleSignOut}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center mt-1 transition-colors duration-200"
                      >
                        <ArrowLeftOnRectangleIcon className="h-3 w-3 mr-1" />
                        Sign out
                      </button>
                    </div>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-20 bottom-4 bg-gray-900 text-white p-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {getUserDisplayName()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="flex items-center h-full">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Search bar (hidden on mobile) */}
              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search farmers, agents..."
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
              </div>

              {/* Time and date display */}
              <div className="hidden lg:flex flex-col items-end text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200 relative">
                <BellIcon className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>

              {/* Help */}
              <Link
                href="/help"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </Link>

              {/* User profile dropdown area */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <div className="text-sm font-medium text-gray-900">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.role || 'Administrator'}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">
                    {getUserInitials()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}