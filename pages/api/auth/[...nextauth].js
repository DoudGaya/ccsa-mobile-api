import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '../../../lib/prisma'
import ProductionLogger from '../../../lib/productionLogger'
import { getUserPermissions } from '../../../lib/permissions'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // SSO Email Whitelist - Only allow specific emails
        const allowedEmails = [
          'ccsa@cosmopolitan.edu.ng',
          'admin@cosmopolitan.edu.ng', 
          'rislan@cosmopolitan.edu.ng'
        ]

        if (!allowedEmails.includes(credentials.email.toLowerCase())) {
          ProductionLogger.warn(`Unauthorized login attempt from: ${credentials.email}`)
          throw new Error('This email is not authorized to access the system. Please contact the administrator.')
        }

        try {
          // Find user in database with roles and permissions
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      permissions: true,
                      isSystem: true
                    }
                  }
                }
              }
            }
          })

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          // Get user permissions from roles
          const permissions = await getUserPermissions(user.id)

          // Return user object (this will be stored in JWT)
          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.email,
            role: user.role, // Keep simple role for backwards compatibility
            roles: user.userRoles.map(ur => ({
              id: ur.role.id,
              name: ur.role.name,
              permissions: ur.role.permissions
            })),
            permissions: permissions,
          }
        } catch (error) {
          ProductionLogger.error('Auth error:', error.message);
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.roles = user.roles
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.roles = token.roles
        session.user.permissions = token.permissions
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure proper URL configuration for production
  url: process.env.NEXTAUTH_URL,
  // Add debug logging for production issues
  debug: process.env.NODE_ENV === 'development',
  // Configure for Vercel deployment
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}

export default NextAuth(authOptions)
