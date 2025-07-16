// Temporary NIN lookup endpoint with realistic test data
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nin } = req.query;

  if (!nin) {
    return res.status(400).json({ 
      error: 'NIN is required',
      message: 'Please provide a NIN parameter' 
    });
  }

  // Validate NIN format (11 digits)
  if (!/^\d{11}$/.test(nin)) {
    return res.status(400).json({ 
      error: 'Invalid NIN format',
      message: 'NIN must be exactly 11 digits' 
    });
  }

  // Return realistic test data that matches NIN API response format
  return res.status(200).json({
    success: true,
    data: {
      nin: nin,
      firstname: 'John',
      middlename: 'Doe', 
      surname: 'Smith',
      dateofbirth: '1985-03-15',
      gender: 'M',
      phone: '08012345678',
      email: 'john.smith@example.com',
      educationallevel: 'TERTIARY',
      religion: 'CHRISTIANITY',
      maritalstatus: 'MARRIED',
      nativeLga: 'Abuja Municipal Area Council',
      state: 'Federal Capital Territory',
      residentialaddress: '123 Independence Avenue, Abuja',
      photo: null // Base64 photo would go here in real implementation
    },
    message: 'NIN lookup successful (test data)'
  });
}
