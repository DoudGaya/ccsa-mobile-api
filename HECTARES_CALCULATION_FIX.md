# Hectares Calculation Consistency Fix

## Issue
Dashboard was showing **297.5 hectares** while the farms page showed **231.19 hectares**, indicating inconsistent calculation methods across the application.

## Root Cause
Different parts of the application were using different methods to calculate total hectares:

1. **Dashboard Analytics** (`pages/api/dashboard/analytics.js`):
   - Used `calculateTotalHectares()` utility function
   - This function called `calculateMissingFarmSize()` on each farm
   - Added calculated polygon areas when `farmSize` was 0 or null
   - Result: **Inflated hectares count** (297.5 ha)

2. **Farms Analytics API** (`pages/api/farms/analytics.js`):
   - Used Prisma's `_sum.farmSize` aggregate directly from database
   - Only summed existing `farmSize` values
   - Result: **Accurate database value** (231.19 ha)

3. **Farms Page** (`pages/farms.js`):
   - Applied `calculateMissingFarmSize()` to each farm before display
   - Modified individual farm data with calculated sizes
   - Result: **Inconsistent with database aggregates**

## Solution Implemented
**Single Source of Truth**: All hectares calculations now use the database `farmSize` field directly without any polygon-based calculations.

### Changes Made:

#### 1. Dashboard Analytics API (`pages/api/dashboard/analytics.js`)
**Before:**
```javascript
import { calculateTotalHectares, calculateFarmerStatus } from '../../../lib/farmCalculations'
// ...
const totalHectares = calculateTotalHectares(allFarms);
```

**After:**
```javascript
import { calculateFarmerStatus } from '../../../lib/farmCalculations'
// ...
// Calculate total hectares directly from database - SINGLE SOURCE OF TRUTH
const totalHectares = allFarms.reduce((sum, farm) => {
  return sum + (parseFloat(farm.farmSize) || 0);
}, 0);
```

#### 2. Farms Page (`pages/farms.js`)
**Before:**
```javascript
import { calculateMissingFarmSize } from '../lib/farmCalculations'
// ...
const farmsWithCalculatedSizes = farmsData.map(farm => calculateMissingFarmSize(farm))
setFarms(farmsWithCalculatedSizes)
calculateStats(farmsWithCalculatedSizes)
```

**After:**
```javascript
// Removed import of calculateMissingFarmSize
// ...
// Use farm sizes directly from database - SINGLE SOURCE OF TRUTH
setFarms(farmsData)
calculateStats(farmsData)
```

#### 3. Farms Analytics API (No Changes Needed)
Already using correct approach:
```javascript
totalHectares: Math.round((farmStats._sum.farmSize || 0) * 100) / 100
```

## Impact

### ✅ Fixed
- **Data Consistency**: All pages now show identical total hectares from database
- **Dashboard**: Now displays accurate database values
- **Farms Page**: Uses database values without modifications
- **Analytics API**: Already correct, no changes needed

### ✅ Preserved Functionality
- Farm listing and display still works correctly
- Farm details and polygon display unaffected
- Statistics calculations use consistent data
- No breaking changes to existing features

### 📦 Deprecated (Not Removed)
- `calculateMissingFarmSize()` - Still exists in `lib/farmCalculations.js` but not used for totals
- `calculateTotalHectares()` - Still exists but not used in production code
- These functions may be useful for future polygon-based features but should NOT be used for aggregate statistics

## Verification Checklist
- [x] Dashboard shows same hectares as farms page
- [x] Farms analytics API returns consistent value
- [x] No TypeScript/JavaScript errors
- [x] Farm listings display correctly
- [x] No existing features broken

## Testing Instructions
1. Navigate to the Dashboard
2. Note the "Total Hectares" value
3. Navigate to the Farms page
4. Compare the total hectares shown
5. Both should display the same value (from database `farmSize` field)

## Database Integrity Note
The fix ensures that the **database `farmSize` field is the authoritative source** for all hectares calculations. If polygon-based calculations are needed in the future, they should:
1. Be stored in a separate field (e.g., `calculatedFarmSize`)
2. Not affect aggregate statistics
3. Be clearly labeled as "calculated" vs "actual" values
