import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import homeBanner from '../../public/home-bannner.jpg'
import logo from '../../public/ccsa-logo.png'
import Head from 'next/head'
import Image from 'next/image'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
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
        <title>CCSA Admin - Sign In</title>
        <meta name="description" content="CCSA Admin Dashboard Sign In" />
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
              alt="Sign In Illustration"
              className=" h-24 object-contain mb-4"
            />
            <div className="mx-auto w-full flex items-center text-center rounded-lg justify-center">
              <span className=" text-ccsa-blue font-semibold text-3xl">Farmers Information Management System</span>
            </div>
            <h2 className=" text-center text-2xl">
              Centre for Climate Smart Agriculture
            </h2>
            <small className=' text-lg'>cosmopolitan University Abuja</small>
            {/* <p className="mt-2 text-center text- text-gray-600">
              Sign in to your administrator account
            </p> */}
          </div>
          <div className='bg-white py-8 px-4 max-w-sm mx-auto shadow sm:rounded-lg sm:px-10'>
             <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md flex flex-col space-y-5 shadow-sm ">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-ccsa-blue/80 focus:border-ccsa-blue/80 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-ccsa-blue/80 focus:border-ccsa-blue/80 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ccsa-blue hover:bg-ccsa-blue/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ccsa-blue/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="spinner px-4"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

          
          </form>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context)

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
