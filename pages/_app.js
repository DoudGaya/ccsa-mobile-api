import { SessionProvider } from 'next-auth/react'
import PermissionProvider from '../components/PermissionProvider'
import '../styles/globals.css'

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}) {
  return (
    <SessionProvider session={session}>
      <PermissionProvider>
        <Component {...pageProps} />
      </PermissionProvider>
    </SessionProvider>
  )
}
