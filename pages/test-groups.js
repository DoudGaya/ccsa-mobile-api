import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestGroups() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState([])
  const [roles, setRoles] = useState({ systemRoles: [], customGroups: [] })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchGroups = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      
      if (response.ok) {
        setGroups(data)
        setSuccess(`Successfully fetched ${data.length} groups`)
      } else {
        setError(`Error: ${data.error || 'Failed to fetch groups'}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      
      if (response.ok) {
        setRoles(data)
        setSuccess(`Successfully fetched ${data.systemRoles.length} system roles and ${data.customGroups.length} custom groups`)
      } else {
        setError(`Error: ${data.error || 'Failed to fetch roles'}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data)
        setSuccess(`Successfully fetched ${data.length} users`)
      } else {
        setError(`Error: ${data.error || 'Failed to fetch users'}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestGroup = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Test Group ${Date.now()}`,
          description: 'A test group created from the test page',
          permissions: ['farmers.read', 'farmers.create', 'farms.read', 'farms.create'],
          isActive: true
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(`Group created successfully: ${data.name}`)
        fetchGroups() // Refresh the list
      } else {
        setError(`Error creating group: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestRole = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Field Officer ${Date.now()}`,
          description: 'Custom role for field officers with specific permissions',
          permissions: [
            'farmers.create', 'farmers.read', 'farmers.update',
            'farms.create', 'farms.read', 'farms.update',
            'certificates.create', 'certificates.read',
            'analytics.read'
          ],
          isActive: true
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(`Role created successfully: ${data.name}`)
        fetchRoles() // Refresh the list
      } else {
        setError(`Error creating role: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Groups & Roles API Test</h1>
        <p className="text-red-600">Please sign in to test the Groups & Roles API</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Groups & Roles API Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Info</h2>
        <p>User: {session.user?.email}</p>
        <p>Session ID: {session.user?.id}</p>
      </div>

      <div className="space-x-2 space-y-2 mb-6">
        <button
          onClick={fetchGroups}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Groups'}
        </button>

        <button
          onClick={fetchRoles}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Roles'}
        </button>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Users'}
        </button>

        <button
          onClick={createTestGroup}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Create Test Group'}
        </button>

        <button
          onClick={createTestRole}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Create Test Role'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Groups Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Custom Groups ({groups.length})</h2>
          {groups.length === 0 ? (
            <p className="text-gray-500">No groups found. Click "Fetch Groups" to load.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.id} className="border border-gray-300 rounded p-3 text-sm">
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-600">{group.description}</div>
                  <div className="text-xs text-gray-500">
                    ID: {group.id} | Active: {group.isActive ? 'Yes' : 'No'} | 
                    Users: {group.userGroups?.length || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Permissions: {Array.isArray(group.permissions) ? group.permissions.join(', ') : 'None'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roles Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">System Roles & Custom Groups</h2>
          
          {/* System Roles */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">System Roles ({roles.systemRoles.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {roles.systemRoles.map((role) => (
                <div key={role.id} className="border border-gray-300 rounded p-2 text-sm bg-gray-50">
                  <div className="font-medium text-blue-700">{role.name}</div>
                  <div className="text-xs text-gray-600">{role.description}</div>
                  <div className="text-xs text-purple-600 mt-1">
                    Permissions: {role.permissions.length} total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Groups as Roles */}
          <div>
            <h3 className="text-md font-medium mb-2">Custom Roles ({roles.customGroups.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {roles.customGroups.map((group) => (
                <div key={group.id} className="border border-gray-300 rounded p-2 text-sm">
                  <div className="font-medium">{group.name}</div>
                  <div className="text-xs text-gray-600">{group.description}</div>
                  <div className="text-xs text-green-600 mt-1">
                    Permissions: {Array.isArray(group.permissions) ? group.permissions.length : 0} assigned
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      {users.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Users ({users.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-300 rounded p-3 text-sm">
                <div className="font-medium">{user.displayName || `${user.firstName} ${user.lastName}`}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
                <div className="text-xs text-purple-600">Role: {user.role}</div>
                <div className="text-xs text-gray-500">
                  Active: {user.isActive ? 'Yes' : 'No'} | 
                  Verified: {user.isVerified ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
