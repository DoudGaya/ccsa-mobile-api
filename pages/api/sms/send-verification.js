import twilio from 'twilio';
import ProductionLogger from '../../../lib/productionLogger';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    ProductionLogger.debug('Attempting to send SMS verification', { phoneNumber: phoneNumber.slice(-4) });

    // Send verification via Twilio
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    ProductionLogger.debug('SMS verification sent', { 
      verificationId: verification.sid, 
      status: verification.status 
    });

    res.status(200).json({
      success: true,
      verificationId: verification.sid,
      status: verification.status
    });

  } catch (error) {
    ProductionLogger.error('Twilio SMS error:', error.message);
    
    // Handle specific Twilio errors
    if (error.code === 60200) {
      return res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
    }
    
    if (error.code === 60203) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait before trying again.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to send SMS verification code' 
    });
  }
}