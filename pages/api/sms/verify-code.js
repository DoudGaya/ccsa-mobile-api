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

    ProductionLogger.debug('Verifying SMS code', { 
      phoneNumber: phoneNumber.slice(-4),
      verificationId: verificationId?.slice(0, 10) + '...'
    });

    let verificationResult = null;
    let provider = 'unknown';

    // Determine provider based on verificationId format
    if (verificationId && verificationId.startsWith('termii_')) {
      // Verify using Termii
      try {
        ProductionLogger.debug('Verifying code via Termii');
        verificationResult = await termiiService.verifyCode(verificationId, code, phoneNumber);
        provider = 'termii';

        ProductionLogger.debug('Termii verification result', { 
          verified: verificationResult.verified,
          status: verificationResult.status 
        });

      } catch (error) {
        ProductionLogger.error('Termii verification error:', error.message);
        return res.status(500).json({ 
          error: 'Verification service error',
          details: error.message 
        });
      }
    } else {
      // Check if Twilio credentials are properly configured
      const twilioConfigured = client !== null;

      if (twilioConfigured) {
        // Try Twilio verification
        try {
          ProductionLogger.debug('Verifying code via Twilio');
          
          const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
              to: phoneNumber,
              code: code
            });

          const isVerified = verificationCheck.status === 'approved';
          provider = 'twilio';

          verificationResult = {
            success: true,
            verified: isVerified,
            status: verificationCheck.status
          };

          ProductionLogger.debug('Twilio verification result', { 
            status: verificationCheck.status 
          });

        } catch (twilioError) {
          ProductionLogger.error('Twilio verification error:', twilioError.message);
          
          // Handle specific Twilio errors
          if (twilioError.code === 20404) {
            return res.status(400).json({ 
              error: 'No pending verification found for this phone number' 
            });
          }
          
          if (twilioError.code === 60202) {
            return res.status(400).json({ 
              error: 'Invalid verification code' 
            });
          }

          return res.status(500).json({ 
            error: 'Failed to verify code',
            details: twilioError.message 
          });
        }
      } else {
        // Twilio not configured, return error for non-Termii verifications
        ProductionLogger.warn('Twilio verification attempted but not configured properly');
        return res.status(400).json({ 
          error: 'Invalid verification session. Please request a new code.',
          details: 'Primary SMS provider not configured'
        });
      }
    }

    // Return unified response
    if (verificationResult && verificationResult.success !== false) {
      res.status(200).json({
        success: true,
        verified: verificationResult.verified,
        status: verificationResult.status,
        provider,
        message: verificationResult.verified ? 'Code verified successfully' : 'Invalid verification code'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: verificationResult?.error || 'Verification failed',
        provider,
        attemptsRemaining: verificationResult?.attemptsRemaining
      });
    }

  } catch (error) {
    ProductionLogger.error('SMS verification error:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to verify code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}