import prisma from '../../../lib/prisma';
import { farmerSchema } from '../../../lib/validation';
import { authMiddleware } from '../../../lib/auth';

// GET /api/farmers/[id] - Get farmer by ID
// PUT /api/farmers/[id] - Update farmer
// DELETE /api/farmers/[id] - Delete farmer
export default authMiddleware(async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return await getFarmer(req, res, id);
    case 'PUT':
      return await updateFarmer(req, res, id);
    case 'DELETE':
      return await deleteFarmer(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
});

async function getFarmer(req, res, id) {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id },
      include: {
        referees: true,
        certificates: true,
        agent: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    return res.status(200).json(farmer);
  } catch (error) {
    console.error('Error fetching farmer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateFarmer(req, res, id) {
  try {
    const { referees, ...farmerData } = req.body;

    // Check if farmer exists
    const existingFarmer = await prisma.farmer.findUnique({
      where: { id },
      include: { referees: true },
    });

    if (!existingFarmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Validate farmer data
    const validatedFarmer = farmerSchema.parse(farmerData);

    // Check for unique constraints (excluding current farmer)
    const duplicateFarmer = await prisma.farmer.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { nin: validatedFarmer.nin },
              { phone: validatedFarmer.phone },
              ...(validatedFarmer.email ? [{ email: validatedFarmer.email }] : []),
              ...(validatedFarmer.bvn ? [{ bvn: validatedFarmer.bvn }] : []),
            ],
          },
        ],
      },
    });

    if (duplicateFarmer) {
      return res.status(409).json({ 
        error: 'Another farmer already exists with the same NIN, phone, email, or BVN' 
      });
    }

    // Update farmer
    const farmer = await prisma.farmer.update({
      where: { id },
      data: {
        ...validatedFarmer,
        referees: {
          deleteMany: {},
          create: referees?.map(referee => ({
            firstName: referee.firstName,
            lastName: referee.lastName,
            phone: referee.phone,
            relationship: referee.relationship,
          })) || [],
        },
      },
      include: {
        referees: true,
        certificates: true,
        agent: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return res.status(200).json(farmer);
  } catch (error) {
    console.error('Error updating farmer:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteFarmer(req, res, id) {
  try {
    // Check if farmer exists
    const farmer = await prisma.farmer.findUnique({
      where: { id },
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Delete farmer (referees and certificates will be deleted due to cascade)
    await prisma.farmer.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Farmer deleted successfully' });
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
