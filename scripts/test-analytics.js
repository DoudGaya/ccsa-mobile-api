// Simple test script for analytics API
const { NextRequest } = require('next/server');

async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API...');
  
  try {
    // Mock request and response objects
    const req = {
      method: 'GET',
      isAdmin: true,
      user: { uid: 'test-admin', email: 'admin@test.com', role: 'admin' }
    };
    
    const responseData = [];
    const res = {
      status: (code) => ({ 
        json: (data) => {
          console.log(`✅ Response Status: ${code}`);
          console.log('📊 Analytics Data Structure:');
          console.log(JSON.stringify(data, null, 2));
          responseData.push(data);
          return data;
        }
      })
    };

    // Import and test the analytics API
    const analyticsHandler = require('../pages/api/analytics/index.js').default;
    
    // Test the handler
    await analyticsHandler(req, res);
    
    // Validate response structure
    const data = responseData[0];
    if (data && data.overview && data.locationDistribution && data.demographics && data.agriculture && data.growthTrend) {
      console.log('✅ All expected analytics sections are present');
      console.log(`📈 Overview: ${data.overview.totalFarmers} farmers, ${data.overview.totalFarms} farms`);
      console.log(`🗺️  Location Distribution: ${data.locationDistribution.byState.length} states`);
      console.log(`👥 Demographics: ${data.demographics.byGender.length} gender categories`);
      console.log(`🌾 Agriculture: ${data.agriculture.topCrops.length} top crops`);
      console.log(`📅 Growth Trend: ${data.growthTrend.monthlyRegistrations.length} months of data`);
    } else {
      console.log('❌ Missing expected analytics sections');
    }
    
  } catch (error) {
    console.error('❌ Analytics API Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testAnalyticsAPI();
}

module.exports = { testAnalyticsAPI };
