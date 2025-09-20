import twilio from 'twilio';
import ProductionLogger from '../../../lib/productionLogger';
import TermiiService from '../../../lib/termiiService';

// Initialize Twilio client only if credentials are properly configured
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    !process.env.TWILIO_ACCOUNT_SID.includes('your_twilio')) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

const termiiService = new TermiiService();

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

    let verificationResult = null;
    let provider = 'unknown';
    let fallbackUsed = false;

    // Check if Twilio credentials are properly configured
    const twilioConfigured = client !== null;

    // Try Twilio first only if properly configured
    if (twilioConfigured) {
      try {
        ProductionLogger.debug('Attempting Twilio SMS verification');
        
        const verification = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications
          .create({
            to: phoneNumber,
            channel: 'sms'
          });

        verificationResult = {
          success: true,
          verificationId: verification.sid,
          status: verification.status,
          provider: 'twilio'
        };
        provider = 'twilio';

        ProductionLogger.debug('Twilio SMS verification sent successfully', { 
          verificationId: verification.sid, 
          status: verification.status 
        });

      } catch (twilioError) {
        ProductionLogger.warn('Twilio SMS failed, trying Termii backup', { error: twilioError.message });
        
        // Fallback to Termii on Twilio failure
        try {
          const termiiResult = await termiiService.sendVerificationCode(phoneNumber);
          verificationResult = termiiResult;
          provider = 'termii';
          fallbackUsed = true;

          ProductionLogger.debug('Termii SMS backup sent successfully', { 
            verificationId: termiiResult.verificationId 
          });

        } catch (termiiError) {
          ProductionLogger.error('Both Twilio and Termii SMS failed', { 
            twilioError: twilioError.message,
            termiiError: termiiError.message 
          });

          return res.status(500).json({ 
            error: 'SMS service temporarily unavailable. Please try again later.',
            details: {
              primaryProvider: 'twilio_failed',
              backupProvider: 'termii_failed'
            }
          });
        }
      }
    } else {
      // Use Termii as primary when Twilio is not configured
      try {
        ProductionLogger.debug('Twilio not configured, using Termii as primary SMS provider');
        const termiiResult = await termiiService.sendVerificationCode(phoneNumber);
        verificationResult = termiiResult;
        provider = 'termii';

        ProductionLogger.debug('Termii SMS sent successfully', { 
          verificationId: termiiResult.verificationId 
        });

      } catch (termiiError) {
        ProductionLogger.error('Termii SMS failed', { 
          termiiError: termiiError.message 
        });

        return res.status(500).json({ 
          error: 'SMS service temporarily unavailable. Please try again later.',
          details: {
            primaryProvider: 'termii_failed',
            note: 'Twilio not configured'
          }
        });
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      verificationId: verificationResult.verificationId,
      status: verificationResult.status,
      provider,
      fallbackUsed,
      message: fallbackUsed ? 'SMS sent via backup service' : 'SMS sent successfully'
    });

  } catch (error) {
    ProductionLogger.error('SMS verification error:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to send SMS verification code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}