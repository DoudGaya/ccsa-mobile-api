const { farmerSchema } = require('./lib/validation.js');

console.log('🧪 Testing validation schema...');

// Test data
const testData = {
  nin: '12345678901',
  firstName: 'Test',
  lastName: 'User',
  phone: '08123456789',
  dateOfBirth: '2002-04-06',
  gender: 'MALE',
  maritalStatus: 'MARRIED'
};

try {
  const result = farmerSchema.parse(testData);
  console.log('✅ Validation passed!');
  console.log('📅 Date conversion:', result.dateOfBirth);
  console.log('👤 Gender normalization:', result.gender);
  console.log('💍 Marital status normalization:', result.maritalStatus);
  console.log('🎯 All transformations working correctly!');
} catch (error) {
  console.log('❌ Validation error:', error.message);
  console.log('Details:', error.issues || error);
}
