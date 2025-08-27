# Enhanced Analytics API Documentation

## Overview
The `/api/analytics` endpoint provides comprehensive analytics data for the CCSA platform, including location distribution, demographics, agricultural data, and growth trends.

## Authentication
- **Web Admin**: Uses NextAuth session (full access to all data)
- **Mobile Agent**: Uses Firebase token (filtered to agent's data only)

## Response Structure

### 1. Overview Statistics
```json
{
  "overview": {
    "totalFarmers": 1234,
    "totalFarms": 987,
    "totalAgents": 56,
    "farmersThisMonth": 45,
    "farmersThisWeek": 12,
    "farmersToday": 3
  }
}
```

### 2. Location Distribution
Farmers distributed by administrative divisions:

```json
{
  "locationDistribution": {
    "byState": [
      { "state": "Lagos", "count": 456 },
      { "state": "Ogun", "count": 234 }
    ],
    "byLocalGovernment": [
      { "lga": "Ikeja", "count": 123 },
      { "lga": "Surulere", "count": 89 }
    ],
    "byWard": [
      { "ward": "Ward 1", "count": 45 },
      { "ward": "Ward 2", "count": 34 }
    ],
    "byPollingUnit": [
      { "pollingUnit": "PU 001", "count": 12 },
      { "pollingUnit": "PU 002", "count": 8 }
    ]
  }
}
```

### 3. Demographics
Farmer demographic analysis:

```json
{
  "demographics": {
    "byGender": [
      { "gender": "Male", "count": 678 },
      { "gender": "Female", "count": 556 }
    ],
    "byAge": [
      { "ageRange": "18-25", "count": 234 },
      { "ageRange": "26-35", "count": 456 },
      { "ageRange": "36-45", "count": 345 }
    ],
    "byMaritalStatus": [
      { "status": "Single", "count": 234 },
      { "status": "Married", "count": 789 }
    ]
  }
}
```

### 4. Agricultural Analytics
Farm and crop analysis:

```json
{
  "agriculture": {
    "topCrops": [
      { "crop": "Maize", "count": 345 },
      { "crop": "Rice", "count": 234 }
    ],
    "farmSizeDistribution": [
      { "sizeRange": "Small (0-2 hectares)", "count": 456 },
      { "sizeRange": "Medium (2-5 hectares)", "count": 234 }
    ],
    "farmOwnership": [
      { "ownership": "Owned", "count": 567 },
      { "ownership": "Rented", "count": 234 }
    ],
    "farmingExperience": [
      { "experienceRange": "Beginner (0-2 years)", "count": 123 },
      { "experienceRange": "Intermediate (3-5 years)", "count": 234 }
    ]
  }
}
```

### 5. Growth Trends
Registration trends over time:

```json
{
  "growthTrend": {
    "monthlyRegistrations": [
      { "month": "Jan 2024", "count": 45 },
      { "month": "Feb 2024", "count": 67 },
      { "month": "Mar 2024", "count": 89 }
    ]
  }
}
```

## Features

### 🗺️ Location Distribution
- **States**: Top states by farmer registration
- **Local Governments**: Top LGAs within states
- **Wards**: Ward-level distribution
- **Polling Units**: Polling unit analysis from farm data

### 👥 Demographics
- **Gender**: Male/Female distribution
- **Age Groups**: 6 age brackets (18-25, 26-35, 36-45, 46-55, 56-65, 65+)
- **Marital Status**: Single, Married, etc.

### 🌾 Agricultural Analytics
- **Top Crops**: Most popular crops by farm count
- **Farm Sizes**: Distribution across size categories
- **Ownership Types**: Owned, Rented, Leased, Family Land
- **Experience Levels**: Farming experience distribution

### 📈 Growth Trends
- **Monthly Registration**: 12 months of registration data
- **Time-based Analysis**: Trends and patterns over time

## Usage Examples

### Frontend Integration
```javascript
// Fetch analytics data
const response = await fetch('/api/analytics');
const data = await response.json();

// Use in charts
const stateData = data.locationDistribution.byState;
const ageData = data.demographics.byAge;
const cropData = data.agriculture.topCrops;
```

### Chart Components
The data structure is optimized for popular charting libraries:
- **Bar Charts**: State, LGA, Ward distributions
- **Pie Charts**: Age, Gender, Experience distributions  
- **Line Charts**: Monthly registration trends
- **Donut Charts**: Crop and ownership distributions

## Performance Considerations
- Uses Promise.all() for parallel database queries
- Limits results for large datasets (top 10-20 items)
- Calculates age distributions in-memory for efficiency
- Optimized for both admin and agent-filtered views

## Security
- Agent users only see their own registered farmers
- Admin users see system-wide analytics
- All queries respect user permissions and filtering
