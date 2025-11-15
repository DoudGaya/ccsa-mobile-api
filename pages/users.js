import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Layout from '../components/Layout'
import { usePermissions, PermissionGate, PERMISSIONS } from '../components/PermissionProvider'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  KeyIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

// Permission categories for the permissions tab
const PERMISSION_CATEGORIES = [
  { id: 'users.create', name: 'Create Users', category: 'Users' },
  { id: 'users.read', name: 'View Users', category: 'Users' },
  { id: 'users.update', name: 'Update Users', category: 'Users' },
  { id: 'users.delete', name: 'Delete Users', category: 'Users' },
  { id: 'agents.create', name: 'Create Agents', category: 'Agents' },
  { id: 'agents.read', name: 'View Agents', category: 'Agents' },
  { id: 'agents.update', name: 'Update Agents', category: 'Agents' },
  { id: 'agents.delete', name: 'Delete Agents', category: 'Agents' },
  { id: 'farmers.create', name: 'Create Farmers', category: 'Farmers' },
  { id: 'farmers.read', name: 'View Farmers', category: 'Farmers' },
  { id: 'farmers.update', name: 'Update Farmers', category: 'Farmers' },
  { id: 'farmers.delete', name: 'Delete Farmers', category: 'Farmers' },
  { id: 'clusters.create', name: 'Create Clusters', category: 'Clusters' },
  { id: 'clusters.read', name: 'View Clusters', category: 'Clusters' },
  { id: 'clusters.update', name: 'Update Clusters', category: 'Clusters' },
  { id: 'clusters.delete', name: 'Delete Clusters', category: 'Clusters' },
  { id: 'analytics.read', name: 'View Analytics', category: 'Analytics' },
  { id: 'settings.update', name: 'Update Settings', category: 'Settings' },
]

export default function Users() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('user') // 'user', 'role'
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Password generation utility
  const generateRandomPassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword()
    setUserForm({ ...userForm, password: newPassword })
  }

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '', // Role ID that will be selected
    permissions: [],
    isActive: true,
    passwordOption: 'generate', // 'generate' or 'manual'
    password: '',
    generatePassword: true,
    sendPasswordEmail: true
  })

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [],
    isActive: true
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
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        // Handle the new roles API response structure
        const allRoles = [
          ...(rolesData.systemRoles || []),
          ...(rolesData.customRoles || [])
        ]
        setRoles(allRoles)
      }
    } catch (error) {
      setError('Failed to fetch data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      // Determine if this is create or update based on editingItem
      const isUpdate = !!editingItem && editingItem.id
      
      let url = '/api/users'
      let method = 'POST'
      let body = userForm
      
      if (isUpdate) {
        // For updates, use PUT with the user ID
        url = `/api/users/${editingItem.id}`
        method = 'PUT'
        // Only send fields that are being updated
        body = {
          displayName: userForm.name,
          firstName: userForm.firstName || '',
          lastName: userForm.lastName || '',
          email: userForm.email,
          role: userForm.role, // Role ID for RBAC
          isActive: userForm.isActive
        }
        // Only include password if it was changed (not empty and not the form's initial state)
        if (userForm.password && userForm.password !== editingItem.password) {
          body.password = userForm.password
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchData()
        resetUserForm()
        setShowModal(false)
        setEditingItem(null)
        setError('')
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || (isUpdate ? 'Failed to update user' : 'Failed to create user')
        setError(errorMessage)
        console.error(`Error ${isUpdate ? 'updating' : 'creating'} user:`, errorData)
      }
    } catch (error) {
      const errorMessage = error.message || (editingItem ? 'An error occurred while updating the user' : 'An error occurred while creating the user')
      setError(errorMessage)
      console.error('Error:', error)
    }
  }

  const handleCreateRole = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      })

      if (response.ok) {
        await fetchData()
        resetRoleForm()
        setShowModal(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create role')
      }
    } catch (error) {
      setError('An error occurred while creating the role')
    }
  }

  const handleDelete = async (type, id) => {
    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteConfirm(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to delete ${type}`)
      }
    } catch (error) {
      setError(`An error occurred while deleting the ${type}`)
    }
  }

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      role: '',
      permissions: [],
      isActive: true,
      passwordOption: 'generate',
      password: '',
      generatePassword: true,
      sendPasswordEmail: true
    })
    setEditingItem(null)
  }

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    })
    setEditingItem(null)
  }

  const openCreateModal = (type) => {
    setModalType(type)
    if (type === 'user') {
      const newPassword = generateRandomPassword()
      setUserForm({
        name: '',
        email: '',
        role: '',
        permissions: [],
        isActive: true,
        passwordOption: 'generate',
        password: newPassword,
        generatePassword: true,
        sendPasswordEmail: true
      })
    }
    if (type === 'role') resetRoleForm()
    setShowModal(true)
  }

  const openEditModal = (type, item) => {
    setModalType(type)
    setEditingItem(item)
    if (type === 'user') {
      // Get the role ID from the user's roles array (first assigned role)
      const assignedRoleId = item.roles && item.roles.length > 0 ? item.roles[0].id : ''
      
      setUserForm({
        name: item.name || '',
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
        role: assignedRoleId, // Use the actual role ID from the user's assigned roles
        groupIds: item.groups?.map(g => g.id) || [],
        permissions: item.permissions || [],
        isActive: item.isActive !== false,
        password: '', // Don't pre-fill password for security
        passwordOption: 'manual', // Default to manual for updates (user can leave empty to keep current)
        generatePassword: false,
        sendPasswordEmail: false
      })
    } else if (type === 'role') {
      setRoleForm({
        name: item.name || '',
        description: item.description || '',
        permissions: item.permissions || [],
        isActive: item.isActive !== false
      })
    }
    setShowModal(true)
  }

  // Filter data
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !selectedRole || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Layout title="Users & Permissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Users & Permissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users & Permissions</h1>
            <p className="text-gray-600 mt-1">Manage users, roles and permissions</p>
          </div>
          <div className="flex space-x-3">
            <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
              <button
                onClick={() => openCreateModal('role')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Create Role
              </button>
              <button
                onClick={() => openCreateModal('user')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create User
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{users.length}</h3>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {users.filter(u => u.isActive !== false).length}
                </h3>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <AdjustmentsHorizontalIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{roles.length}</h3>
                <p className="text-sm text-gray-500">User Roles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <KeyIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{roles.filter(r => r.isSystem).length || roles.length}</h3>
                <p className="text-sm text-gray-500">System Roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'users', name: 'Users', icon: UserGroupIcon },
                { id: 'roles', name: 'Roles', icon: ShieldCheckIcon },
                { id: 'permissions', name: 'Permissions', icon: KeyIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {activeTab === 'users' && (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <span key={role.id} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {role.name}
                                  {role.isSystem && ' (System)'}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                {user.role || 'No Role'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.permissions?.length || 0} permissions
                            {user.permissions && user.permissions.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user.permissions.slice(0, 3).join(', ')}
                                {user.permissions.length > 3 && ` +${user.permissions.length - 3} more`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <PermissionGate permission={PERMISSIONS.USERS_UPDATE}>
                              <button
                                onClick={() => openEditModal('user', user)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'users', id: user.id })}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Roles Management</h3>
                  <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
                    <button
                      onClick={() => openCreateModal('role')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Create Role</span>
                    </button>
                  </PermissionGate>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRoles.map((role) => (
                    <div key={role.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-500">{role.description}</p>
                          {role.isSystem && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                              System Role
                            </span>
                          )}
                        </div>
                        {!role.isSystem && (
                          <PermissionGate permission={PERMISSIONS.USERS_UPDATE}>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal('role', role)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'roles', id: role.id })}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                            </div>
                          </PermissionGate>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Permissions:</span> {role.permissions?.length || 0}
                        </div>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Sample permissions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.permissions.slice(0, 3).map((perm) => (
                                <span key={perm} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {perm}
                                </span>
                              ))}
                              {role.permissions.length > 3 && (
                                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  +{role.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {!role.isSystem && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            role.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {role.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                {Object.entries(
                  PERMISSION_CATEGORIES.reduce((acc, perm) => {
                    if (!acc[perm.category]) acc[perm.category] = []
                    acc[perm.category].push(perm)
                    return acc
                  }, {})
                ).map(([category, permissions]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center p-3 border border-gray-100 rounded-md">
                          <KeyIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{permission.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? `Edit ${modalType}` : `Create New ${modalType}`}
              </h3>
              
              {modalType === 'user' && (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      value={userForm.role || ''}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                          {role.isSystem && ' (System)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900">Password Settings</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password Option</label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="generate-password"
                            value="generate"
                            checked={userForm.passwordOption === 'generate'}
                            onChange={(e) => setUserForm({ 
                              ...userForm, 
                              passwordOption: e.target.value,
                              password: e.target.value === 'generate' ? generateRandomPassword() : ''
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="generate-password" className="ml-2 block text-sm text-gray-900">
                            Generate random password automatically
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="manual-password"
                            value="manual"
                            checked={userForm.passwordOption === 'manual'}
                            onChange={(e) => setUserForm({ 
                              ...userForm, 
                              passwordOption: e.target.value,
                              password: ''
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="manual-password" className="ml-2 block text-sm text-gray-900">
                            Set custom password
                          </label>
                        </div>
                      </div>
                    </div>

                    {userForm.passwordOption === 'generate' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Generated Password</label>
                        <div className="mt-1 flex">
                          <input
                            type="text"
                            value={userForm.password}
                            readOnly
                            className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 bg-gray-50 text-gray-900 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Regenerate
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          A secure 12-character password with letters, numbers, and special characters
                        </p>
                      </div>
                    )}

                    {userForm.passwordOption === 'manual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password *</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter secure password"
                          minLength="8"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be at least 8 characters long
                        </p>
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userForm.sendPasswordEmail}
                        onChange={(e) => setUserForm({ ...userForm, sendPasswordEmail: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Send login credentials to user via email
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              )}

              {modalType === 'role' && (
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {Object.entries(
                        PERMISSION_CATEGORIES.reduce((acc, perm) => {
                          if (!acc[perm.category]) acc[perm.category] = []
                          acc[perm.category].push(perm)
                          return acc
                        }, {})
                      ).map(([category, permissions]) => (
                        <div key={category} className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={roleForm.permissions.includes(permission.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRoleForm({
                                        ...roleForm,
                                        permissions: [...roleForm.permissions, permission.id]
                                      })
                                    } else {
                                      setRoleForm({
                                        ...roleForm,
                                        permissions: roleForm.permissions.filter(p => p !== permission.id)
                                      })
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">{permission.name}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={roleForm.isActive}
                      onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Confirm Delete</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this {deleteConfirm.type.slice(0, -1)}? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
