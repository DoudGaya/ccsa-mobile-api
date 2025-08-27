import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { usePermissions, PERMISSIONS } from '../components/PermissionProvider'

export default function TestPermissions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { hasPermission, permissions, loading } = usePermissions()
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    console.log('Test Permissions - Session status:', status)
    console.log('Test Permissions - Session data:', session)
    console.log('Test Permissions - Permissions loading:', loading)
    console.log('Test Permissions - Permissions array:', permissions)
    console.log('Test Permissions - Has FARMERS_READ:', hasPermission(PERMISSIONS.FARMERS_READ))
    
    setDebugInfo({
      status,
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      permissions,
      loading,
      hasFarmersRead: hasPermission(PERMISSIONS.FARMERS_READ),
      farmersReadPermission: PERMISSIONS.FARMERS_READ
    })
  }, [session, status, permissions, loading, hasPermission])

  if (status === 'loading' || loading) {
    return (
      <Layout title="Test Permissions">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout title="Test Permissions">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">No Session</h1>
          <p>User is not authenticated</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Test Permissions">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Permission Test Page</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Session Status</h3>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User ID:</strong> {session?.user?.id || 'N/A'}</p>
            <p><strong>Email:</strong> {session?.user?.email || 'N/A'}</p>
            <p><strong>Role:</strong> {session?.user?.role || 'N/A'}</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Permission Status</h3>
            <p><strong>Permissions Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Total Permissions:</strong> {permissions.length}</p>
            <p><strong>Has FARMERS_READ:</strong> {hasPermission(PERMISSIONS.FARMERS_READ) ? 'Yes' : 'No'}</p>
            <p><strong>FARMERS_READ Value:</strong> {PERMISSIONS.FARMERS_READ}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">All Permissions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {permissions.map(permission => (
              <div key={permission} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                {permission}
              </div>
            ))}
          </div>
          {permissions.length === 0 && (
            <p className="text-gray-500">No permissions found</p>
          )}
        </div>

        <div className="mt-6 space-x-4">
          <button
            onClick={() => router.push('/farmers')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Farmers Page
          </button>
          <button
            onClick={() => router.push('/agents')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test Agents Page
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  )
}
