const fetch = require('node-fetch');

async function testSMS() {
  try {
    console.log('🧪 Testing SMS functionality...');
    
    // Test with a Nigerian phone number format
    const testPhone = '+2348012345678'; // Replace with your actual phone number for testing
    
    console.log(`📱 Sending test SMS to: ${testPhone}`);
    
    const response = await fetch('http://192.168.10.122:3000/api/sms/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: testPhone
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SMS sent successfully!');
      console.log('Response:', data);
      console.log('📄 Verification ID:', data.verificationId);
      console.log('📋 Status:', data.status);
      
      // Prompt for verification code
      console.log('\n📱 Check your phone for the verification code!');
      console.log('💡 You can now test verification using:');
      console.log(`   curl -X POST http://192.168.10.122:3000/api/sms/verify-code \\`);
      console.log(`        -H "Content-Type: application/json" \\`);
      console.log(`        -d '{"phoneNumber":"${testPhone}","code":"YOUR_CODE_HERE"}'`);
      
    } else {
      console.error('❌ SMS failed to send');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
    
  } catch (error) {
    console.error('🔥 Test failed:', error.message);
  }
}

// Run the test
testSMS();
