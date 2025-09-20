import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import logo from '../../public/ccsa-logo.png'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in. Please contact the administrator.'
      case 'Verification':
        return 'The sign in link is no longer valid. It may have expired.'
      case 'Default':
        return 'An error occurred during authentication. Please try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const getErrorTitle = (error) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access Denied'
      case 'Configuration':
        return 'Server Error'
      case 'Verification':
        return 'Link Expired'
      default:
        return 'Authentication Error'
    }
  }

  return (
    <>
      <Head>
        <title>CCSA Admin - Authentication Error</title>
        <meta name="description" content="Authentication error" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src={logo}
              alt="CCSA Logo"
              className="mx-auto h-24 w-auto object-contain mb-8"
            />
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {getErrorTitle(error)}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {getErrorMessage(error)}
            </p>
            
            {error === 'AccessDenied' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Only authorized email addresses can access this system. 
                  If you believe this is an error, please contact the system administrator.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80"
            >
              Try Again
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact support at{' '}
                <a href="mailto:support@cosmopolitan.edu.ng" className="text-ccsa-blue hover:text-ccsa-blue/80">
                  support@cosmopolitan.edu.ng
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}