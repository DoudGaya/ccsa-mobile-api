import TermiiService from '../../../lib/termiiService';
import ProductionLogger from '../../../lib/productionLogger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const termiiService = new TermiiService();
    
    // Test account balance
    const balanceResult = await termiiService.getBalance();
    
    // Test service connectivity
    const testResult = await termiiService.testService();
    
    ProductionLogger.debug('Termii test results', { balanceResult, testResult });
    
    res.status(200).json({
      success: true,
      balance: balanceResult,
      connectivity: testResult,
      configuration: {
        hasApiKey: !!process.env.TERMII_API_KEY,
        senderId: process.env.TERMII_SENDER_ID || 'CCSA',
        baseUrl: process.env.TERMII_BASE_URL || 'https://v3.api.termii.com'
      }
    });

  } catch (error) {
    ProductionLogger.error('Termii test error:', error);
    
    res.status(500).json({ 
      error: 'Termii test failed',
      details: error.message
    });
  }
}