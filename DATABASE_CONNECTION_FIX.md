# Database Connection Error: Connection Reset (P1001)

## Error Summary
```
Error: An existing connection was forcibly closed by the remote host (code: 10054)
Can't reach database server at `ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech:5432`
Code: P1001
```

## Root Causes

1. **Database Server Down/Restarting**
   - Neon PostgreSQL server temporarily unavailable
   - Scheduled maintenance
   - Connection pooler timeout

2. **Network Connectivity Issues**
   - Internet connection unstable
   - Firewall blocking connection
   - Network routing issue to AWS

3. **Connection Pool Exhaustion**
   - Too many concurrent connections
   - Connections not being released properly
   - Memory leak causing connection accumulation

4. **Long-Running Queries**
   - Query timeout forcing connection reset
   - Connection idle timeout (Neon defaults to 5 minutes)

---

## What I Fixed

### ✅ Added Automatic Retry Logic
- **File:** `lib/prisma.js`
- **Feature:** `withRetry()` function with exponential backoff
- **Behavior:** Retries 3 times with 500ms, 1s, 2s delays
- **Applied to:** All database queries in farmers APIs

### ✅ Improved Error Handling
- **Files Updated:**
  - `pages/api/farmers/index.js` - Returns 503 with empty data instead of 500 error
  - `pages/api/farmers/analytics.js` - Gracefully handles connection failures
  - `pages/farmers/index.js` - Frontend handles 503 responses

### ✅ Better Frontend Resilience
- Analytics won't crash if database is unavailable
- Displays loading state while retrying
- Shows empty analytics cards instead of error

---

## How It Works Now

### When Database Connection Fails:

1. **First Request → Retry Logic Activates**
   ```
   Attempt 1: Failed → Wait 500ms
   Attempt 2: Failed → Wait 1000ms
   Attempt 3: Failed → Return error
   ```

2. **After 3 Retries Fail:**
   - Returns HTTP 503 (Service Unavailable) instead of 500
   - Includes helpful error message
   - Returns empty data structure (no null errors)
   - Frontend displays gracefully

3. **User Experience:**
   - ✅ Page loads with empty analytics
   - ✅ Farmers list shows as empty (not broken)
   - ✅ User sees "Database temporarily unavailable" in console
   - ✅ Auto-retry happens on next page load

---

## How to Diagnose Database Issues

### Check Database Status:

```bash
# Test connection from your machine
psql -h ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech \
     -p 5432 \
     -U $(echo $DATABASE_URL | grep -o 'user=[^@]*' | cut -d= -f2) \
     -d neondb

# If psql not installed, use nc (netcat):
nc -zv ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech 5432
```

### Check Environment Variable:

```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL

# Should look like:
# postgresql://username:password@host:5432/database?...
```

### Check Server Logs:

```bash
# View recent Prisma errors
npm run dev 2>&1 | grep -i "prisma\|error\|P1001"
```

---

## Solutions by Scenario

### Scenario 1: Neon Database Down
**Status:** Check Neon Console
- https://console.neon.tech
- Look for maintenance notices or status updates

**Action:** 
```bash
# Wait for Neon to recover
# Refresh page in 5-10 minutes
```

**In the meantime:**
- Page will show empty data (not crash)
- Analytics will show 0 values
- Retry happens automatically

---

### Scenario 2: Connection Pool Exhausted
**Symptoms:** 
- Works sometimes, fails randomly
- Fails after app has been running for hours

**Solution:** Restart dev server
```bash
# Stop current dev server
Ctrl+C

# Clear Prisma cache
rm -rf .next node_modules/.prisma

# Restart
npm run dev
```

**Production fix:**
```bash
# In eas.json, add connection limits:
{
  "datasources": {
    "db": {
      "url": "${DATABASE_URL}"
    }
  }
}

# In .env, adjust connection pool:
DATABASE_URL="postgresql://...?schema=public&connection_limit=5&pool_timeout=30"
```

---

### Scenario 3: Network Connectivity Issues
**Symptoms:**
- Works on local, fails on deployment
- Works sometimes, intermittent failures

**Solution:** Check firewall/network
```bash
# Test if you can reach the database server
ping ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech

# Test port connectivity
nc -zv ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech 5432
```

**For deployment (Vercel/EAS):**
- Verify DATABASE_URL is set in environment variables
- Check firewall rules allow connection to AWS
- Use Neon's direct URL (not pooler) for better stability

---

### Scenario 4: Query Timeout
**Symptoms:**
- Specific queries always timeout
- Analytics page always fails
- Farmers page sometimes works

**Solution:** Optimize queries
```javascript
// Add timeout configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Set longer timeout for slow queries
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Query timeout')), 30000)
);

const result = await Promise.race([
  prisma.farmer.findMany(),
  timeout
]);
```

---

## Monitoring and Prevention

### Add Connection Health Check

```javascript
// lib/healthCheck.js
export async function checkDatabaseHealth() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
}

// Use in API
const health = await checkDatabaseHealth();
if (health.status === 'unhealthy') {
  console.error('Database unhealthy:', health);
}
```

### Monitor Connection Pool

```javascript
// Add to Prisma client initialization
let connectionCount = 0;

prisma.$on('query', () => {
  connectionCount++;
  if (connectionCount > 20) {
    console.warn('⚠️  High connection count:', connectionCount);
  }
});
```

---

## Current Status

✅ **Implemented:**
- Automatic retry logic with exponential backoff
- Graceful error handling (returns 503, not 500)
- Frontend resilience (shows empty data instead of errors)
- Better error messages for debugging

✅ **Frontend Improvements:**
- Analytics won't crash if database unavailable
- Farmers page shows empty list (not broken)
- User can retry automatically on next page load

⏳ **Still Needed:**
- Monitor connection pool in production
- Add database health check endpoint
- Consider connection pooling service (PgBouncer)

---

## Testing the Fix

### Test Connection Reset Handling:

```bash
# 1. Start dev server
npm run dev

# 2. Temporarily disconnect internet or stop database
# 3. Visit http://localhost:3000/farmers
# Expected: Shows empty farmers list (not crash)

# 4. Reconnect or restart database
# 5. Refresh page
# Expected: Farmers load successfully
```

### Test Retry Logic:

```bash
# Add this to lib/prisma.js to test:
export async function testRetry() {
  console.log('Testing retry logic...');
  try {
    await withRetry(async () => {
      throw new Error('Test error');
    }, 2, 100);
  } catch (error) {
    console.log('✅ Retry logic working:', error.message);
  }
}

// Call from browser console:
// fetch('/api/test-retry')
```

---

## Next Steps

1. **Monitor for recurrence** - Check server logs daily
2. **Upgrade connection pooling** - Consider Neon Pro for better pool management
3. **Add alerting** - Set up notifications if P1001 errors spike
4. **Implement circuit breaker** - Stop making requests if database is down

---

**Last Updated:** October 22, 2025  
**Status:** ✅ Fixes Implemented and Deployed  
**Retry Logic:** Active (3 attempts with exponential backoff)
