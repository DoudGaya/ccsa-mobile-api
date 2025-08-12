import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import {
  UserPlusIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  CogIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function Settings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('admins')
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  // Form states
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    displayName: '',
    password: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }
    
    fetchAdmins()
  }, [session, status])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/admins')
      
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      } else {
        console.error('Failed to fetch admins')
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    try {
      const response = await fetch('/api/settings/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAdmin)
      })

      const data = await response.json()

      if (response.ok) {
        setFormSuccess('Admin created successfully!')
        setNewAdmin({ email: '', displayName: '', password: '' })
        setShowAddAdmin(false)
        fetchAdmins() // Refresh the list
      } else {
        setFormError(data.error || 'Failed to create admin')
      }
    } catch (error) {
      setFormError('Network error. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId) => {
    try {
      const response = await fetch(`/api/settings/admins/${adminId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFormSuccess('Admin deleted successfully!')
        fetchAdmins() // Refresh the list
      } else {
        const data = await response.json()
        setFormError(data.error || 'Failed to delete admin')
      }
    } catch (error) {
      setFormError('Network error. Please try again.')
    }
    setShowDeleteConfirm(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'admins', name: 'Admin Management', icon: UserGroupIcon },
    { id: 'system', name: 'System Settings', icon: CogIcon },
  ]

  if (status === 'loading' || loading) {
    return (
      <Layout title="Settings">
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Settings">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage system configuration, admin users, and application settings.
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {formSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-600">{formSuccess}</div>
          </div>
        )}
        
        {formError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600">{formError}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Admin Management Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Add Admin Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddAdmin(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Admin
              </button>
            </div>

            {/* Admins List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {admins.length === 0 ? (
                  <li className="px-6 py-8 text-center text-gray-500">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No admins found</p>
                  </li>
                ) : (
                  admins.map((admin) => (
                    <li key={admin.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {admin.displayName || admin.email}
                            </div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                            {admin.phone && (
                              <div className="text-sm text-gray-500">{admin.phone}</div>
                            )}
                            <div className="text-xs text-gray-400">
                              Created: {formatDate(admin.createdAt)} | 
                              Last login: {formatDate(admin.lastLogin)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {session.user.role === 'super_admin' && admin.id !== session.user.id && (
                            <button
                              onClick={() => setShowDeleteConfirm(admin.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete admin"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === 'system' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Database Status</h4>
                  <p className="text-sm text-gray-500">Current database connection status</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">NextAuth Configuration</h4>
                  <p className="text-sm text-gray-500">Authentication service status</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">NIN API Service</h4>
                  <p className="text-sm text-gray-500">National Identity verification service</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">SMS Service</h4>
                  <p className="text-sm text-gray-500">Twilio SMS verification service</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAddAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Admin</h3>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={newAdmin.displayName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAdmin(false)
                        setFormError('')
                        setNewAdmin({ email: '', name: '', password: '' })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {formLoading ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Admin</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Are you sure you want to delete this admin? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(showDeleteConfirm)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
