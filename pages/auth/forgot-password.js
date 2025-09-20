import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import homeBanner from '../../public/home-bannner.jpg'
import logo from '../../public/ccsa-logo.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email address.')
        setEmailSent(true)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>CCSA Admin - Forgot Password</title>
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
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-600">
                  We've sent password reset instructions to {email}
                </p>
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80"
                  >
                    Back to Sign In
                  </Link>
                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail('')
                    }}
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80"
                  >
                    Try another email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Forgot your password?</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-ccsa-blue/80 focus:border-ccsa-blue/80 sm:text-sm"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        'Send reset instructions'
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