#!/usr/bin/env node

/**
 * Safe Database Data Cleaning Script
 * 
 * This script safely cleans placeholder values like ***, **, *****, null, and empty strings
 * from your database without destroying data.
 * 
 * Usage:
 * 1. Dry run (preview changes): node scripts/clean-database-data.js --dry-run
 * 2. Clean specific table: node scripts/clean-database-data.js --table farmers
 * 3. Clean all tables: node scripts/clean-database-data.js --clean-all
 * 4. Backup before cleaning: node scripts/clean-database-data.js --backup --clean-all
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Define placeholder patterns to clean
const PLACEHOLDER_PATTERNS = [
  /^\*+$/, // Any number of asterisks (*, **, ***, etc.)
  /^-+$/, // Any number of dashes (-, --, ---, etc.)
  /^_+$/, // Any number of underscores (_, __, ___, etc.)
  /^\.+$/, // Any number of dots (., .., ..., etc.)
  /^x+$/i, // Any number of x's (x, xx, xxx, etc.)
  /^n\/a$/i, // N/A variations
  /^na$/i, // NA
  /^null$/i, // String "null"
  /^undefined$/i, // String "undefined"
  /^none$/i, // String "none"
  /^nil$/i, // String "nil"
  /^\s*$/, // Empty or whitespace-only strings
];


// Tables and their string fields to clean
const TABLES_TO_CLEAN = {
  farmer: [
    'firstName', 'middleName', 'lastName', 'gender', 'state', 'lga', 
    'maritalStatus', 'employmentStatus', 'phone', 'email', 'whatsAppNumber', 
    'address', 'ward', 'bankName', 'accountNumber', 'bvn', 'status', 
    'photoUrl', 'accountName'
  ],
  agent: [
    'firstName', 'middleName', 'lastName', 'gender', 'maritalStatus', 
    'employmentStatus', 'photoUrl', 'phone', 'email', 'whatsAppNumber', 
    'alternativePhone', 'address', 'city', 'state', 'localGovernment', 
    'ward', 'pollingUnit', 'bankName', 'accountName', 'accountNumber', 
    'bvn', 'assignedState', 'assignedLGA', 'employmentType', 'status'
  ],
  farm: [
    'primaryCrop', 'produceCategory', 'farmOwnership', 'farmState', 
    'farmLocalGovernment', 'farmingSeason', 'farmWard', 'farmPollingUnit', 
    'secondaryCrop', 'soilType', 'soilFertility', 'coordinateSystem', 
    'yieldSeason'
  ],
  referee: [
    'firstName', 'lastName', 'phone', 'relationship'
  ],
  certificate: [
    'status', 'qrCode', 'pdfPath'
  ],
  cluster: [
    'title', 'description', 'clusterLeadFirstName', 'clusterLeadLastName', 
    'clusterLeadEmail', 'clusterLeadPhone'
  ],
  user: [
    'email', 'displayName', 'role', 'firstName', 'lastName', 'phoneNumber'
  ]
};

// Helper function to check if a value should be cleaned
function shouldCleanValue(value) {
  if (!value) return false; // null, undefined, empty string
  if (typeof value !== 'string') return false;
  
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value.trim()));
}

// Helper function to get clean value
function getCleanValue(value, fieldName) {
  if (!value || shouldCleanValue(value)) {
    // For required fields, you might want to set a default value
    // For now, we'll set to null
    return null;
  }
  return value;
}

// Create backup of affected records
async function createBackup(tableName, records) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `${tableName}_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2));
  
  console.log(`✅ Backup created: ${backupFile}`);
  return backupFile;
}

// Scan and report problematic data
async function scanTable(tableName, fields, limit = 1000) {
  console.log(`\n🔍 Scanning table: ${tableName}`);
  
  try {
    const totalCount = await prisma[tableName].count();
    console.log(`   📊 Total records: ${totalCount}`);
    
    // For large tables, sample records
    const sampleSize = Math.min(limit, totalCount);
    const records = await prisma[tableName].findMany({
      take: sampleSize
    });
    
    const problematicRecords = [];
    let processedCount = 0;
    
    for (const record of records) {
      processedCount++;
      if (processedCount % 100 === 0) {
        process.stdout.write(`\r   🔄 Processed ${processedCount}/${records.length} records...`);
      }
      
      const issues = {};
      let hasIssues = false;
      
      for (const field of fields) {
        const value = record[field];
        if (shouldCleanValue(value)) {
          issues[field] = value;
          hasIssues = true;
        }
      }
      
      if (hasIssues) {
        problematicRecords.push({
          id: record.id,
          issues: issues
        });
      }
    }
    
    if (processedCount >= 100) {
      console.log(''); // New line after progress indicator
    }
    
    if (problematicRecords.length > 0) {
      console.log(`❌ Found ${problematicRecords.length} records with issues in sample:`);
      problematicRecords.slice(0, 3).forEach(record => {
        console.log(`   ID: ${record.id}`);
        Object.entries(record.issues).forEach(([field, value]) => {
          console.log(`     ${field}: "${value}"`);
        });
      });
      
      if (problematicRecords.length > 3) {
        console.log(`   ... and ${problematicRecords.length - 3} more records in sample`);
      }
      
      if (sampleSize < totalCount) {
        const estimatedTotal = Math.round((problematicRecords.length / sampleSize) * totalCount);
        console.log(`   📈 Estimated total problematic records: ~${estimatedTotal}`);
      }
      
      return problematicRecords;
    } else {
      console.log(`✅ No issues found in ${tableName} sample`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error scanning ${tableName}:`, error.message);
    return [];
  }
}

// Clean data in a specific table
async function cleanTable(tableName, fields, backup = false) {
  console.log(`\n🧹 Cleaning table: ${tableName}`);
  
  try {
    // First, count total records
    const totalCount = await prisma[tableName].count();
    console.log(`   📊 Total records to process: ${totalCount}`);
    
    // Process in batches
    const batchSize = 100;
    const recordsToUpdate = [];
    let processedCount = 0;
    
    for (let skip = 0; skip < totalCount; skip += batchSize) {
      const batch = await prisma[tableName].findMany({
        skip: skip,
        take: batchSize
      });
      
      for (const record of batch) {
        processedCount++;
        if (processedCount % 100 === 0) {
          process.stdout.write(`\r   🔄 Processed ${processedCount}/${totalCount} records...`);
        }
        
        const updates = {};
        let needsUpdate = false;
        
        for (const field of fields) {
          const originalValue = record[field];
          const cleanValue = getCleanValue(originalValue, field);
          
          if (originalValue !== cleanValue) {
            updates[field] = cleanValue;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          recordsToUpdate.push({
            id: record.id,
            original: record,
            updates: updates
          });
        }
      }
    }
    
    if (processedCount >= 100) {
      console.log(''); // New line after progress indicator
    }
    
    if (recordsToUpdate.length === 0) {
      console.log(`✅ No records need cleaning in ${tableName}`);
      return 0;
    }
    
    console.log(`   🎯 Found ${recordsToUpdate.length} records that need updates`);
    
    // Create backup if requested
    if (backup) {
      await createBackup(tableName, recordsToUpdate.map(r => r.original));
    }
    
    // Update records in batches
    let updatedCount = 0;
    const updateBatchSize = 10; // Smaller batches for updates
    
    for (let i = 0; i < recordsToUpdate.length; i += updateBatchSize) {
      const updateBatch = recordsToUpdate.slice(i, i + updateBatchSize);
      
      for (const recordToUpdate of updateBatch) {
        try {
          await prisma[tableName].update({
            where: { id: recordToUpdate.id },
            data: recordToUpdate.updates
          });
          updatedCount++;
          
          if (updatedCount % 50 === 0) {
            process.stdout.write(`\r   💾 Updated ${updatedCount}/${recordsToUpdate.length} records...`);
          }
        } catch (error) {
          console.error(`\n❌ Error updating ${tableName} record ${recordToUpdate.id}:`, error.message);
        }
      }
    }
    
    if (updatedCount >= 50) {
      console.log(''); // New line after progress indicator
    }
    
    console.log(`✅ Successfully cleaned ${updatedCount} records in ${tableName}`);
    return updatedCount;
    
  } catch (error) {
    console.error(`❌ Error cleaning ${tableName}:`, error.message);
    return 0;
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const shouldBackup = args.includes('--backup');
  const cleanAll = args.includes('--clean-all');
  const tableIndex = args.findIndex(arg => arg === '--table');
  const specificTable = tableIndex !== -1 ? args[tableIndex + 1] : null;
  
  console.log('🔧 Database Data Cleaning Tool');
  console.log('==============================');
  
  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No data will be modified');
    console.log('This will show you what data would be cleaned...\n');
    
    let totalIssues = 0;
    for (const [tableName, fields] of Object.entries(TABLES_TO_CLEAN)) {
      const issues = await scanTable(tableName, fields);
      totalIssues += issues.length;
    }
    
    console.log(`\n📊 Summary: Found ${totalIssues} total records with issues across all tables`);
    console.log('\n💡 To actually clean the data, run without --dry-run flag');
    console.log('💡 Add --backup flag to create backups before cleaning');
    
  } else if (specificTable) {
    if (!TABLES_TO_CLEAN[specificTable]) {
      console.error(`❌ Unknown table: ${specificTable}`);
      console.log('Available tables:', Object.keys(TABLES_TO_CLEAN).join(', '));
      process.exit(1);
    }
    
    console.log(`🎯 Cleaning specific table: ${specificTable}`);
    await cleanTable(specificTable, TABLES_TO_CLEAN[specificTable], shouldBackup);
    
  } else if (cleanAll) {
    console.log('🧹 Cleaning all tables...');
    if (shouldBackup) {
      console.log('💾 Backups will be created for affected records');
    }
    
    let totalCleaned = 0;
    for (const [tableName, fields] of Object.entries(TABLES_TO_CLEAN)) {
      const cleaned = await cleanTable(tableName, fields, shouldBackup);
      totalCleaned += cleaned;
    }
    
    console.log(`\n✅ Cleaning complete! Total records cleaned: ${totalCleaned}`);
    
  } else {
    console.log('❓ Usage examples:');
    console.log('   node scripts/clean-database-data.js --dry-run           # Preview changes');
    console.log('   node scripts/clean-database-data.js --table farmers     # Clean specific table');
    console.log('   node scripts/clean-database-data.js --backup --clean-all # Clean all with backup');
    console.log('');
    console.log('🔍 Running dry run by default...\n');
    
    // Default to dry run
    let totalIssues = 0;
    for (const [tableName, fields] of Object.entries(TABLES_TO_CLEAN)) {
      const issues = await scanTable(tableName, fields);
      totalIssues += issues.length;
    }
    
    console.log(`\n📊 Summary: Found ${totalIssues} total records with issues across all tables`);
  }
}

// Run the script
main()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
