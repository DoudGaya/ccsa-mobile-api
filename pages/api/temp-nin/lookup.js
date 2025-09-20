import { validateNIN } from '../../../lib/ninValidation';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { nin } = req.query;

    if (!nin) {
      return res.status(400).json({
        success: false,
        error: 'NIN parameter is required'
      });
    }

    console.log('🔍 Temp NIN lookup request for:', nin.slice(-4));

    // Validate NIN using the production validation service
    const result = await validateNIN(nin);

    if (!result.success) {
      console.log('❌ NIN validation failed:', result.message);
      return res.status(400).json({
        success: false,
        error: result.message || 'NIN validation failed',
        code: result.error
      });
    }

    console.log('✅ NIN validation successful');

    // Return the validated NIN data
    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'NIN validation successful'
    });

  } catch (error) {
    console.error('❌ Error in temp NIN lookup:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
