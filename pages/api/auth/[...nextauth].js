import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma, { withRetry } from '../../../lib/prisma'
import ProductionLogger from '../../../lib/productionLogger'
import { getUserPermissions } from '../../../lib/permissions'
import { logSSOAttempt } from '../../../lib/sso/ssoAuditLog'

export const authOptions = {
  providers: [
    // Google OAuth Provider (SSO)
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    })] : []),
    
    // Credentials Provider (Existing)
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
          const user = await withRetry(async () => {
            return await prisma.user.findUnique({
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
            });
          });

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
    // Custom signIn callback for SSO validation
    async signIn({ user, account, profile, email, credentials }) {
      // If using SSO provider (Google, Microsoft, etc.)
      if (account?.provider && account.provider !== 'credentials') {
        try {
          const ssoEmail = profile?.email || email
          
          // Query database for user (simplified - no nested includes to avoid Prisma errors)
          const dbUser = await prisma.user.findUnique({
            where: { email: ssoEmail }
          })
          
          // If user not found → DENY with clean error
          if (!dbUser) {
            try {
              await logSSOAttempt(ssoEmail, account.provider, 'user_not_found', 'User does not exist in system', {
                profile: { name: profile?.name, email: profile?.email }
              })
            } catch (logError) {
              ProductionLogger.error('Failed to log SSO attempt:', logError.message)
            }
            // Return false to deny login - NextAuth will redirect to error page
            return '/auth/signin?error=user_not_found'
          }
          
          // If SSO disabled for user → DENY with clean error
          if (!dbUser.isSSOEnabled) {
            try {
              await logSSOAttempt(ssoEmail, account.provider, 'sso_disabled', 'SSO not enabled for this user')
            } catch (logError) {
              ProductionLogger.error('Failed to log SSO attempt:', logError.message)
            }
            return '/auth/signin?error=sso_disabled'
          }
          
          // Update user SSO info in DB
          try {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                ssoProviderId: account.providerAccountId,
                ssoProvider: account.provider,
                ssoEmail: ssoEmail,
                lastSSOLogin: new Date(),
                lastLogin: new Date(),
              }
            })
          } catch (updateError) {
            ProductionLogger.error('Failed to update SSO info:', updateError.message)
            // Continue anyway - login is allowed
          }
          
          // Log success
          try {
            await logSSOAttempt(ssoEmail, account.provider, 'success')
          } catch (logError) {
            ProductionLogger.error('Failed to log SSO success:', logError.message)
          }
          
          // ALLOW login
          return true
        } catch (error) {
          // Strip ANSI codes from error message
          const cleanMessage = error.message.replace(/\x1B\[[0-9;]*[mG]/g, '')
          ProductionLogger.error('SSO signIn error:', cleanMessage)
          
          try {
            await logSSOAttempt(profile?.email, account?.provider, 'error', cleanMessage)
          } catch (logError) {
            ProductionLogger.error('Failed to log SSO error:', logError.message)
          }
          
          // Return error redirect instead of throwing
          return '/auth/signin?error=callback'
        }
      }
      
      // Allow credentials provider to continue
      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.roles = user.roles
        token.permissions = user.permissions
        token.ssoProvider = account?.provider || null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.roles = token.roles
        session.user.permissions = token.permissions
        session.user.ssoProvider = token.ssoProvider
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
