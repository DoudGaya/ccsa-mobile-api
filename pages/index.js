import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth/signin')
    }
  }, [session, status, router])

  // Show loading while redirecting
  return (
    <>
      <Head>
        <title>CCSA Admin Dashboard</title>
        <meta name="description" content="CCSA Farmers Information Management System Admin Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-ccsa-blue mb-4">
            <span className="text-white font-bold text-2xl">🇳🇬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CCSA Admin Dashboard</h1>
          <p className="text-gray-600 mb-4">Farmers Information Management System</p>
          <div className="spinner mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
        </div>
      </div>
    </>
  )
}
