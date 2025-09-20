import TermiiService from '../../../lib/termiiService';
import ProductionLogger from '../../../lib/productionLogger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    ProductionLogger.debug('Testing Termii SMS with phone number', { 
      phoneNumber,
      formatted: phoneNumber
    });

    // Validate Nigerian phone number format
    const nigerianPhoneRegex = /^\+234[789][01]\d{8}$/;
    const isValidFormat = nigerianPhoneRegex.test(phoneNumber);

    if (!isValidFormat) {
      return res.status(400).json({ 
        error: 'Invalid Nigerian phone number format',
        provided: phoneNumber,
        expectedFormat: '+234XXXXXXXXXX (starting with 7, 8, or 9)',
        isValid: false
      });
    }

    const termiiService = new TermiiService();
    
    // Test Termii service first
    const serviceTest = await termiiService.testService();
    if (!serviceTest.success) {
      return res.status(500).json({
        error: 'Termii service not available',
        details: serviceTest.message
      });
    }

    // Try to send SMS
    const result = await termiiService.sendVerificationCode(phoneNumber);

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully via Termii',
      phoneNumber,
      isValidFormat,
      verificationId: result.verificationId,
      messageId: result.messageId,
      provider: result.provider
    });

  } catch (error) {
    ProductionLogger.error('Termii SMS test error:', error);
    
    res.status(500).json({ 
      error: 'Failed to send test SMS',
      details: error.message,
      phoneNumber: req.body.phoneNumber
    });
  }
}