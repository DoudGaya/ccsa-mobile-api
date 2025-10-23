/**
 * Text utility functions for consistent formatting across the application
 */

/**
 * Convert text to title case (capitalize first letter of each word)
 * @param {string} text - The text to convert
 * @returns {string} - Title case text
 */
export function toTitleCase(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle common abbreviations and special cases
      const abbreviations = ['nin', 'bvn', 'lga', 'id', 'api', 'sms', 'gps', 'pdf', 'qr'];
      const prepositions = ['of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'and', 'or', 'the', 'a', 'an'];
      
      if (abbreviations.includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      
      // Don't capitalize short prepositions unless they're the first word
      if (prepositions.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Capitalize first letter of the word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\b(NIN|BVN|LGA|ID|API|SMS|GPS|PDF|QR)\b/g, match => match.toUpperCase());
}

/**
 * Convert text to proper sentence case
 * @param {string} text - The text to convert
 * @returns {string} - Sentence case text
 */
export function toSentenceCase(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .replace(/(^\w|[.!?]\s*\w)/g, match => match.toUpperCase())
    .replace(/\b(NIN|BVN|LGA|ID|API|SMS|GPS|PDF|QR)\b/gi, match => match.toUpperCase());
}

/**
 * Capitalize the first letter of a string
 * @param {string} text - The text to capitalize
 * @returns {string} - Capitalized text
 */
export function capitalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format a full name with proper capitalization
 * @param {string} firstName - First name
 * @param {string} middleName - Middle name (optional)
 * @param {string} lastName - Last name
 * @returns {string} - Formatted full name
 */
export function formatFullName(firstName, middleName, lastName) {
  const parts = [
    firstName && toTitleCase(firstName),
    middleName && toTitleCase(middleName),
    lastName && toTitleCase(lastName)
  ].filter(Boolean);
  
  return parts.join(' ');
}

/**
 * Format location text (state, LGA, ward) with proper capitalization
 * @param {string} location - Location text
 * @returns {string} - Formatted location
 */
export function formatLocation(location) {
  if (!location || typeof location !== 'string') return '';
  
  // Handle special location formatting
  return location
    .toLowerCase()
    .split(/[\s-]/)
    .map(word => {
      // Handle common location abbreviations
      if (['lga', 'fc', 'fct'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Format crop names with proper capitalization
 * @param {string} crop - Crop name
 * @returns {string} - Formatted crop name
 */
export function formatCropName(crop) {
  if (!crop || typeof crop !== 'string') return '';
  
  // Handle special crop names
  const specialCrops = {
    'maize': 'Maize',
    'rice': 'Rice',
    'beans': 'Beans',
    'cassava': 'Cassava',
    'yam': 'Yam',
    'groundnut': 'Groundnut',
    'soybean': 'Soybean',
    'cowpea': 'Cowpea',
    'millet': 'Millet',
    'sorghum': 'Sorghum'
  };
  
  const lowerCrop = crop.toLowerCase();
  return specialCrops[lowerCrop] || toTitleCase(crop);
}

/**
 * Format bank names with proper capitalization
 * @param {string} bankName - Bank name
 * @returns {string} - Formatted bank name
 */
export function formatBankName(bankName) {
  if (!bankName || typeof bankName !== 'string') return '';
  
  return bankName
    .toLowerCase()
    .split(/[\s-]/)
    .map(word => {
      // Handle bank-specific abbreviations
      const bankAbbreviations = ['plc', 'ltd', 'bank', 'co', 'microfinance', 'mfb'];
      if (bankAbbreviations.includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Format employment status with proper capitalization
 * @param {string} status - Employment status
 * @returns {string} - Formatted status
 */
export function formatEmploymentStatus(status) {
  if (!status || typeof status !== 'string') return '';
  
  const statusMap = {
    'employed': 'Employed',
    'unemployed': 'Unemployed',
    'self-employed': 'Self-Employed',
    'student': 'Student',
    'retired': 'Retired',
    'farmer': 'Farmer'
  };
  
  return statusMap[status.toLowerCase()] || toTitleCase(status);
}

/**
 * Format marital status with proper capitalization
 * @param {string} status - Marital status
 * @returns {string} - Formatted status
 */
export function formatMaritalStatus(status) {
  if (!status || typeof status !== 'string') return '';
  
  const statusMap = {
    'single': 'Single',
    'married': 'Married',
    'divorced': 'Divorced',
    'widowed': 'Widowed',
    'separated': 'Separated'
  };
  
  return statusMap[status.toLowerCase()] || toTitleCase(status);
}

/**
 * Clean and format text by removing extra spaces and normalizing
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/[^\w\s-.]/g, ''); // Remove special characters except alphanumeric, spaces, hyphens, and periods
}

/**
 * Format data values for display: uppercase with underscores/dashes replaced by spaces
 * @param {string} text - The text to format
 * @returns {string} - Formatted text
 */
export function formatValue(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
}