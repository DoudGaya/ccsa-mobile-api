import { PrismaClient } from '@prisma/client';
import ProductionLogger from '../../../../lib/productionLogger'

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Certificate ID is required' });
  }

  try {
    ProductionLogger.info(`Certificate verification requested for ID: ${id}`);

    // Find certificate by certificate ID
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: id },
      include: {
        farmer: {
          include: {
            farms: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!certificate) {
      ProductionLogger.warn(`Certificate not found: ${id}`);
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check if certificate is expired
    if (certificate.expiryDate && new Date() > new Date(certificate.expiryDate)) {
      ProductionLogger.warn(`Expired certificate accessed: ${id}`);
      return res.status(410).json({ error: 'Certificate has expired' });
    }

    // Prepare response data
    const responseData = {
      certificateId: certificate.certificateId,
      issuedDate: certificate.issuedDate,
      expiryDate: certificate.expiryDate,
      farmer: {
        id: certificate.farmer.id,
        firstName: certificate.farmer.firstName,
        middleName: certificate.farmer.middleName,
        lastName: certificate.farmer.lastName,
        phone: certificate.farmer.phone,
        email: certificate.farmer.email,
        gender: certificate.farmer.gender,
        state: certificate.farmer.state,
        lga: certificate.farmer.lga,
        ward: certificate.farmer.ward,
        address: certificate.farmer.address,
        latitude: certificate.farmer.latitude,
        longitude: certificate.farmer.longitude,
        registrationDate: certificate.farmer.registrationDate,
        status: certificate.farmer.status
      },
      farm: certificate.farmer.farms[0] ? {
        farmSize: certificate.farmer.farms[0].farmSize,
        primaryCrop: certificate.farmer.farms[0].primaryCrop,
        secondaryCrop: certificate.farmer.farms[0].secondaryCrop,
        farmOwnership: certificate.farmer.farms[0].farmOwnership,
        farmState: certificate.farmer.farms[0].farmState,
        farmLocalGovernment: certificate.farmer.farms[0].farmLocalGovernment,
        farmingSeason: certificate.farmer.farms[0].farmingSeason,
        farmWard: certificate.farmer.farms[0].farmWard,
        farmingExperience: certificate.farmer.farms[0].farmingExperience,
        farmLatitude: certificate.farmer.farms[0].farmLatitude,
        farmLongitude: certificate.farmer.farms[0].farmLongitude,
        soilType: certificate.farmer.farms[0].soilType,
        soilFertility: certificate.farmer.farms[0].soilFertility,
        year: certificate.farmer.farms[0].year,
        yieldSeason: certificate.farmer.farms[0].yieldSeason,
        quantity: certificate.farmer.farms[0].quantity
      } : null
    };

    ProductionLogger.info(`Certificate verification successful for: ${certificate.farmer.firstName} ${certificate.farmer.lastName}`);

    res.status(200).json(responseData);

  } catch (error) {
    ProductionLogger.error('Certificate verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
