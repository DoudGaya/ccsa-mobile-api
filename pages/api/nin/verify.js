import ProductionLogger from '../../../lib/productionLogger'

// NIN API configuration
const NIN_API_BASE_URL = process.env.NIN_API_BASE_URL
const NIN_API_KEY = process.env.NIN_API_KEY

// Function to lookup NIN from external API
async function lookupNINFromAPI(nin) {
  try {
    const url = `${NIN_API_BASE_URL}/api/lookup/nin?op=level-4&nin=${nin}`
    
    ProductionLogger.debug(`Making NIN API request for NIN: ****${nin.slice(-4)}`)
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": NIN_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    ProductionLogger.debug("NIN Verification Response status:", data.status)
    
    // Check if the API returned success
    if (data.status === 200 && data.data) {
      return {
        isValid: true,
        firstName: data.data.firstname || data.data.firstName,
        middleName: data.data.middlename || data.data.middleName,
        lastName: data.data.lastname || data.data.lastName,
        dateOfBirth: data.data.birthdate || data.data.dateOfBirth,
        gender: data.data.gender?.toUpperCase() || 'MALE',
        maritalStatus: data.data.maritalstatus || data.data.maritalStatus,
        phone: data.data.telephoneno || data.data.phone,
        email: data.data.email,
        photo: data.data.photo,
        title: data.data.title,
        religion: data.data.religion,
        profession: data.data.profession,
        educationlevel: data.data.educationlevel,
        nin: nin
      }
    } else {
      throw new Error(data.message || 'NIN not found or invalid')
    }
  } catch (error) {
    ProductionLogger.error('NIN API lookup error:', error.message)
    throw error
  }
}

// POST /api/nin/verify - Verify NIN and return user information
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { nin } = req.body

    if (!nin) {
      return res.status(400).json({ 
        error: 'NIN is required',
        isValid: false
      })
    }

    // Validate NIN format - must be exactly 11 digits
    if (nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return res.status(400).json({ 
        error: 'Invalid NIN format. NIN must be exactly 11 digits.',
        isValid: false,
        status: 718,
        code: 718,
        message: "nin must be length = 11 and contain only numbers"
      })
    }

    let ninData

    // Try to lookup from external API
    if (NIN_API_BASE_URL && NIN_API_KEY) {
      try {
        ninData = await lookupNINFromAPI(nin)
        
        return res.status(200).json({
          success: true,
          status: 200,
          ...ninData
        })
      } catch (error) {
        ProductionLogger.error('External NIN API failed:', error.message)
        
        // Return a user-friendly error but still indicate format is valid
        return res.status(422).json({ 
          error: 'Unable to verify NIN with external service',
          isValid: true, // Format is valid, just couldn't verify
          status: 422,
          message: 'NIN format is correct but verification service is unavailable',
          suggestion: 'You can proceed with manual entry of details'
        })
      }
    } else {
      ProductionLogger.warn('NIN API credentials not configured')
      
      // If no API is configured, just validate format
      return res.status(200).json({
        success: true,
        isValid: true,
        status: 200,
        message: 'NIN format is valid',
        note: 'Automatic verification is not available. Please enter details manually.'
      })
    }
  } catch (error) {
    ProductionLogger.error('Error in NIN verify handler:', error.message)
    return res.status(500).json({ 
      error: 'Internal server error',
      isValid: false,
      status: 500,
      message: 'An error occurred while verifying the NIN'
    })
  }
}
