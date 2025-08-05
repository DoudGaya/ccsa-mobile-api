// Test script to verify email configuration
// Run with: node scripts/test-email.js

import { sendAgentActivationEmail } from '../lib/emailService.js';

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Test data
  const testEmailData = {
    email: 'test-recipient@example.com', // Replace with your test email
    firstName: 'Test',
    lastName: 'Agent',
    activationToken: 'test-token-123',
    createdBy: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com'
    }
  };

  try {
    console.log('Attempting to send test activation email...');
    
    const result = await sendAgentActivationEmail(testEmailData);
    
    if (result.simulated) {
      console.log('⚠️  EMAIL SIMULATION MODE');
      console.log('   Email configuration is missing or incomplete.');
      console.log('   Please check your .env.local file and ensure:');
      console.log('   - EMAIL_USER is set to your Gmail address');
      console.log('   - EMAIL_PASSWORD is set to your App Password');
      console.log('   - EMAIL_SERVICE is set to "gmail"');
    } else {
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('   Real email was sent to:', testEmailData.email);
      console.log('   Check the recipient\'s inbox (and spam folder).');
    }
    
    console.log('\nResult:', result);
    
  } catch (error) {
    console.error('❌ EMAIL SENDING FAILED');
    console.error('Error details:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your Gmail App Password is correct');
    console.log('2. Ensure 2FA is enabled on your Gmail account');
    console.log('3. Check that EMAIL_USER and EMAIL_PASSWORD are set in .env.local');
    console.log('4. Make sure you\'re using an App Password, not your regular Gmail password');
  }
}

// Run the test
testEmailConfiguration();
