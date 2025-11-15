

## SSO Login Implementation with Database User Validation

### **Goal**
Implement SSO (Google OAuth 2.0 or Microsoft Entra ID) for the CCSA admin dashboard while ensuring:
- Users must exist in the database before gaining access
- User roles, permissions, and scopes are synced from DB
- Session includes user data with permissions/roles
- Graceful fallback to credentials login
- Audit logging for SSO attempts

---

### **Phase 1: Database & Session Updates**

1. **Update User Model in Prisma** to include SSO identifiers:
   - Add `ssoProviderId` (string, nullable) — e.g., "google_123456789"
   - Add `ssoProvider` (string, nullable) — "google" or "microsoft"
   - Add `ssoEmail` (string, nullable) — email from SSO provider
   - Add `lastSSOLogin` (DateTime, nullable) — track SSO login history
   - Add `isSSOEnabled` (Boolean, default false) — flag to allow SSO for user

2. **Create SSO Audit Log Model** in Prisma:
   ```prisma
   model SSOAuditLog {
     id          String   @id @default(cuid())
     userId      String?  // null if user not found
     email       String
     provider    String   // "google" or "microsoft"
     status      String   // "success" | "user_not_found" | "sso_disabled" | "error"
     reason      String?  // why it failed
     metadata    Json?    // raw SSO response (sanitized)
     ipAddress   String?
     userAgent   String?
     createdAt   DateTime @default(now())
     @@map("sso_audit_logs")
   }
   ```

3. **Run Prisma Migration:**
   ```bash
   npx prisma migrate dev --name add_sso_support
   ```

---

### **Phase 2: NextAuth Configuration**

1. **Install OAuth Providers** (choose one or both):
   ```bash
   npm install @auth/core @auth/prisma-adapter
   ```

2. **Update `pages/api/auth/[...nextauth].js`** with:
   - Google OAuth provider (or Microsoft Entra)
   - Custom authorize callback to validate user exists in DB
   - Session callback to include roles/permissions/scopes
   - SignIn callback to:
     - Check if user exists in database
     - If not found → reject with "User not found" error
     - If found but `isSSOEnabled === false` → reject with "SSO not enabled"
     - If found and enabled → allow login
     - Log all attempts to SSOAuditLog
   - Callback to sync/update user data from SSO provider

3. **Provider Configuration Example (Google OAuth):**
   ```javascript
   // Add to NextAuth providers array
   GoogleProvider({
     clientId: process.env.GOOGLE_CLIENT_ID,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
     allowDangerousEmailAccountLinking: false,
   })
   ```

4. **Custom SignIn Callback** (pseudo-code):
   ```javascript
   async signIn({ user, account, profile }) {
     // 1. Extract email from SSO profile
     const ssoEmail = profile.email
     
     // 2. Query database for user
     const dbUser = await prisma.user.findUnique({
       where: { email: ssoEmail },
       include: { userRoles: { include: { role: true } } }
     })
     
     // 3. If user not found → DENY
     if (!dbUser) {
       await logSSOAttempt(ssoEmail, account.provider, 'user_not_found', 'User does not exist in system')
       throw new Error('User not found in system. Contact administrator.')
     }
     
     // 4. If SSO disabled for user → DENY
     if (!dbUser.isSSOEnabled) {
       await logSSOAttempt(ssoEmail, account.provider, 'sso_disabled', 'SSO not enabled for this user')
       throw new Error('SSO login is not enabled for your account.')
     }
     
     // 5. Update user SSO info in DB
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
     
     // 6. Log success
     await logSSOAttempt(ssoEmail, account.provider, 'success')
     
     // 7. ALLOW login
     return true
   }
   ```

5. **Session Callback** (include roles/permissions):
   ```javascript
   async session({ session, user }) {
     // Fetch user with roles and permissions
     const dbUser = await prisma.user.findUnique({
       where: { id: user.id },
       include: {
         userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
         userPermissions: { include: { permission: true } }
       }
     })
     
     // Merge role permissions + user permissions
     const rolePermissions = dbUser.userRoles.flatMap(ur => 
       ur.role.rolePermissions.map(rp => rp.permission.name)
     )
     const userPermissions = dbUser.userPermissions.map(up => up.permission.name)
     const allPermissions = [...new Set([...rolePermissions, ...userPermissions])]
     
     // Get user scopes
     const scopes = await getEffectiveScopes(user.id)
     
     // Attach to session
     session.user.id = user.id
     session.user.permissions = allPermissions
     session.user.scopes = scopes
     session.user.ssoProvider = dbUser.ssoProvider
     
     return session
   }
   ```

---

### **Phase 3: Environment Variables**

Add to `.env.local`:
```bash
# Google OAuth (if using Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Or Microsoft Entra ID
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_tenant_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000 (or production URL)
NEXTAUTH_SECRET=your_random_secret_key
```

---

### **Phase 4: Login UI Updates**

1. **Update `ccsa-mobile-api/pages/auth/signin.js`** to include:
   - Existing credentials form (email/password)
   - SSO provider button (Google / Microsoft)
   - Error handling for "User not found" from SSO
   - Fallback message if SSO is unavailable

2. **Example SSO Button:**
   ```javascript
   import { signIn } from 'next-auth/react'
   
   <button
     onClick={() => signIn('google', { redirect: false })}
     className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
   >
     <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
       {/* Google logo SVG */}
     </svg>
     Sign in with Google
   </button>
   ```

3. **Handle SSO Errors** in redirect:
   ```javascript
   useEffect(() => {
     if (router.query.error === 'user_not_found') {
       setError('Your email is not registered. Contact the administrator.')
     } else if (router.query.error === 'sso_disabled') {
       setError('SSO is not enabled for your account. Use credentials instead.')
     }
   }, [router.query.error])
   ```

---

### **Phase 5: Admin User Management**

1. **Create API endpoint** `pages/api/users/[id]/enable-sso.js`:
   - Allow admins to enable/disable SSO for users
   - Update `isSSOEnabled` flag in DB
   - Audit log the change

2. **Update Users Admin Page** `pages/users.js`:
   - Add toggle switch: "Allow SSO Login"
   - Show `ssoProvider` and `lastSSOLogin` in user row
   - Show audit log of SSO attempts

3. **Bulk Enable SSO** script for all users:
   ```bash
   node scripts/enable-sso-for-all-users.js
   ```

---

### **Phase 6: Logging & Monitoring**

1. **Create `logSSOAttempt()` function** in `lib/sso/ssoAuditLog.js`:
   - Log to SSOAuditLog table
   - Include: email, provider, status, reason, IP, user agent
   - Keep for audit trail and security

2. **Create SSO Audit Log Viewer** page:
   - Admin dashboard page to view SSO login attempts
   - Filter by provider, status, date range
   - Alert on repeated failed attempts (possible attack)

---

### **Phase 7: Testing & Validation**

1. **Test Cases:**
   - [ ] User exists in DB + SSO enabled → Login succeeds
   - [ ] User exists in DB + SSO disabled → Shows "SSO not enabled"
   - [ ] User NOT in DB → Shows "User not found"
   - [ ] Invalid SSO credentials → Shows provider error
   - [ ] Fallback to credentials login still works
   - [ ] Session includes permissions/roles
   - [ ] SSOAuditLog records all attempts

2. **Local Testing:**
   ```bash
   # Create test user with SSO enabled
   node scripts/create-test-sso-user.js
   
   # Start dev server
   npm run dev
   
   # Navigate to http://localhost:3000/auth/signin
   # Click SSO button and verify login flow
   ```

3. **Staging Deployment:**
   - Deploy to staging with test Google OAuth app
   - Test full flow end-to-end
   - Verify database audit logs

---

### **Phase 8: Production Rollout**

1. **Production OAuth Setup:**
   - Register production URLs in Google Console
   - Set `NEXTAUTH_URL` to production domain
   - Rotate `NEXTAUTH_SECRET` for production

2. **User Enablement:**
   - Decide: Enable SSO by default for all users or opt-in
   - Communicate to users about new SSO option
   - Provide support for SSO issues

3. **Monitoring:**
   - Monitor SSOAuditLog for errors
   - Set up alerts for repeated failed login attempts
   - Track adoption rates

---

### **Phase 9: Security Hardening**

1. **Rate Limiting** on SSO callback:
   - Prevent brute force attacks
   - Limit to 5 attempts per email per 15 minutes

2. **CSRF Protection:**
   - NextAuth handles this by default
   - Verify `state` parameter is validated

3. **Email Verification:**
   - Optionally require email verification before SSO access
   - Add `emailVerified` check

4. **Logout Redirect:**
   - Ensure proper logout from both app and SSO provider
   - Update `signOut` callback

---

### **Deliverables Checklist**

- [ ] Prisma schema updated with SSO fields + SSOAuditLog
- [ ] Database migration run
- [ ] NextAuth config updated with SSO providers
- [ ] Custom signIn callback with DB validation
- [ ] Session callback with permissions/roles/scopes
- [ ] Environment variables set
- [ ] Login UI updated with SSO buttons
- [ ] Error handling for "User not found"
- [ ] Admin API to enable/disable SSO per user
- [ ] Users admin page shows SSO status
- [ ] SSO audit log page (view attempts)
- [ ] Test script for local testing
- [ ] Documentation for users
- [ ] Production OAuth app registered
- [ ] Monitoring and alerts configured

---

### **Implementation Order (Recommended)**

1. Update Prisma schema + migrate
2. Update NextAuth config
3. Add SSO button to login UI
4. Test with one SSO provider
5. Add SSOAuditLog viewer
6. Add admin controls (enable/disable SSO)
7. Deploy to staging
8. Staging testing & fixes
9. Production deployment

---

### **Fallback Plan**

If SSO fails in production:
1. Users can still use credentials login
2. Disable SSO provider and use credentials-only mode:
   ```javascript
   // Comment out SSO providers temporarily
   // providers: [
   //   GoogleProvider({ ... })
   // ]
   ```
3. Revert to previous NextAuth config
4. Investigate root cause and re-enable once fixed

This prompt is ready to hand to an engineer or AI agent for implementation!
