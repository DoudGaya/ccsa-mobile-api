export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { nin } = req.query;

  if (!nin) {
    return res.status(400).json({ 
      success: false, 
      message: 'NIN is required',
      status: 400
    });
  }

  if (nin.length !== 11) {
    return res.status(400).json({ 
      success: false, 
      message: 'nin must be length = 11',
      status: 718,
      code: 718
    });
  }

  // Mock data that matches the real API structure (only essential fields)
  const mockNINData = {
    '12345678901': {
      firstname: 'John',
      middlename: 'Doe',
      surname: 'Smith',
      dateofbirth: '15-01-1990',
      gender: 'M',
      birthstate: 'LAGOS',
      birthlga: 'LAGOS ISLAND',
      maritalstatus: 'SINGLE',
      emplymentstatus: 'EMPLOYED',
      // Additional fields for reference (not used in mapping)
      educationallevel: 'TERTIARY',
      telephoneno: '08012345678',
      msisdn: '08012345678',
      email: 'john.smith@email.com',
      residence_state: 'LAGOS',
      residence_lga: 'LAGOS ISLAND',
      residence_wardname: 'AGARAWU',
      residence_address: '123 Main Street, Lagos Island',
      'residence-address1': '123 Main Street, Lagos Island',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      photo: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    },
    '98765432109': {
      firstname: 'Jane',
      middlename: 'Mary',
      surname: 'Johnson',
      dateofbirth: '20-05-1985',
      gender: 'F',
      birthstate: 'ABUJA',
      birthlga: 'ABUJA MUNICIPAL',
      maritalstatus: 'MARRIED',
      emplymentstatus: 'SELF_EMPLOYED',
      // Additional fields for reference (not used in mapping)
      educationallevel: 'SECONDARY',
      telephoneno: '08098765432',
      msisdn: '08098765432',
      email: 'jane.johnson@email.com',
      residence_state: 'ABUJA',
      residence_lga: 'ABUJA MUNICIPAL',
      residence_wardname: 'GARKI',
      residence_address: '456 Federal Avenue, Garki, Abuja',
      'residence-address1': '456 Federal Avenue, Garki, Abuja',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      photo: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    }
  };

  const ninData = mockNINData[nin];

  if (ninData) {
    return res.status(200).json({
      success: true,
      status: 200,
      message: 'NIN verified successfully',
      data: ninData
    });
  } else {
    return res.status(404).json({
      success: false,
      status: 404,
      message: 'NIN not found'
    });
  }
}
