import prisma from '../../../lib/prisma';
import { certificateSchema } from '../../../lib/validation';
import { authMiddleware } from '../../../lib/auth';

// GET /api/certificates - Get all certificates
// POST /api/certificates - Create new certificate
export default authMiddleware(async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getCertificates(req, res);
    case 'POST':
      return await createCertificate(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
});

async function getCertificates(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      farmerId, 
      status = 'active' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      status,
      ...(farmerId && { farmerId }),
    };

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where: whereClause,
        include: {
          farmer: {
            select: {
              id: true,
              nin: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.certificate.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createCertificate(req, res) {
  try {
    const { farmerId, expiryDate } = req.body;

    // Validate request data
    const validatedData = certificateSchema.parse({ farmerId, expiryDate });

    // Check if farmer exists
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Generate unique certificate ID
    const certificateId = `CCSA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create QR code data
    const qrData = JSON.stringify({
      certificateId,
      farmerId,
      nin: farmer.nin,
      name: `${farmer.firstName} ${farmer.lastName}`,
      phone: farmer.phone,
      issuedDate: new Date().toISOString(),
    });

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        farmerId,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        qrCode: qrData,
      },
      include: {
        farmer: {
          select: {
            id: true,
            nin: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(certificate);
  } catch (error) {
    console.error('Error creating certificate:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
