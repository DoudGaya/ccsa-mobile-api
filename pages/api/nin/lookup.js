import { authMiddleware } from '../../../lib/auth';

// NIN API configuration
const NIN_API_BASE_URL = process.env.NIN_API_BASE_URL;
const NIN_API_KEY = process.env.NIN_API_KEY;

// Mock NIN lookup service (fallback)
const mockNINData = {
  '12345678901': {
    firstname: 'John',
    middlename: 'Doe',
    surname: 'Smith',
    dateofbirth: '1990-01-15',
    gender: 'M',
    educationallevel: 'TERTIARY',
  },
  '98765432109': {
    firstname: 'Jane',
    middlename: 'Mary',
    surname: 'Johnson',
    dateofbirth: '1985-05-20',
    gender: 'F',
    educationallevel: 'SECONDARY',
  },
};

// Function to lookup NIN from external API
async function lookupNINFromAPI(nin) {
  try {
    const url = `${NIN_API_BASE_URL}/api/lookup/nin?op=level-4&nin=${nin}`;
    
    console.log(`Making NIN API request to: ${NIN_API_BASE_URL}/api/lookup/nin?op=level-4&nin=****`);
    
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
    
    console.log("NIN Verification Response:", {
      status: data.status,
      isValid: data.status === 200,
      ...(data.data ? {
        personalInfo: {
          firstname: data.data.firstname,
          middlename: data.data.middlename,
          surname: data.data.surname,
          gender: data.data.gender,
          educationallevel: data.data.educationallevel,
          dateofbirth: data.data.dateofbirth,
        }
      } : {}),
      ...(data.message ? { message: data.message } : {}),
      ...(data.code ? { code: data.code } : {})
    });
    
    // Check if the API returned success
    if (data.status === 200 && data.data) {
      return data.data; // Return the raw data from the API
    } else {
      throw new Error(data.message || 'NIN not found or invalid');
    }
  } catch (error) {
    console.error('NIN API lookup error:', error);
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

    // Try to lookup from external API first
    if (NIN_API_BASE_URL && NIN_API_KEY) {
      try {
        ninData = await lookupNINFromAPI(nin);
      } catch (error) {
        console.error('External NIN API failed, falling back to mock data:', error);
        
        // If external API fails, use mock data
        const mockData = mockNINData[nin];
        if (mockData) {
          ninData = {
            firstname: mockData.firstname,
            middlename: mockData.middlename,
            surname: mockData.surname,
            dateofbirth: mockData.dateofbirth,
            gender: mockData.gender,
            educationallevel: mockData.educationallevel,
          };
        } else {
          return res.status(404).json({ 
            error: 'NIN not found',
            status: 404,
            message: 'NIN not found and external API unavailable',
            details: error.message 
          });
        }
      }
    } else {
      // Use mock data if API credentials are not configured
      console.warn('NIN API credentials not configured, using mock data');
      const mockData = mockNINData[nin];
      if (mockData) {
        ninData = {
          firstname: mockData.firstname,
          middlename: mockData.middlename,
          surname: mockData.surname,
          dateofbirth: mockData.dateofbirth,
          gender: mockData.gender,
          educationallevel: mockData.educationallevel,
        };
      } else {
        return res.status(404).json({ 
          error: 'NIN not found in mock data',
          status: 404,
          message: 'NIN not found'
        });
      }
    }

    return res.status(200).json({
      success: true,
      status: 200,
      data: ninData,
    });
  } catch (error) {
    console.error('Error looking up NIN:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      status: 500,
      message: 'An error occurred while verifying the NIN'
    });
  }
});
