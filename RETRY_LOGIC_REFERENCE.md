# Quick Reference: Retry Logic & Connection Handling

## 🚀 What Changed

### Problem
Database connection resets (P1001 error) were crashing the farmers page.

### Solution
- ✅ Automatic retry logic with exponential backoff
- ✅ Returns empty data instead of errors
- ✅ Frontend shows graceful empty states
- ✅ Users can retry with page refresh

---

## 📚 How to Use the Retry Function

### In API Routes

```javascript
import prisma, { withRetry } from '../../../lib/prisma';

// Example: Fetch data with automatic retries
const data = await withRetry(async () => {
  return await prisma.farmer.findMany({
    where: { status: 'Verified' }
  });
}, 3, 500); // 3 attempts, 500ms initial delay
```

### Parameters

```javascript
withRetry(
  fn,           // Function to retry
  maxRetries,   // Number of attempts (default: 3)
  delayMs       // Initial delay in milliseconds (default: 1000)
)
```

**Retry Schedule:**
- Attempt 1: Fail → Wait 500ms (delayMs × 2^0)
- Attempt 2: Fail → Wait 1000ms (delayMs × 2^1)
- Attempt 3: Fail → Wait 2000ms (delayMs × 2^2)
- All failed → Throw error

---

## 🔄 Error Handling Pattern

### Recommended Approach

```javascript
async function myEndpoint(req, res) {
  try {
    const result = await withRetry(async () => {
      // Your database query here
      return await prisma.table.findMany();
    }, 3, 500);

    return res.status(200).json({ data: result });

  } catch (error) {
    // Handle P1001 connection errors
    if (error.code === 'P1001') {
      return res.status(503).json({
        error: 'Database temporarily unavailable',
        data: [] // Return empty array, not null
      });
    }

    // Handle other errors
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## ✅ What Already Has Retry Logic

| File | Status |
|------|--------|
| `pages/api/farmers/index.js` | ✅ Applied |
| `pages/api/farmers/analytics.js` | ✅ Applied |
| `pages/api/farms/[farmId].js` | ⏳ TODO |
| `pages/api/clusters/index.js` | ⏳ TODO |
| All other APIs | ⏳ TODO |

---

## 🛠️ Adding Retry to New APIs

### Step 1: Import the function
```javascript
import prisma, { withRetry } from '../../../lib/prisma';
```

### Step 2: Wrap your queries
```javascript
// Before
const result = await prisma.user.findMany();

// After
const result = await withRetry(async () => {
  return await prisma.user.findMany();
}, 3, 500);
```

### Step 3: Add error handling
```javascript
if (error.code === 'P1001') {
  return res.status(503).json({ 
    error: 'Database unavailable',
    data: [] 
  });
}
```

---

## 🧪 Testing Connection Failures

### Simulate Connection Error

```javascript
// In lib/prisma.js, add this to test:
async function testConnectionReset() {
  try {
    await withRetry(async () => {
      throw new Error('Connection reset');
    }, 3, 100);
  } catch (error) {
    console.log('Retry exhausted:', error.message);
  }
}

// Call it:
// testConnectionReset()
```

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Stop your internet or Neon database

# 3. Refresh page
# Expected: Sees retry messages in console

# 4. Reconnect
# Expected: Page loads data on next refresh
```

---

## 📊 Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | Show data |
| 503 | ⚠️ Database down | Show empty state |
| 500 | ❌ Server error | Show error message |

### Frontend Handling

```javascript
const response = await fetch('/api/farmers');

if (response.status === 503) {
  // Database temporarily unavailable
  setData([]);
  console.warn('Database temporarily unavailable');
} else if (!response.ok) {
  // Other errors
  setError(response.status);
} else {
  // Success
  const data = await response.json();
  setData(data.farmers);
}
```

---

## 🚨 Debugging Connection Issues

### Check Logs

```bash
# View connection errors
npm run dev 2>&1 | grep "P1001\|Connection\|retry"

# Example output:
# [WARN] Database connection failed (attempt 1/3), retrying in 500ms...
# [WARN] Database connection failed (attempt 2/3), retrying in 1000ms...
# [INFO] Successfully connected after 2 retries
```

### Check Environment

```bash
# Verify database URL
echo $DATABASE_URL

# Test connection
nc -zv ep-withered-wind-ad4vodrm-pooler.c-2.us-east-1.aws.neon.tech 5432
```

### View Neon Status

- Dashboard: https://console.neon.tech
- Check for maintenance notices
- Monitor connection pool usage

---

## 📝 Error Messages You Might See

| Message | Cause | Fix |
|---------|-------|-----|
| "P1001: Can't reach database" | Connection timeout | Check database URL |
| "Connection reset by remote host" | Neon server dropped connection | Will auto-retry |
| "Pool timeout" | Too many connections | Restart dev server |
| "Query timeout" | Long-running query | Optimize query or increase timeout |

---

## 🎯 Best Practices

### ✅ DO

```javascript
// Wrap multiple queries together
const [users, farms] = await withRetry(async () => {
  return await Promise.all([
    prisma.user.findMany(),
    prisma.farm.findMany()
  ]);
});

// Return empty data on connection failure
return res.status(503).json({ users: [], farms: [] });

// Log retry attempts
console.warn(`Retry attempt ${attempt} of ${maxRetries}`);
```

### ❌ DON'T

```javascript
// Don't retry each query separately (slower)
const users = await withRetry(() => prisma.user.findMany());
const farms = await withRetry(() => prisma.farm.findMany());

// Don't return null (causes UI crashes)
return res.json({ farmers: null }); // BAD!

// Don't retry indefinitely (wastes resources)
await withRetry(fn, 999, 100); // BAD!
```

---

## 🔗 Related Documentation

- **Detailed Guide:** `DATABASE_CONNECTION_FIX.md`
- **Summary:** `DATABASE_RETRY_FIX_SUMMARY.md`
- **Prisma Docs:** https://www.prisma.io/docs/reference/api-reference
- **Neon Docs:** https://neon.tech/docs

---

## 📞 Support

### If retries still don't work:
1. Check `DATABASE_CONNECTION_FIX.md` troubleshooting
2. Verify environment variables
3. Check Neon database status
4. Restart dev server: `npm run dev`

### For production issues:
1. Check deployment logs
2. Verify DATABASE_URL in environment
3. Monitor connection pool on Neon Console
4. Consider upgrading Neon plan for better pool management

---

**Last Updated:** October 22, 2025  
**Retry Logic Status:** ✅ Active  
**Test Coverage:** Farmers API endpoints
