const fs = require('fs');
const path = require('path');

// Generate SQL script from JSON data
function generateSQLScript() {
  try {
    console.log('📖 Reading location data...');
    
    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../ccsa-mobile/states-and-lgas-and-wards-and-polling-units.json');
    const locationData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${locationData.length} states to process`);
    
    let sqlStatements = [];
    
    // Add header comment
    sqlStatements.push('-- Location Data Seeding Script');
    sqlStatements.push('-- Generated from states-and-lgas-and-wards-and-polling-units.json');
    sqlStatements.push('-- Run this script in your PostgreSQL database');
    sqlStatements.push('');
    
    // Process each state
    for (const stateData of locationData) {
      const stateName = stateData.state.replace(/'/g, "''"); // Escape single quotes
      const stateCode = stateData.state.toUpperCase().replace(/\s+/g, '_');
      
      // Insert state
      sqlStatements.push(
        `INSERT INTO states (id, name, code, "createdAt", "updatedAt") VALUES (gen_random_uuid(), '${stateName}', '${stateCode}', NOW(), NOW()) ON CONFLICT (name) DO NOTHING;`
      );
      
      // Process LGAs
      for (const lgaData of stateData.lgas) {
        const lgaName = lgaData.lga.replace(/'/g, "''");
        const lgaCode = lgaData.lga.toUpperCase().replace(/\s+/g, '_');
        
        // Insert LGA
        sqlStatements.push(
          `INSERT INTO local_governments (id, name, code, "stateId", "createdAt", "updatedAt") 
           SELECT gen_random_uuid(), '${lgaName}', '${lgaCode}', s.id, NOW(), NOW() 
           FROM states s WHERE s.name = '${stateName}'
           ON CONFLICT (name, "stateId") DO NOTHING;`
        );
        
        // Process Wards
        for (const wardData of lgaData.wards) {
          const wardName = wardData.ward.replace(/'/g, "''");
          const wardCode = wardData.ward.toUpperCase().replace(/\s+/g, '_');
          
          // Insert Ward
          sqlStatements.push(
            `INSERT INTO wards (id, name, code, "localGovernmentId", "createdAt", "updatedAt") 
             SELECT gen_random_uuid(), '${wardName}', '${wardCode}', lg.id, NOW(), NOW() 
             FROM local_governments lg 
             JOIN states s ON lg."stateId" = s.id 
             WHERE lg.name = '${lgaName}' AND s.name = '${stateName}'
             ON CONFLICT (name, "localGovernmentId") DO NOTHING;`
          );
          
          // Process Polling Units
          for (const pollingUnitName of wardData.polling_units) {
            const puName = pollingUnitName.replace(/'/g, "''");
            const puCode = pollingUnitName.toUpperCase().replace(/\s+/g, '_');
            
            // Insert Polling Unit
            sqlStatements.push(
              `INSERT INTO polling_units (id, name, code, "wardId", "createdAt", "updatedAt") 
               SELECT gen_random_uuid(), '${puName}', '${puCode}', w.id, NOW(), NOW() 
               FROM wards w 
               JOIN local_governments lg ON w."localGovernmentId" = lg.id 
               JOIN states s ON lg."stateId" = s.id 
               WHERE w.name = '${wardName}' AND lg.name = '${lgaName}' AND s.name = '${stateName}'
               ON CONFLICT (name, "wardId") DO NOTHING;`
            );
          }
        }
      }
      
      console.log(`✅ Processed state: ${stateData.state}`);
    }
    
    // Add final statistics query
    sqlStatements.push('');
    sqlStatements.push('-- Check final counts');
    sqlStatements.push('SELECT \'States\' as type, COUNT(*) as count FROM states');
    sqlStatements.push('UNION ALL SELECT \'Local Governments\', COUNT(*) FROM local_governments');
    sqlStatements.push('UNION ALL SELECT \'Wards\', COUNT(*) FROM wards');
    sqlStatements.push('UNION ALL SELECT \'Polling Units\', COUNT(*) FROM polling_units;');
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n');
    const sqlPath = path.join(__dirname, 'seed-locations.sql');
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');
    
    console.log('\n🎉 SQL script generated successfully!');
    console.log(`📁 File saved to: ${sqlPath}`);
    console.log(`📊 Total SQL statements: ${sqlStatements.length}`);
    console.log('\n📋 Next steps:');
    console.log('1. Connect to your PostgreSQL database');
    console.log('2. Run the generated seed-locations.sql script');
    console.log('3. Verify the data was inserted correctly');
    
    return sqlPath;
    
  } catch (error) {
    console.error('❌ Error generating SQL script:', error);
    throw error;
  }
}

// Run the script generation
if (require.main === module) {
  generateSQLScript()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = generateSQLScript;
