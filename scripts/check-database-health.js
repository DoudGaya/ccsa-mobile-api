#!/usr/bin/env node

/**
 * Database Health Checker
 * 
 * Quick health check to identify data quality issues
 * Usage: node scripts/check-database-health.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define what constitutes "bad" data
const BAD_DATA_PATTERNS = [
  { pattern: /^\*+$/, name: 'Asterisk placeholders (*,**,***)' },
  { pattern: /^-+$/, name: 'Dash placeholders (-,--,---)' },
  { pattern: /^_+$/, name: 'Underscore placeholders (_,__,___)' },
  { pattern: /^\.+$/, name: 'Dot placeholders (.,..,...,)' },
  { pattern: /^x+$/i, name: 'X placeholders (x,xx,xxx)' },
  { pattern: /^(n\/a|na|null|undefined|none|nil)$/i, name: 'Null-like strings' },
  { pattern: /^\s*$/, name: 'Empty/whitespace strings' },
];

async function checkTableHealth(tableName) {
  try {
    const totalRecords = await prisma[tableName].count();
    const records = await prisma[tableName].findMany();
    
    const issues = [];
    const sampleBadData = [];
    
    for (const record of records) {
      for (const [field, value] of Object.entries(record)) {
        if (typeof value === 'string') {
          for (const badPattern of BAD_DATA_PATTERNS) {
            if (badPattern.pattern.test(value.trim())) {
              issues.push({ field, value, pattern: badPattern.name });
              
              // Collect sample data for display
              if (sampleBadData.length < 5) {
                sampleBadData.push({
                  id: record.id,
                  field,
                  value,
                  pattern: badPattern.name
                });
              }
              break;
            }
          }
        }
      }
    }
    
    return {
      tableName,
      totalRecords,
      issueCount: issues.length,
      uniqueIssues: [...new Set(issues.map(i => `${i.field}:${i.pattern}`))].length,
      sampleBadData,
      healthScore: Math.round(((totalRecords * 10 - issues.length) / (totalRecords * 10)) * 100)
    };
    
  } catch (error) {
    return {
      tableName,
      error: error.message,
      healthScore: 0
    };
  }
}

async function main() {
  console.log('🏥 Database Health Check Report');
  console.log('================================\n');
  
  const tables = ['farmer', 'agent', 'farm', 'certificate', 'cluster', 'user'];
  const healthReport = [];
  
  for (const table of tables) {
    const health = await checkTableHealth(table);
    healthReport.push(health);
    
    if (health.error) {
      console.log(`❌ ${table.toUpperCase()}: Error - ${health.error}`);
    } else {
      const healthEmoji = health.healthScore >= 90 ? '💚' : health.healthScore >= 70 ? '💛' : '❤️';
      console.log(`${healthEmoji} ${table.toUpperCase()}: ${health.healthScore}% healthy`);
      console.log(`   📊 ${health.totalRecords} total records`);
      
      if (health.issueCount > 0) {
        console.log(`   ⚠️  ${health.issueCount} data quality issues found`);
        console.log(`   🔍 ${health.uniqueIssues} unique issue types`);
        
        if (health.sampleBadData.length > 0) {
          console.log(`   📝 Sample issues:`);
          health.sampleBadData.forEach(issue => {
            console.log(`      ID:${issue.id} ${issue.field}:"${issue.value}" (${issue.pattern})`);
          });
        }
      } else {
        console.log(`   ✅ No data quality issues found`);
      }
    }
    console.log('');
  }
  
  // Overall summary
  const totalRecords = healthReport.reduce((sum, h) => sum + (h.totalRecords || 0), 0);
  const totalIssues = healthReport.reduce((sum, h) => sum + (h.issueCount || 0), 0);
  const averageHealth = Math.round(healthReport.reduce((sum, h) => sum + h.healthScore, 0) / healthReport.length);
  
  console.log('📋 OVERALL SUMMARY');
  console.log('==================');
  console.log(`🗃️  Total Records: ${totalRecords}`);
  console.log(`⚠️  Total Issues: ${totalIssues}`);
  console.log(`🎯 Average Health Score: ${averageHealth}%`);
  
  if (totalIssues > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Run: node scripts/clean-database-data.js --dry-run');
    console.log('   2. Review the proposed changes');
    console.log('   3. Run: node scripts/clean-database-data.js --backup --clean-all');
  } else {
    console.log('\n🎉 Your database is in excellent health!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
