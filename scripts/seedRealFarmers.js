const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Real Nigerian farmer data for seeding
const realFarmerData = [
  {
    nin: "12345678901",
    firstName: "Abdullahi",
    lastName: "Mohammed",
    middleName: "Usman",
    gender: "Male",
    state: "Kaduna",
    lga: "Zaria",
    ward: "Tudun Wada",
    phone: "08012345678",
    email: "abdullahi.mohammed@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "Plot 15, Tudun Wada, Zaria",
    latitude: 11.0804,
    longitude: 7.7056,
    bankName: "First Bank of Nigeria",
    accountNumber: "3012345678",
    accountName: "Abdullahi Mohammed Usman",
    bvn: "12345678901",
    status: "active"
  },
  {
    nin: "23456789012",
    firstName: "Amina",
    lastName: "Ibrahim",
    middleName: "Khadija",
    gender: "Female",
    state: "Kano",
    lga: "Kano Municipal",
    ward: "Fagge",
    phone: "08023456789",
    email: "amina.ibrahim@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "No 42, Fagge Quarters, Kano",
    latitude: 12.0000,
    longitude: 8.5167,
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "Amina Ibrahim Khadija",
    bvn: "23456789012",
    status: "active"
  },
  {
    nin: "34567890123",
    firstName: "Emeka",
    lastName: "Okafor",
    middleName: "Chukwu",
    gender: "Male",
    state: "Anambra",
    lga: "Awka North",
    ward: "Achalla",
    phone: "08034567890",
    email: "emeka.okafor@example.com",
    maritalStatus: "Single",
    employmentStatus: "Farmer",
    address: "15 New Haven Road, Achalla",
    latitude: 6.2333,
    longitude: 7.0667,
    bankName: "Zenith Bank",
    accountNumber: "2345678901",
    accountName: "Emeka Chukwu Okafor",
    bvn: "34567890123",
    status: "active"
  },
  {
    nin: "45678901234",
    firstName: "Fatima",
    lastName: "Aliyu",
    middleName: "Hauwa",
    gender: "Female",
    state: "Sokoto",
    lga: "Sokoto North",
    ward: "Runjin Sambo",
    phone: "08045678901",
    email: "fatima.aliyu@example.com",
    maritalStatus: "Widowed",
    employmentStatus: "Farmer",
    address: "Runjin Sambo Area, Sokoto",
    latitude: 13.0622,
    longitude: 5.2433,
    bankName: "GTBank",
    accountNumber: "0234567890",
    accountName: "Fatima Hauwa Aliyu",
    bvn: "45678901234",
    status: "active"
  },
  {
    nin: "56789012345",
    firstName: "Yusuf",
    lastName: "Adamu",
    middleName: "Garba",
    gender: "Male",
    state: "Niger",
    lga: "Minna",
    ward: "Chanchaga",
    phone: "08056789012",
    email: "yusuf.adamu@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "Chanchaga Layout, Minna",
    latitude: 9.6140,
    longitude: 6.5560,
    bankName: "UBA",
    accountNumber: "1023456789",
    accountName: "Yusuf Garba Adamu",
    bvn: "56789012345",
    status: "active"
  },
  {
    nin: "67890123456",
    firstName: "Kemi",
    lastName: "Adeleke",
    middleName: "Folake",
    gender: "Female",
    state: "Osun",
    lga: "Osogbo",
    ward: "Oke-Fia",
    phone: "08067890123",
    email: "kemi.adeleke@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "Oke-Fia, Osogbo",
    latitude: 7.7667,
    longitude: 4.5667,
    bankName: "Fidelity Bank",
    accountNumber: "6012345678",
    accountName: "Kemi Folake Adeleke",
    bvn: "67890123456",
    status: "active"
  },
  {
    nin: "78901234567",
    firstName: "Musa",
    lastName: "Bello",
    middleName: "Sani",
    gender: "Male",
    state: "Kebbi",
    lga: "Birnin Kebbi",
    ward: "Gwadangaji",
    phone: "08078901234",
    email: "musa.bello@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "Gwadangaji Area, Birnin Kebbi",
    latitude: 12.4500,
    longitude: 4.2000,
    bankName: "Sterling Bank",
    accountNumber: "0345678901",
    accountName: "Musa Sani Bello",
    bvn: "78901234567",
    status: "active"
  },
  {
    nin: "89012345678",
    firstName: "Blessing",
    lastName: "Okoro",
    middleName: "Chioma",
    gender: "Female",
    state: "Imo",
    lga: "Owerri Municipal",
    ward: "Ikenegbu",
    phone: "08089012345",
    email: "blessing.okoro@example.com",
    maritalStatus: "Single",
    employmentStatus: "Farmer",
    address: "World Bank Housing Estate, Owerri",
    latitude: 5.4833,
    longitude: 7.0333,
    bankName: "Stanbic IBTC",
    accountNumber: "0123456789",
    accountName: "Blessing Chioma Okoro",
    bvn: "89012345678",
    status: "active"
  },
  {
    nin: "90123456789",
    firstName: "Ibrahim",
    lastName: "Yakubu",
    middleName: "Salisu",
    gender: "Male",
    state: "Bauchi",
    lga: "Bauchi",
    ward: "Kandahar",
    phone: "08090123456",
    email: "ibrahim.yakubu@example.com",
    maritalStatus: "Married",
    employmentStatus: "Farmer",
    address: "Kandahar Ward, Bauchi",
    latitude: 10.3158,
    longitude: 9.8442,
    bankName: "Union Bank",
    accountNumber: "0012345678",
    accountName: "Ibrahim Salisu Yakubu",
    bvn: "90123456789",
    status: "active"
  },
  {
    nin: "01234567890",
    firstName: "Adunni",
    lastName: "Adebayo",
    middleName: "Omolara",
    gender: "Female",
    state: "Oyo",
    lga: "Ibadan North",
    ward: "Bodija",
    phone: "08001234567",
    email: "adunni.adebayo@example.com",
    maritalStatus: "Divorced",
    employmentStatus: "Farmer",
    address: "Bodija Estate, Ibadan",
    latitude: 7.4000,
    longitude: 3.9000,
    bankName: "Ecobank",
    accountNumber: "2765432109",
    accountName: "Adunni Omolara Adebayo",
    bvn: "01234567890",
    status: "active"
  }
];

// Real farm data corresponding to the farmers
const realFarmData = [
  {
    farmSize: 2.5,
    primaryCrop: "Maize",
    secondaryCrop: "Sorghum",
    farmOwnership: "OWNED",
    farmState: "Kaduna",
    farmLocalGovernment: "Zaria",
    farmingSeason: "WET",
    farmWard: "Tudun Wada",
    farmingExperience: 15,
    farmLatitude: 11.0804,
    farmLongitude: 7.7056,
    soilType: "LOAMY",
    soilFertility: "HIGH",
    year: 2024,
    yieldSeason: "FIRST_SEASON",
    quantity: 3500
  },
  {
    farmSize: 1.8,
    primaryCrop: "Rice",
    secondaryCrop: "Beans",
    farmOwnership: "RENTED",
    farmState: "Kano",
    farmLocalGovernment: "Kano Municipal",
    farmingSeason: "WET",
    farmWard: "Fagge",
    farmingExperience: 8,
    farmLatitude: 12.0000,
    farmLongitude: 8.5167,
    soilType: "CLAY",
    soilFertility: "MEDIUM",
    year: 2024,
    yieldSeason: "FIRST_SEASON",
    quantity: 2800
  },
  {
    farmSize: 3.2,
    primaryCrop: "Cassava",
    secondaryCrop: "Yam",
    farmOwnership: "FAMILY",
    farmState: "Anambra",
    farmLocalGovernment: "Awka North",
    farmingSeason: "YEAR_ROUND",
    farmWard: "Achalla",
    farmingExperience: 12,
    farmLatitude: 6.2333,
    farmLongitude: 7.0667,
    soilType: "SANDY",
    soilFertility: "MEDIUM",
    year: 2024,
    yieldSeason: "YEAR_ROUND",
    quantity: 4200
  },
  {
    farmSize: 4.1,
    primaryCrop: "Millet",
    secondaryCrop: "Groundnut",
    farmOwnership: "OWNED",
    farmState: "Sokoto",
    farmLocalGovernment: "Sokoto North",
    farmingSeason: "DRY",
    farmWard: "Runjin Sambo",
    farmingExperience: 20,
    farmLatitude: 13.0622,
    farmLongitude: 5.2433,
    soilType: "SANDY",
    soilFertility: "LOW",
    year: 2024,
    yieldSeason: "DRY_SEASON",
    quantity: 2100
  },
  {
    farmSize: 2.7,
    primaryCrop: "Rice",
    secondaryCrop: "Maize",
    farmOwnership: "LEASED",
    farmState: "Niger",
    farmLocalGovernment: "Minna",
    farmingSeason: "WET",
    farmWard: "Chanchaga",
    farmingExperience: 10,
    farmLatitude: 9.6140,
    farmLongitude: 6.5560,
    soilType: "LOAMY",
    soilFertility: "HIGH",
    year: 2024,
    yieldSeason: "FIRST_SEASON",
    quantity: 3200
  },
  {
    farmSize: 1.5,
    primaryCrop: "Cocoa",
    secondaryCrop: "Plantain",
    farmOwnership: "OWNED",
    farmState: "Osun",
    farmLocalGovernment: "Osogbo",
    farmingSeason: "YEAR_ROUND",
    farmWard: "Oke-Fia",
    farmingExperience: 18,
    farmLatitude: 7.7667,
    farmLongitude: 4.5667,
    soilType: "LOAMY",
    soilFertility: "HIGH",
    year: 2024,
    yieldSeason: "YEAR_ROUND",
    quantity: 1800
  },
  {
    farmSize: 5.3,
    primaryCrop: "Rice",
    secondaryCrop: "Sorghum",
    farmOwnership: "COMMUNITY",
    farmState: "Kebbi",
    farmLocalGovernment: "Birnin Kebbi",
    farmingSeason: "WET",
    farmWard: "Gwadangaji",
    farmingExperience: 25,
    farmLatitude: 12.4500,
    farmLongitude: 4.2000,
    soilType: "CLAY",
    soilFertility: "MEDIUM",
    year: 2024,
    yieldSeason: "FIRST_SEASON",
    quantity: 4500
  },
  {
    farmSize: 2.1,
    primaryCrop: "Yam",
    secondaryCrop: "Cassava",
    farmOwnership: "FAMILY",
    farmState: "Imo",
    farmLocalGovernment: "Owerri Municipal",
    farmingSeason: "YEAR_ROUND",
    farmWard: "Ikenegbu",
    farmingExperience: 6,
    farmLatitude: 5.4833,
    farmLongitude: 7.0333,
    soilType: "LOAMY",
    soilFertility: "MEDIUM",
    year: 2024,
    yieldSeason: "YEAR_ROUND",
    quantity: 2500
  },
  {
    farmSize: 3.8,
    primaryCrop: "Maize",
    secondaryCrop: "Beans",
    farmOwnership: "OWNED",
    farmState: "Bauchi",
    farmLocalGovernment: "Bauchi",
    farmingSeason: "WET",
    farmWard: "Kandahar",
    farmingExperience: 14,
    farmLatitude: 10.3158,
    farmLongitude: 9.8442,
    soilType: "SANDY",
    soilFertility: "MEDIUM",
    year: 2024,
    yieldSeason: "FIRST_SEASON",
    quantity: 3800
  },
  {
    farmSize: 2.3,
    primaryCrop: "Plantain",
    secondaryCrop: "Cocoa",
    farmOwnership: "RENTED",
    farmState: "Oyo",
    farmLocalGovernment: "Ibadan North",
    farmingSeason: "YEAR_ROUND",
    farmWard: "Bodija",
    farmingExperience: 11,
    farmLatitude: 7.4000,
    farmLongitude: 3.9000,
    soilType: "LOAMY",
    soilFertility: "HIGH",
    year: 2024,
    yieldSeason: "YEAR_ROUND",
    quantity: 2900
  }
];

async function seedRealFarmerData() {
  console.log('🌱 Starting to seed real farmer data...');
  
  try {
    // Check if farmers already exist to avoid duplicates
    const existingCount = await prisma.farmer.count();
    console.log(`📊 Current farmers in database: ${existingCount}`);
    
    let farmersCreated = 0;
    let farmsCreated = 0;
    
    for (let i = 0; i < realFarmerData.length; i++) {
      const farmerData = realFarmerData[i];
      const farmData = realFarmData[i];
      
      try {
        // Check if farmer with this NIN already exists
        const existingFarmer = await prisma.farmer.findUnique({
          where: { nin: farmerData.nin }
        });
        
        if (existingFarmer) {
          console.log(`⚠️  Farmer with NIN ${farmerData.nin} already exists, skipping...`);
          continue;
        }
        
        // Create farmer
        const farmer = await prisma.farmer.create({
          data: {
            ...farmerData,
            registrationDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        farmersCreated++;
        console.log(`✅ Created farmer: ${farmer.firstName} ${farmer.lastName}`);
        
        // Create farm for this farmer
        const farm = await prisma.farm.create({
          data: {
            ...farmData,
            farmerId: farmer.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        farmsCreated++;
        console.log(`🚜 Created farm for ${farmer.firstName}: ${farmData.farmSize} hectares, ${farmData.primaryCrop}`);
        
      } catch (error) {
        console.error(`❌ Error creating farmer ${farmerData.firstName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Seeding completed!`);
    console.log(`👥 Farmers created: ${farmersCreated}`);
    console.log(`🚜 Farms created: ${farmsCreated}`);
    
    // Show final count
    const finalCount = await prisma.farmer.count();
    const finalFarmCount = await prisma.farm.count();
    console.log(`📊 Total farmers in database: ${finalCount}`);
    console.log(`🚜 Total farms in database: ${finalFarmCount}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedRealFarmerData()
    .catch(console.error);
}

module.exports = { seedRealFarmerData, realFarmerData, realFarmData };
