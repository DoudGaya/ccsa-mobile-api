export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Twilio credentials are configured
    const hasCredentials = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_VERIFY_SERVICE_SID
    );

    if (!hasCredentials) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured',
        details: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          hasVerifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID
        }
      });
    }

    // Try to initialize Twilio client
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test the connection by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

    res.status(200).json({
      success: true,
      message: 'Twilio connection successful',
      account: {
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      },
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID
    });

  } catch (error) {
    console.error('Twilio test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Twilio connection failed',
      details: error.message,
      code: error.code
    });
  }
}
