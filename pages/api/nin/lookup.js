import { authMiddleware } from '../../../lib/auth';
import ProductionLogger from '../../../lib/productionLogger';

// NIN API configuration
const NIN_API_BASE_URL = process.env.NIN_API_BASE_URL;
const NIN_API_KEY = process.env.NIN_API_KEY;

// Function to lookup NIN from external API
async function lookupNINFromAPI(nin) {
  try {
    const url = `${NIN_API_BASE_URL}/api/lookup/nin?op=level-4&nin=${nin}`;
    
    ProductionLogger.debug(`Making NIN API request for NIN: ****${nin.slice(-4)}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": NIN_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    ProductionLogger.debug("NIN Verification Response status:", data.status);
    
    // Check if the API returned success
    if (data.status === 200 && data.data) {
      return data.data;
    } else {
      // Handle specific "norecord" case
      if (data.message === 'norecord' || data.status === 404) {
        const error = new Error('NIN not found');
        error.code = 'NIN_NOT_FOUND';
        throw error;
      }
      throw new Error(data.message || 'NIN not found or invalid');
    }
  } catch (error) {
    // Pass through specific errors
    if (error.code === 'NIN_NOT_FOUND') throw error;
    
    ProductionLogger.error('NIN API lookup error:', error.message);
    throw error;
  }
}

// GET /api/nin/lookup - Lookup NIN information
export default authMiddleware(async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { nin } = req.query;

    if (!nin) {
      return res.status(400).json({ error: 'NIN is required' });
    }

    if (nin.length !== 11 || !/^\d+$/.test(nin)) {
      return res.status(400).json({ 
        error: 'Invalid NIN format',
        status: 718,
        code: 718,
        message: "nin must be length = 11"
      });
    }

    let ninData;

    // Try to lookup from external API
    if (NIN_API_BASE_URL && NIN_API_KEY) {
      try {
        ninData = await lookupNINFromAPI(nin);
      } catch (error) {
        if (error.code === 'NIN_NOT_FOUND') {
          return res.status(404).json({
            error: 'NIN not found',
            status: 404,
            message: 'The provided NIN does not exist in the database'
          });
        }

        ProductionLogger.error('External NIN API failed:', error.message);
        
        return res.status(503).json({ 
          error: 'Service unavailable',
          status: 503,
          message: 'NIN verification service is temporarily unavailable'
        });
      }
    } else {
      ProductionLogger.warn('NIN API credentials not configured');
      return res.status(503).json({ 
        error: 'Service not configured',
        status: 503,
        message: 'NIN verification service is not available'
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      data: ninData,
    });
  } catch (error) {
    ProductionLogger.error('Error in NIN lookup handler:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      status: 500,
      message: 'An error occurred while verifying the NIN'
    });
  }
});
