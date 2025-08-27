const http = require('http');

function testLocalAPI() {
  console.log('Testing local API server...\n');

  // Test localhost:3000
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✓ Server is running! Status: ${res.statusCode}`);
    console.log(`✓ Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✓ Response:`, data);
      
      // Now test the farms endpoint
      testFarmsEndpoint();
    });
  });

  req.on('error', (err) => {
    console.error(`✗ Error: ${err.message}`);
    console.log('API server might not be running on localhost:3000');
  });

  req.on('timeout', () => {
    console.error('✗ Request timed out');
    req.destroy();
  });

  req.setTimeout(5000);
  req.end();
}

function testFarmsEndpoint() {
  console.log('\nTesting farms endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/farms',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✓ Farms endpoint status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✓ Farms endpoint response type:`, typeof response);
        console.log(`✓ Response keys:`, Object.keys(response));
      } catch (e) {
        console.log(`✓ Raw response:`, data.substring(0, 200));
      }
    });
  });

  req.on('error', (err) => {
    console.error(`✗ Farms endpoint error: ${err.message}`);
  });

  req.setTimeout(5000);
  req.end();
}

// Run the test
testLocalAPI();
