#!/usr/bin/env node

/**
 * Production validation script
 * Validates the backend API is ready for production deployment
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET', 
  'NEXTAUTH_URL',
  'FIREBASE_ADMIN_KEY',
  'NODE_ENV'
];

// API endpoints to test
const API_ENDPOINTS = [
  '/api/health',
  '/api/validate',
  '/api/farmers',
  '/api/agents',
  '/api/farms',
  '/api/certificates',
  '/api/clusters'
];

class ProductionValidator {
  constructor() {
    this.results = {
      environment: { passed: 0, failed: 0, tests: [] },
      api: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating environment variables...', 'info');
    
    const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
    
    if (missing.length === 0) {
      this.results.environment.passed++;
      this.results.environment.tests.push({
        name: 'Environment Variables',
        status: 'passed',
        message: 'All required environment variables are set'
      });
      this.log('Environment variables validation passed', 'success');
    } else {
      this.results.environment.failed++;
      this.results.environment.tests.push({
        name: 'Environment Variables',
        status: 'failed',
        message: `Missing variables: ${missing.join(', ')}`
      });
      this.log(`Missing environment variables: ${missing.join(', ')}`, 'error');
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.results.environment.passed++;
      this.results.environment.tests.push({
        name: 'Production Mode',
        status: 'passed',
        message: 'NODE_ENV is set to production'
      });
    } else {
      this.results.environment.failed++;
      this.results.environment.tests.push({
        name: 'Production Mode',
        status: 'failed',
        message: `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`
      });
    }
  }

  async makeRequest(endpoint) {
    return new Promise((resolve) => {
      const url = `${BASE_URL}${endpoint}`;
      const module = url.startsWith('https') ? https : http;
      
      const startTime = Date.now();
      
      const req = module.get(url, { timeout: TIMEOUT }, (res) => {
        const duration = Date.now() - startTime;
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            duration,
            data: data,
            headers: res.headers
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          error: error.message,
          duration: Date.now() - startTime
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          error: 'Request timeout',
          duration: TIMEOUT
        });
      });
    });
  }

  async validateAPIEndpoints() {
    this.log('Validating API endpoints...', 'info');
    
    for (const endpoint of API_ENDPOINTS) {
      const result = await this.makeRequest(endpoint);
      
      if (result.error) {
        this.results.api.failed++;
        this.results.api.tests.push({
          name: `API ${endpoint}`,
          status: 'failed',
          message: result.error
        });
        this.log(`API ${endpoint} failed: ${result.error}`, 'error');
      } else if (result.statusCode >= 200 && result.statusCode < 400) {
        this.results.api.passed++;
        this.results.api.tests.push({
          name: `API ${endpoint}`,
          status: 'passed',
          message: `Response: ${result.statusCode} (${result.duration}ms)`
        });
        this.log(`API ${endpoint} passed: ${result.statusCode} (${result.duration}ms)`, 'success');
      } else {
        this.results.api.failed++;
        this.results.api.tests.push({
          name: `API ${endpoint}`,
          status: 'failed',
          message: `HTTP ${result.statusCode}`
        });
        this.log(`API ${endpoint} failed: HTTP ${result.statusCode}`, 'error');
      }
    }
  }

  async validateSecurity() {
    this.log('Validating security headers...', 'info');
    
    const result = await this.makeRequest('/api/health');
    
    if (result.headers) {
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];
      
      let securityScore = 0;
      const missingHeaders = [];
      
      securityHeaders.forEach(header => {
        if (result.headers[header]) {
          securityScore++;
        } else {
          missingHeaders.push(header);
        }
      });
      
      if (securityScore === securityHeaders.length) {
        this.results.security.passed++;
        this.results.security.tests.push({
          name: 'Security Headers',
          status: 'passed',
          message: 'All security headers present'
        });
        this.log('Security headers validation passed', 'success');
      } else {
        this.results.security.failed++;
        this.results.security.tests.push({
          name: 'Security Headers',
          status: 'failed',
          message: `Missing headers: ${missingHeaders.join(', ')}`
        });
        this.log(`Missing security headers: ${missingHeaders.join(', ')}`, 'warning');
      }
    } else {
      this.results.security.failed++;
      this.results.security.tests.push({
        name: 'Security Headers',
        status: 'failed',
        message: 'Could not retrieve headers'
      });
    }
  }

  async validatePerformance() {
    this.log('Validating performance...', 'info');
    
    const result = await this.makeRequest('/api/validate');
    
    if (result.duration) {
      if (result.duration < 2000) {
        this.results.performance.passed++;
        this.results.performance.tests.push({
          name: 'Response Time',
          status: 'passed',
          message: `API validation completed in ${result.duration}ms`
        });
        this.log(`Performance validation passed: ${result.duration}ms`, 'success');
      } else {
        this.results.performance.failed++;
        this.results.performance.tests.push({
          name: 'Response Time',
          status: 'warning',
          message: `API validation took ${result.duration}ms (>2000ms)`
        });
        this.log(`Performance warning: ${result.duration}ms response time`, 'warning');
      }
    } else {
      this.results.performance.failed++;
      this.results.performance.tests.push({
        name: 'Response Time',
        status: 'failed',
        message: 'Could not measure response time'
      });
    }
  }

  printReport() {
    this.log('\n📊 PRODUCTION VALIDATION REPORT', 'info');
    this.log('=====================================', 'info');
    
    Object.entries(this.results).forEach(([category, results]) => {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
      
      this.log(`\n${category.toUpperCase()}: ${results.passed}/${total} passed (${passRate}%)`, 'info');
      
      results.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
        this.log(`  ${icon} ${test.name}: ${test.message}`);
      });
    });
    
    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalTests = Object.values(this.results).reduce((sum, r) => sum + r.passed + r.failed, 0);
    const overallPassRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    this.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`, 'info');
    
    if (overallPassRate >= 90) {
      this.log('🚀 Backend is ready for production deployment!', 'success');
      process.exit(0);
    } else if (overallPassRate >= 70) {
      this.log('⚠️ Backend has some issues but may be deployable', 'warning');
      process.exit(1);
    } else {
      this.log('❌ Backend is NOT ready for production deployment', 'error');
      process.exit(1);
    }
  }

  async run() {
    this.log('🔍 Starting production validation...', 'info');
    
    await this.validateEnvironment();
    await this.validateAPIEndpoints();
    await this.validateSecurity();
    await this.validatePerformance();
    
    this.printReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;
