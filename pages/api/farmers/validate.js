import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/auth';

// GET /api/farmers/validate - Validate unique fields
export default authMiddleware(async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { nin, phone, email, bvn, excludeId } = req.query;

    if (!nin && !phone && !email && !bvn) {
      return res.status(400).json({ error: 'At least one field to validate is required' });
    }

    const whereConditions = [];
    
    if (nin) whereConditions.push({ nin });
    if (phone) whereConditions.push({ phone });
    if (email) whereConditions.push({ email });
    if (bvn) whereConditions.push({ bvn });

    const whereClause = {
      OR: whereConditions,
    };

    // Exclude current farmer when updating
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingFarmer = await prisma.farmer.findFirst({
      where: whereClause,
      select: {
        id: true,
        nin: true,
        phone: true,
        email: true,
        bvn: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existingFarmer) {
      const conflicts = [];
      if (nin && existingFarmer.nin === nin) conflicts.push('NIN');
      if (phone && existingFarmer.phone === phone) conflicts.push('Phone number');
      if (email && existingFarmer.email === email) conflicts.push('Email');
      if (bvn && existingFarmer.bvn === bvn) conflicts.push('BVN');

      return res.status(409).json({
        error: 'Validation failed',
        message: `A farmer is already registered with the following information: ${conflicts.join(', ')}`,
        conflicts,
        existingFarmer: {
          id: existingFarmer.id,
          name: `${existingFarmer.firstName} ${existingFarmer.lastName}`,
          nin: existingFarmer.nin,
          phone: existingFarmer.phone,
          email: existingFarmer.email,
        },
      });
    }

    return res.status(200).json({ 
      valid: true, 
      message: 'All fields are unique' 
    });
  } catch (error) {
    console.error('Error validating farmer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
