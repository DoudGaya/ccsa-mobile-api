# Zustand State Management - Web Dashboard Implementation Guide

## Overview

Implemented centralized state management using Zustand for the web dashboard/admin panel. This provides better performance, persistent state, and cleaner code architecture.

---

## Installation

Zustand has been added to `package.json`. Install it:

```bash
cd ccsa-mobile-api
npm install
```

---

## Store Architecture

### Available Stores

| Store | File | Purpose |
|-------|------|---------|
| `useFarmerStore` | `store/useFarmerStore.js` | Manage farmers data, filters, pagination |
| `useFarmStore` | `store/useFarmStore.js` | Manage farms data and operations |
| `useDashboardStore` | `store/useDashboardStore.js` | Dashboard stats and analytics |
| `useUserStore` | `store/useUserStore.js` | Users and agents management |
| `useClusterStore` | `store/useClusterStore.js` | Clusters management |

### Features

✅ **Persistent State** - Filters and preferences survive page reloads  
✅ **DevTools Integration** - Debug state changes with Redux DevTools  
✅ **Optimistic Updates** - Instant UI updates  
✅ **Local Filtering** - Filter without API calls when data loaded  
✅ **Loading States** - Built-in loading and error handling  
✅ **Type Safety** - Clear action methods  

---

## Migration Guide

### Before (Component State)

```javascript
import { useState, useEffect } from 'react';

export default function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', state: '' });

  useEffect(() => {
    fetchFarmers();
  }, [filters]);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/farmers?search=${filters.search}`);
      const data = await response.json();
      setFarmers(data.farmers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX...
  );
}
```

### After (Zustand Store)

```javascript
import { useEffect } from 'react';
import { useFarmerStore } from '../store';

export default function Farmers() {
  const { 
    farmers, 
    loading, 
    filters, 
    setFilters, 
    fetchFarmers 
  } = useFarmerStore();

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  return (
    // JSX... use farmers, loading, filters directly
  );
}
```

---

## Usage Examples

### Example 1: Farmers List Page

**File**: `pages/farmers/index.js`

```javascript
import { useEffect } from 'react';
import { useFarmerStore } from '../../store';
import Layout from '../../components/Layout';

export default function FarmersPage() {
  const {
    farmers,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    fetchFarmers,
    loadAllFarmers,
    searchLocal,
    exportFarmers
  } = useFarmerStore();

  // Load farmers on mount
  useEffect(() => {
    fetchFarmers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setFilters({ search: searchTerm });
    
    // If all farmers loaded, search locally (instant)
    if (pagination.loadedAll) {
      const results = searchLocal(searchTerm);
      console.log('Local search results:', results.length);
    } else {
      // Otherwise refetch from API
      fetchFarmers();
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
    fetchFarmers(); // Refetch with new filters
  };

  // Load all farmers (for admin)
  const handleLoadAll = async () => {
    await loadAllFarmers();
    alert(`Loaded all ${pagination.total} farmers!`);
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      await exportFarmers('csv');
      alert('Export successful!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  if (loading && farmers.length === 0) {
    return <Layout><div>Loading farmers...</div></Layout>;
  }

  if (error) {
    return <Layout><div>Error: {error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1>Farmers ({pagination.total})</h1>
          <div className="space-x-2">
            {!pagination.loadedAll && (
              <button onClick={handleLoadAll} className="btn-primary">
                Load All Farmers
              </button>
            )}
            <button onClick={handleExport} className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search farmers..."
          value={filters.search}
          onChange={handleSearch}
          className="input mb-4"
        />

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select 
            value={filters.state} 
            onChange={(e) => handleFilterChange('state', e.target.value)}
          >
            <option value="">All States</option>
            <option value="Kano">Kano</option>
            <option value="Lagos">Lagos</option>
          </select>

          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Farmers Table */}
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>State</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map(farmer => (
              <tr key={farmer.id}>
                <td>{farmer.firstName} {farmer.lastName}</td>
                <td>{farmer.phone}</td>
                <td>{farmer.state}</td>
                <td>{farmer.status}</td>
                <td>
                  <button>View</button>
                  <button>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.hasMore && (
          <button onClick={() => {
            // Load next page logic
          }}>
            Load More
          </button>
        )}
      </div>
    </Layout>
  );
}
```

---

### Example 2: Dashboard with Stats

**File**: `pages/dashboard.js`

```javascript
import { useEffect } from 'react';
import { useDashboardStore, useFarmerStore } from '../store';
import Layout from '../components/Layout';

export default function Dashboard() {
  const {
    stats,
    recentActivity,
    topStates,
    loading,
    fetchDashboardStats
  } = useDashboardStore();

  const { pagination } = useFarmerStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) return <Layout><div>Loading dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="p-6">
        <h1>Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <h3>Total Farmers</h3>
            <p className="text-3xl">{stats.farmers?.total || 0}</p>
            <span className="text-sm text-green-600">
              +{stats.farmers?.new || 0} new
            </span>
          </div>

          <div className="stat-card">
            <h3>Total Farms</h3>
            <p className="text-3xl">{stats.farms?.total || 0}</p>
            <span className="text-sm">
              {stats.farms?.totalHectares || 0} hectares
            </span>
          </div>

          <div className="stat-card">
            <h3>Clusters</h3>
            <p className="text-3xl">{stats.clusters?.total || 0}</p>
            <span className="text-sm">
              {stats.clusters?.active || 0} active
            </span>
          </div>

          <div className="stat-card">
            <h3>Certificates</h3>
            <p className="text-3xl">{stats.certificates?.total || 0}</p>
            <span className="text-sm text-orange-600">
              {stats.certificates?.pending || 0} pending
            </span>
          </div>
        </div>

        {/* Top States */}
        <div className="mb-6">
          <h2>Top States by Farmers</h2>
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Farmers</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {topStates.map(state => (
                <tr key={state.name}>
                  <td>{state.name}</td>
                  <td>{state.count}</td>
                  <td>{state.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div>
          <h2>Recent Activity</h2>
          <ul>
            {recentActivity.map((activity, idx) => (
              <li key={idx}>
                {activity.action} - {activity.timestamp}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
```

---

### Example 3: Farmer Edit with Optimistic Updates

```javascript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFarmerStore } from '../../../store';

export default function EditFarmer() {
  const router = useRouter();
  const { id } = router.query;

  const {
    selectedFarmer,
    loading,
    getFarmerById,
    updateFarmer
  } = useFarmerStore();

  useEffect(() => {
    if (id) {
      getFarmerById(id);
    }
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      await updateFarmer(id, formData);
      
      // Store automatically updates farmers list
      alert('Farmer updated successfully!');
      router.push('/farmers');
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!selectedFarmer) return <div>Farmer not found</div>;

  return (
    <div>
      <h1>Edit Farmer: {selectedFarmer.firstName}</h1>
      {/* Form here */}
    </div>
  );
}
```

---

### Example 4: Local Filtering (Instant)

```javascript
import { useFarmerStore } from '../store';

export default function FarmerFilters() {
  const {
    farmers,
    filters,
    pagination,
    filterLocal,
    setFilters
  } = useFarmerStore();

  // Get filtered results locally (instant, no API call)
  const filteredFarmers = filterLocal();

  return (
    <div>
      <div className="filters">
        <input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />

        <select
          value={filters.state}
          onChange={(e) => setFilters({ state: e.target.value })}
        >
          <option value="">All States</option>
          <option value="Kano">Kano</option>
          <option value="Lagos">Lagos</option>
        </select>
      </div>

      <div>
        <p>Showing {filteredFarmers.length} of {farmers.length} farmers</p>
        {pagination.loadedAll && (
          <span className="text-green-600">✓ All farmers loaded</span>
        )}
      </div>

      <ul>
        {filteredFarmers.map(farmer => (
          <li key={farmer.id}>{farmer.firstName} {farmer.lastName}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Store API Reference

### useFarmerStore

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `fetchFarmers(loadAll)` | `boolean` | `Promise<Array>` | Fetch farmers with current filters |
| `loadAllFarmers()` | None | `Promise<Array>` | Load all farmers (admin) |
| `searchLocal(query)` | `string` | `Array` | Search locally (instant) |
| `filterLocal()` | None | `Array` | Apply filters locally |
| `setFilters(filters)` | `object` | `void` | Update filter values |
| `resetFilters()` | None | `void` | Clear all filters |
| `getFarmerById(id)` | `string` | `Promise<object>` | Get single farmer |
| `updateFarmer(id, data)` | `string, object` | `Promise<object>` | Update farmer |
| `deleteFarmer(id)` | `string` | `Promise<boolean>` | Delete farmer |
| `exportFarmers(format)` | `string` | `Promise<boolean>` | Export to CSV/Excel |

### useDashboardStore

| Method | Description |
|--------|-------------|
| `fetchDashboardStats()` | Load dashboard statistics |
| `refreshStats()` | Refresh stats data |

### useUserStore

| Method | Description |
|--------|-------------|
| `fetchUsers()` | Load all users |
| `fetchAgents()` | Load all agents |
| `updateUser(id, data)` | Update user |
| `deleteUser(id)` | Delete user |

---

## Performance Benefits

### Before (Component State)

```
❌ State lost on page refresh
❌ Duplicate API calls across components
❌ Manual loading/error handling in each component
❌ No persistent filters
❌ Slower filtering (API calls)
❌ Complex prop drilling
```

### After (Zustand)

```
✅ State persists across page reloads
✅ Shared state - one API call, many consumers
✅ Centralized loading/error handling
✅ Filters persist automatically
✅ Instant local filtering when data loaded
✅ No prop drilling needed
✅ Redux DevTools integration
```

---

## Debugging

### Use Redux DevTools

1. Install Redux DevTools Chrome extension
2. Open DevTools → Redux tab
3. See all state changes in real-time

### Check Store State

```javascript
// In any component
const store = useFarmerStore();
console.log('Current state:', store);
```

### Force Refresh

```javascript
const { reset, fetchFarmers } = useFarmerStore();

// Clear everything
reset();

// Reload fresh data
fetchFarmers();
```

---

## Migration Checklist

### Pages to Migrate

- [ ] `pages/farmers/index.js` - Use `useFarmerStore`
- [ ] `pages/farms.js` - Use `useFarmStore`
- [ ] `pages/dashboard.js` - Use `useDashboardStore`
- [ ] `pages/users.js` - Use `useUserStore`
- [ ] `pages/clusters.js` - Use `useClusterStore`
- [ ] `pages/filtered-farmers.js` - Use `useFarmerStore`

### Steps

1. Import store at top of file
2. Replace `useState` with store selectors
3. Replace `useEffect` fetch logic with store methods
4. Update event handlers to use store actions
5. Remove local state management code
6. Test functionality

---

## Best Practices

### ✅ Do

```javascript
// Use selectors to get only what you need
const { farmers, loading } = useFarmerStore();

// Use actions for updates
const { setFilters, fetchFarmers } = useFarmerStore();

// Check if data loaded before filtering locally
if (pagination.loadedAll) {
  const filtered = filterLocal();
}
```

### ❌ Don't

```javascript
// Don't destructure entire store
const store = useFarmerStore(); // ❌ Causes unnecessary re-renders

// Don't mutate state directly
farmers.push(newFarmer); // ❌ Won't work

// Use action instead
addFarmer(newFarmer); // ✅ Correct
```

---

## Troubleshooting

### Store not persisting

Check `localStorage` in DevTools → Application tab. Clear if needed:
```javascript
localStorage.removeItem('farmer-storage');
```

### Too many re-renders

Only select what you need:
```javascript
// ❌ Bad - re-renders on any state change
const store = useFarmerStore();

// ✅ Good - only re-renders when farmers change
const farmers = useFarmerStore(state => state.farmers);
```

### DevTools not working

Install: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools)

---

## Next Steps

1. Install dependencies: `npm install`
2. Migrate `pages/farmers/index.js` first (most complex)
3. Test thoroughly with Redux DevTools
4. Migrate other pages one by one
5. Remove old state management code
6. Update tests if applicable

---

**Status**: ✅ Zustand stores created and ready to use!

All stores are in `ccsa-mobile-api/store/` directory and exported from `store/index.js`.
