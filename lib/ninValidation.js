// NIN validation service for production use
import fetch from 'node-fetch';

// Production NIN validation using real API
export async function validateNIN(nin) {
  try {
    console.log('🔍 Starting NIN validation for production...');
    
    // Validate NIN format (11 digits)
    if (!nin || !/^\d{11}$/.test(nin)) {
      return {
        success: false,
        message: 'NIN must be 11 digits',
        error: 'INVALID_FORMAT'
      };
    }

    // Check for required environment variables
    const ninApiUrl = process.env.NIN_API_BASE_URL;
    const ninApiKey = process.env.NIN_API_KEY;
    
    if (!ninApiUrl) {
      console.error('❌ NIN_API_BASE_URL environment variable not set');
      return {
        success: false,
        message: 'NIN validation service not configured',
        error: 'MISSING_CONFIG'
      };
    }

    console.log('🌐 Making NIN API request to:', ninApiUrl);

    // Real NIN validation using production API
    const response = await fetch(`${ninApiUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ninApiKey ? `Bearer ${ninApiKey}` : undefined,
        'User-Agent': 'CCSA-Mobile-API/1.0.0'
      },
      body: JSON.stringify({ 
        nin,
        source: 'ccsa-mobile-api',
        timestamp: new Date().toISOString()
      }),
      timeout: 30000 // 30 second timeout
    });

    console.log('📊 NIN API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ NIN API error:', response.status, errorData);
      
      // Handle specific API error codes
      if (response.status === 404) {
        return {
          success: false,
          message: 'NIN not found in national database',
          error: 'NIN_NOT_FOUND'
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'NIN service authentication failed',
          error: 'AUTH_FAILED'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          message: 'Too many requests. Please try again later',
          error: 'RATE_LIMITED'
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          message: 'NIN validation service temporarily unavailable',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
      
      throw new Error(`NIN API responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📋 NIN API response received');
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'NIN validation failed',
        error: result.error || 'VALIDATION_FAILED'
      };
    }

    // Validate the response data structure
    if (!result.data || typeof result.data !== 'object') {
      console.error('❌ Invalid NIN API response structure:', result);
      return {
        success: false,
        message: 'Invalid response from NIN service',
        error: 'INVALID_RESPONSE'
      };
    }

    // Map and validate the response data
    const ninData = {
      nin,
      firstName: result.data.firstname || result.data.firstName || '',
      middleName: result.data.middlename || result.data.middleName || '',
      lastName: result.data.surname || result.data.lastName || '',
      dateOfBirth: formatDate(result.data.dateofbirth || result.data.dateOfBirth),
      gender: normalizeGender(result.data.gender),
      birthState: result.data.birthstate || result.data.birthState || '',
      birthLGA: result.data.birthlga || result.data.birthLGA || '',
      photo: result.data.photo || null,
      maritalStatus: result.data.maritalstatus || result.data.maritalStatus || '',
      employmentStatus: result.data.emplymentstatus || result.data.employmentStatus || '',
      verified: true,
      validationDate: new Date().toISOString(),
      source: 'production_api'
    };

    // Validate required fields are present
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !ninData[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required fields in NIN response:', missingFields);
      return {
        success: false,
        message: `Incomplete NIN data: missing ${missingFields.join(', ')}`,
        error: 'INCOMPLETE_DATA'
      };
    }

    console.log('✅ NIN validation successful');
    return {
      success: true,
      data: ninData,
      source: 'production_api'
    };

  } catch (error) {
    console.error('❌ Error validating NIN:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Cannot connect to NIN validation service',
        error: 'NETWORK_ERROR'
      };
    }
    
    if (error.name === 'TimeoutError') {
      return {
        success: false,
        message: 'NIN validation request timed out',
        error: 'TIMEOUT'
      };
    }
    
    return {
      success: false,
      message: 'NIN validation service error',
      error: 'SERVICE_ERROR',
      details: error.message
    };
  }
}

// Validate BVN (Bank Verification Number) for production
export async function validateBVN(bvn) {
  try {
    console.log('🔍 Starting BVN validation for production...');
    
    // Validate BVN format (11 digits)
    if (!bvn || !/^\d{11}$/.test(bvn)) {
      return {
        success: false,
        message: 'BVN must be 11 digits',
        error: 'INVALID_FORMAT'
      };
    }

    const bvnApiUrl = process.env.BVN_API_URL;
    const bvnApiKey = process.env.BVN_API_KEY;
    
    if (!bvnApiUrl) {
      console.error('❌ BVN_API_URL environment variable not set');
      return {
        success: false,
        message: 'BVN validation service not configured',
        error: 'MISSING_CONFIG'
      };
    }

    console.log('🌐 Making BVN API request...');

    const response = await fetch(`${bvnApiUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': bvnApiKey ? `Bearer ${bvnApiKey}` : undefined,
        'User-Agent': 'CCSA-Mobile-API/1.0.0'
      },
      body: JSON.stringify({ 
        bvn,
        source: 'ccsa-mobile-api',
        timestamp: new Date().toISOString()
      }),
      timeout: 30000
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ BVN API error:', response.status, errorData);
      
      if (response.status === 404) {
        return {
          success: false,
          message: 'BVN not found',
          error: 'BVN_NOT_FOUND'
        };
      }
      
      throw new Error(`BVN API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'BVN validation failed',
        error: result.error || 'VALIDATION_FAILED'
      };
    }

    console.log('✅ BVN validation successful');
    return {
      success: true,
      data: {
        bvn,
        valid: true,
        accountExists: result.data?.accountExists || true,
        bankName: result.data?.bankName || null,
        accountName: result.data?.accountName || null,
        verified: true,
        validationDate: new Date().toISOString()
      },
      source: 'production_api'
    };

  } catch (error) {
    console.error('❌ Error validating BVN:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Cannot connect to BVN validation service',
        error: 'NETWORK_ERROR'
      };
    }
    
    return {
      success: false,
      message: 'BVN validation service error',
      error: 'SERVICE_ERROR',
      details: error.message
    };
  }
}

// Phone number validation for Nigerian numbers
export function validatePhoneNumber(phone) {
  if (!phone) {
    return {
      success: false,
      message: 'Phone number is required'
    };
  }

  // Nigerian phone number patterns
  const patterns = [
    /^(\+234|234)?([789][01]\d{8})$/, // MTN, Airtel, Glo, 9mobile
    /^(\+234|234)?(70[1-9]\d{7})$/, // Additional MTN numbers
    /^(\+234|234)?(81[0-9]\d{7})$/, // Additional Airtel numbers
  ];

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  for (const pattern of patterns) {
    const match = cleanPhone.match(pattern);
    if (match) {
      // Extract the main number part
      const mainNumber = match[2] || match[1];
      const normalized = '+234' + mainNumber;
      
      return {
        success: true,
        data: {
          original: phone,
          normalized,
          isValid: true,
          carrier: getCarrier(mainNumber),
          type: 'mobile'
        }
      };
    }
  }
  
  return {
    success: false,
    message: 'Invalid Nigerian phone number format. Use format: +234XXXXXXXXXX or 0XXXXXXXXXXX'
  };
}

// Email validation with enhanced checks
export function validateEmail(email) {
  if (!email) {
    return {
      success: false,
      message: 'Email address is required'
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = email.trim().toLowerCase();
  
  if (!emailRegex.test(cleanEmail)) {
    return {
      success: false,
      message: 'Invalid email format'
    };
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = cleanEmail.split('@')[1];
  
  return {
    success: true,
    data: {
      email: cleanEmail,
      isValid: true,
      domain,
      isCommonDomain: commonDomains.includes(domain)
    }
  };
}

// Helper function to format dates consistently
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    // Handle dd-mm-yyyy format
    const datePattern = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
    const match = dateString.match(datePattern);
    
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try to parse as-is
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return '';
  } catch (error) {
    console.warn('Could not parse date:', dateString);
    return '';
  }
}

// Helper function to normalize gender values
function normalizeGender(gender) {
  if (!gender) return '';
  
  const g = gender.toString().toLowerCase();
  if (g.startsWith('m')) return 'Male';
  if (g.startsWith('f')) return 'Female';
  return gender;
}

// Helper function to determine phone carrier
function getCarrier(phoneNumber) {
  const number = phoneNumber.replace(/^\+?234/, '');
  const prefix = number.substring(0, 3);
  
  const carriers = {
    '803': 'MTN', '806': 'MTN', '813': 'MTN', '814': 'MTN', '816': 'MTN',
    '903': 'MTN', '906': 'MTN', '913': 'MTN', '916': 'MTN',
    '701': 'Airtel', '708': 'Airtel', '802': 'Airtel', '808': 'Airtel', '812': 'Airtel',
    '901': 'Airtel', '902': 'Airtel', '907': 'Airtel', '911': 'Airtel',
    '805': 'Glo', '807': 'Glo', '811': 'Glo', '815': 'Glo', '905': 'Glo',
    '809': '9mobile', '817': '9mobile', '818': '9mobile', '908': '9mobile', '909': '9mobile'
  };
  
  return carriers[prefix] || 'Unknown';
}

export default {
  validateNIN,
  validateBVN,
  validatePhoneNumber,
  validateEmail
};
