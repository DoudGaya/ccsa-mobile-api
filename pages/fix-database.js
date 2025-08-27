import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Layout from '../components/Layout'

export default function FixDatabase() {
  const { data: session } = useSession()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [specificResult, setSpecificResult] = useState(null)
  const [specificLoading, setSpecificLoading] = useState(false)
  const [permissionResult, setPermissionResult] = useState(null)
  const [permissionLoading, setPermissionLoading] = useState(false)

  const assignFarmersToNacotan = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix/assign-nacotan', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const assignFarmersToSpecificCluster = async () => {
    setSpecificLoading(true)
    try {
      const response = await fetch('/api/fix/assign-nacotan-specific', {
        method: 'POST'
      })
      const data = await response.json()
      setSpecificResult(data)
    } catch (error) {
      setSpecificResult({ error: error.message })
    } finally {
      setSpecificLoading(false)
    }
  }

  const grantAdminPermissions = async () => {
    if (!session?.user?.id) {
      setPermissionResult({ error: 'No user session found' })
      return
    }

    setPermissionLoading(true)
    try {
      const response = await fetch('/api/fix/grant-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: session.user.id })
      })
      const data = await response.json()
      setPermissionResult(data)
      
      // Refresh page after successful permission grant
      if (data.success) {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setPermissionResult({ error: error.message })
    } finally {
      setPermissionLoading(false)
    }
  }

  return (
    <Layout title="Fix Database">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Database Fixes</h1>
        
        <div className="space-y-6">
          {/* Permission Fix */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Fix User Permissions</h2>
            <p className="text-gray-600 mb-4">
              This will grant admin permissions to your current user account to access all features including analytics and settings.
              Current user: {session?.user?.email || 'Not logged in'}
            </p>
            
            <button
              onClick={grantAdminPermissions}
              disabled={permissionLoading || !session?.user}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {permissionLoading ? 'Processing...' : 'Grant Admin Permissions'}
            </button>
            
            {permissionResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <pre className="text-sm">
                  {JSON.stringify(permissionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Original NACOTAN Assignment */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Assign Farmers to NACOTAN Cluster</h2>
            <p className="text-gray-600 mb-4">
              This will assign all farmers with null clusterId to the NACOTAN cluster.
            </p>
            
            <button
              onClick={assignFarmersToNacotan}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Assign Farmers to NACOTAN'}
            </button>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <pre className="text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Specific Cluster ID Assignment */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Assign ALL Farmers to cluster_nacotan_001</h2>
            <p className="text-gray-600 mb-4">
              This will assign ALL farmers to the specific cluster ID 'cluster_nacotan_001'. 
              This includes farmers who already have other cluster assignments.
            </p>
            
            <button
              onClick={assignFarmersToSpecificCluster}
              disabled={specificLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {specificLoading ? 'Processing...' : 'Assign ALL to cluster_nacotan_001'}
            </button>
            
            {specificResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <pre className="text-sm">
                  {JSON.stringify(specificResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
