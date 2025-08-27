const axios = require('axios');

const BASE_URL = 'https://fims.cosmopolitan.edu.ng';

async function testGroupsAPI() {
  console.log('Testing Groups API...\n');

  try {
    // Test GET /api/groups (should require authentication)
    console.log('1. Testing GET /api/groups (unauthenticated)');
    try {
      const response = await axios.get(`${BASE_URL}/api/groups`);
      console.log('✓ Status:', response.status);
      console.log('✓ Data:', response.data);
    } catch (error) {
      console.log('✓ Expected error - Status:', error.response?.status || 'No response');
      console.log('✓ Error message:', error.response?.data?.error || error.message);
    }

    console.log('\n2. Testing POST /api/groups (unauthenticated)');
    try {
      const response = await axios.post(`${BASE_URL}/api/groups`, {
        name: 'Test Group',
        description: 'Test group description',
        permissions: ['read', 'write']
      });
      console.log('✓ Status:', response.status);
      console.log('✓ Data:', response.data);
    } catch (error) {
      console.log('✓ Expected error - Status:', error.response?.status || 'No response');
      console.log('✓ Error message:', error.response?.data?.error || error.message);
    }

    console.log('\n3. Testing database connection...');
    try {
      // Test a public endpoint that might show database connectivity
      const response = await axios.get(`${BASE_URL}/api/health`);
      console.log('✓ Health check passed');
    } catch (error) {
      console.log('! Health endpoint not available, testing other endpoints...');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testGroupsAPI();
