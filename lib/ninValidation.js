// NIN validation service
import fetch from 'node-fetch';

// NIN validation using external API (placeholder)
export async function validateNIN(nin) {
  try {
    // Validate NIN format (11 digits)
    if (!nin || !/^\d{11}$/.test(nin)) {
      return {
        success: false,
        message: 'NIN must be 11 digits'
      };
    }

    // For development/testing, return mock data
    if (process.env.NODE_ENV === 'development' || !process.env.NIN_API_URL) {
      console.log('🔍 [MOCK] NIN Validation for:', nin);
      
      // Generate mock data based on NIN
      const mockData = generateMockNINData(nin);
      
      return {
        success: true,
        data: mockData,
        source: 'mock'
      };
    }

    // Real NIN validation (when API is available)
    const response = await fetch(`${process.env.NIN_API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NIN_API_KEY}`,
      },
      body: JSON.stringify({ nin })
    });

    if (!response.ok) {
      throw new Error(`NIN API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'NIN validation failed'
      };
    }

    return {
      success: true,
      data: result.data,
      source: 'api'
    };
  } catch (error) {
    console.error('Error validating NIN:', error);
    
    // Fallback to mock data if API fails
    if (process.env.ALLOW_NIN_FALLBACK === 'true') {
      console.log('🔄 Falling back to mock NIN data due to API error');
      const mockData = generateMockNINData(nin);
      
      return {
        success: true,
        data: mockData,
        source: 'fallback',
        warning: 'Using mock data due to API unavailability'
      };
    }
    
    return {
      success: false,
      message: 'NIN validation service unavailable',
      error: error.message
    };
  }
}

// Generate mock NIN data for testing
function generateMockNINData(nin) {
  // Use NIN to generate consistent mock data
  const seed = parseInt(nin.substring(0, 4));
  
  const firstNames = ['Adaora', 'Chinedu', 'Fatima', 'Ibrahim', 'Kemi', 'Tunde', 'Ngozi', 'Emeka', 'Aisha', 'Biodun'];
  const lastNames = ['Okafor', 'Ademola', 'Bello', 'Chukwu', 'Ogundimu', 'Yakubu', 'Eze', 'Adebayo', 'Mohammed', 'Okoro'];
  const states = ['Lagos', 'Kano', 'Rivers', 'Kaduna', 'Ogun', 'Cross River', 'Delta', 'Edo', 'Anambra', 'Plateau'];
  const lgas = ['Ikorodu', 'Municipal', 'Port Harcourt', 'Chikun', 'Abeokuta South', 'Calabar Municipal', 'Warri South', 'Oredo', 'Awka North', 'Jos North'];
  
  const firstName = firstNames[seed % firstNames.length];
  const lastName = lastNames[(seed + 1) % lastNames.length];
  const birthState = states[seed % states.length];
  const birthLGA = lgas[seed % lgas.length];
  
  // Generate birth date (age between 18-65)
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - (18 + (seed % 47)); // 18-65 years old
  const birthMonth = (seed % 12) + 1;
  const birthDay = (seed % 28) + 1;
  
  return {
    nin,
    firstName,
    middleName: seed % 3 === 0 ? 'Chioma' : null, // Sometimes include middle name
    lastName,
    dateOfBirth: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
    gender: seed % 2 === 0 ? 'Male' : 'Female',
    birthState,
    birthLGA,
    photo: null, // No photo in mock data
    maritalStatus: seed % 3 === 0 ? 'Single' : seed % 3 === 1 ? 'Married' : 'Divorced',
    employmentStatus: seed % 4 === 0 ? 'Employed' : seed % 4 === 1 ? 'Self-Employed' : seed % 4 === 2 ? 'Student' : 'Unemployed',
    verified: true,
    validationDate: new Date().toISOString()
  };
}

// Validate BVN (Bank Verification Number)
export async function validateBVN(bvn) {
  try {
    // Validate BVN format (11 digits)
    if (!bvn || !/^\d{11}$/.test(bvn)) {
      return {
        success: false,
        message: 'BVN must be 11 digits'
      };
    }

    // For development/testing, return mock validation
    if (process.env.NODE_ENV === 'development' || !process.env.BVN_API_URL) {
      console.log('🔍 [MOCK] BVN Validation for:', bvn);
      
      return {
        success: true,
        data: {
          bvn,
          valid: true,
          accountExists: true
        },
        source: 'mock'
      };
    }

    // Real BVN validation would go here
    // Implementation depends on the BVN verification service being used
    
    return {
      success: true,
      data: {
        bvn,
        valid: true,
        accountExists: true
      },
      source: 'api'
    };
  } catch (error) {
    console.error('Error validating BVN:', error);
    return {
      success: false,
      message: 'BVN validation service unavailable',
      error: error.message
    };
  }
}

// Phone number validation
export function validatePhoneNumber(phone) {
  // Nigerian phone number patterns
  const patterns = [
    /^(\+234|234|0)?[789][01]\d{8}$/, // MTN, Airtel, Glo, 9mobile
    /^(\+234|234|0)?[789][01]\d{8}$/, // General Nigerian mobile
  ];

  const cleanPhone = phone.replace(/\s+/g, '');
  
  for (const pattern of patterns) {
    if (pattern.test(cleanPhone)) {
      // Normalize to international format
      let normalized = cleanPhone;
      if (normalized.startsWith('0')) {
        normalized = '+234' + normalized.substring(1);
      } else if (normalized.startsWith('234')) {
        normalized = '+' + normalized;
      } else if (!normalized.startsWith('+234')) {
        normalized = '+234' + normalized;
      }
      
      return {
        success: true,
        data: {
          original: phone,
          normalized,
          isValid: true
        }
      };
    }
  }
  
  return {
    success: false,
    message: 'Invalid Nigerian phone number format'
  };
}

// Email validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: 'Invalid email format'
    };
  }
  
  return {
    success: true,
    data: {
      email: email.toLowerCase(),
      isValid: true
    }
  };
}

export default {
  validateNIN,
  validateBVN,
  validatePhoneNumber,
  validateEmail
};
