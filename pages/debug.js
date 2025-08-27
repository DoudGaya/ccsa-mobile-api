import { useSession } from 'next-auth/react'
import { usePermissions, PERMISSIONS } from '../components/PermissionProvider'
import Layout from '../components/Layout'

export default function Debug() {
  const { data: session, status } = useSession()
  const { hasPermission, permissions, role } = usePermissions()

  return (
    <Layout title="Debug Info">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Authentication Status:</h3>
            <p>Status: {status}</p>
            <p>Session: {session ? 'Authenticated' : 'Not authenticated'}</p>
            {session && (
              <div className="ml-4">
                <p>User ID: {session.user?.id}</p>
                <p>Email: {session.user?.email}</p>
                <p>Name: {session.user?.name}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Permissions:</h3>
            <p>Role: {role || 'No role'}</p>
            <p>Has FARMERS_READ: {hasPermission(PERMISSIONS.FARMERS_READ) ? 'Yes' : 'No'}</p>
            <p>Total permissions: {permissions ? permissions.length : 0}</p>
            {permissions && permissions.length > 0 && (
              <div className="ml-4">
                <p>All permissions:</p>
                <ul className="list-disc ml-4">
                  {permissions.map((perm, index) => (
                    <li key={index}>{perm}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Test Links:</h3>
            <div className="space-x-4">
              <a href="/farmers" className="text-blue-600 hover:underline">Farmers List</a>
              <a href="/certificates" className="text-blue-600 hover:underline">Certificates</a>
              <a href="/api/test" className="text-blue-600 hover:underline">API Test</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
