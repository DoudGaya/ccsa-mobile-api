const axios = require('axios');

const possibleIPs = [
  'localhost',
  '127.0.0.1',
  '192.168.1.100',
  '192.168.1.1',
  '192.168.0.100',
  '192.168.0.1',
  '192.168.10.100',
  '192.168.10.1',
  '192.168.11.100',
  '192.168.11.1',
  '10.0.0.100',
  '10.0.0.1'
];

async function testConnections() {
  console.log('Testing possible API server addresses...\n');

  for (const ip of possibleIPs) {
    try {
      const url = `http://${ip}:3000/api/health`;
      console.log(`Testing: ${url}`);
      
      const response = await axios.get(url, { timeout: 3000 });
      console.log(`✅ SUCCESS - ${ip}:3000 is reachable!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
      
      // Test farms endpoint
      try {
        const farmsResponse = await axios.get(`http://${ip}:3000/api/farms`, { timeout: 3000 });
        console.log(`   ✅ Farms endpoint also working on ${ip}:3000\n`);
      } catch (farmsError) {
        console.log(`   ⚠️  Farms endpoint requires auth on ${ip}:3000 (expected)\n`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Connection refused - ${ip}:3000`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`⏱️  Timeout - ${ip}:3000`);
      } else {
        console.log(`❌ Error - ${ip}:3000: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎯 If any IP showed SUCCESS above, use that IP in your mobile app config!');
  console.log('📱 Update src/config/api.js to use: http://[WORKING_IP]:3000');
}

testConnections();
