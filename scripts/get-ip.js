const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  console.log('Available network interfaces:\n');
  
  for (const name of Object.keys(interfaces)) {
    console.log(`Interface: ${name}`);
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`  ✓ IPv4: ${interface.address} (external)`);
      } else if (interface.family === 'IPv4' && interface.internal) {
        console.log(`  - IPv4: ${interface.address} (internal)`);
      }
    }
    console.log('');
  }
  
  // Find the best IP address for mobile app
  let bestIP = null;
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        // Prefer 192.168.x.x or 10.x.x.x networks
        if (interface.address.startsWith('192.168.') || interface.address.startsWith('10.')) {
          bestIP = interface.address;
          break;
        }
      }
    }
    if (bestIP) break;
  }
  
  console.log(`\n🎯 Recommended IP for mobile app: ${bestIP || 'localhost'}`);
  console.log(`📱 Update your mobile app config to: http://${bestIP || 'localhost'}:3000`);
  
  return bestIP;
}

getLocalIPAddress();
