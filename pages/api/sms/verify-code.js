import twilio from 'twilio';
import { Logger } from '../../../lib/logger';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { verificationId, code, phoneNumber } = req.body;

    if (!code) {
      return res.status(400).json({ 
        error: 'Verification code is required' 
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({ 
        error: 'Phone number is required for verification' 
      });
    }

    Logger.debug('Verifying SMS code', { phoneNumber: phoneNumber.slice(-4) });

    // Verify code with Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    const isVerified = verificationCheck.status === 'approved';

    Logger.debug('SMS verification result', { status: verificationCheck.status });

    res.status(200).json({
      success: true,
      verified: isVerified,
      status: verificationCheck.status
    });

  } catch (error) {
    Logger.error('Twilio verification error:', error.message);
    
    if (error.code === 20404) {
      return res.status(400).json({ 
        error: 'No pending verification found for this phone number' 
      });
    }
    
    if (error.code === 60202) {
      return res.status(400).json({ 
        error: 'Invalid verification code' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to verify code',
      details: error.message 
    });
  }
}