import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import homeBanner from '../../public/home-bannner.jpg'
import logo from '../../public/ccsa-logo.png'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [passwordReset, setPasswordReset] = useState(false)
  const router = useRouter()
  const { token } = router.query

  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setTokenValid(true)
      } else {
        setTokenValid(false)
        const data = await response.json()
        setError(data.error || 'Invalid or expired reset token')
      }
    } catch (error) {
      setTokenValid(false)
      setError('Failed to validate reset token')
    } finally {
      setValidatingToken(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Your password has been reset successfully.')
        setPasswordReset(true)
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <>
        <Head>
          <title>CCSA Admin - Reset Password</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-gray-600">Validating reset token...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>CCSA Admin - Reset Password</title>
        <meta name="description" content="Reset your CCSA Admin password" />
      </Head>
      
      <div className="min-h-screen grid grid-cols-2 items-center justify-center bg-gray-50">
        <div style={{
          backgroundImage: `url(${homeBanner.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} className="hidden bg-black/50 bg-blend-overlay h-screen lg:block">
         
        </div>
        <div className="max-w-xl mx-auto w-full space-y-8">
          <div className="text-center flex flex-col items-center justify-center space-y-2">
            <Image
              src={logo}
              alt="CCSA Logo"
              className="h-24 object-contain mb-4"
            />
            <div className="mx-auto w-full flex items-center text-center rounded-lg justify-center">
              <span className="text-ccsa-blue font-semibold text-3xl">Farmers Information Management System</span>
            </div>
            <h2 className="text-center text-2xl">
              Centre for Climate Smart Agriculture
            </h2>
            <small className="text-lg">cosmopolitan University Abuja</small>
          </div>
          
          <div className="bg-white py-8 px-4 max-w-sm mx-auto shadow sm:rounded-lg sm:px-10">
            {!tokenValid ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Invalid Reset Link</h3>
                <p className="text-sm text-gray-600">
                  This password reset link is invalid or has expired.
                </p>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Link
                  href="/auth/forgot-password"
                  className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80"
                >
                  Request New Reset Link
                </Link>
              </div>
            ) : passwordReset ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Password Reset Successfully</h3>
                <p className="text-sm text-gray-600">
                  Your password has been reset. You will be redirected to the sign-in page shortly.
                </p>
                <Link
                  href="/auth/signin"
                  className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80"
                >
                  Sign In Now
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Reset your password</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter your new password below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ccsa-blue/80 focus:border-ccsa-blue/80 sm:text-sm"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ccsa-blue/80 focus:border-ccsa-blue/80 sm:text-sm"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {message}
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="spinner px-4"></div>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/auth/signin"
                      className="text-sm text-ccsa-blue hover:text-ccsa-blue/80"
                    >
                      ← Back to Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}