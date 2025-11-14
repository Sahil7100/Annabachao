#!/usr/bin/env node

/**
 * TestSprite Test Runner for AnnaBachao App
 * This script runs TestSprite tests for the React Native app
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

class TestSpriteRunner {
  constructor() {
    this.config = this.loadConfig();
    this.results = [];
  }

  loadConfig() {
    const configPath = path.join(__dirname, 'testsprite.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    return {};
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    console.log('=' .repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const endTime = Date.now();
      
      const testResult = {
        name: testName,
        status: 'PASSED',
        duration: endTime - startTime,
        result: result,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ${testName} - PASSED (${testResult.duration}ms)`);
      this.results.push(testResult);
      return testResult;
      
    } catch (error) {
      const testResult = {
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(`❌ ${testName} - FAILED`);
      console.log(`   Error: ${error.message}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting TestSprite Test Suite for AnnaBachao App');
    console.log('=' .repeat(60));
    
    const TestSuite = require('./tests/testsprite.test.js');
    const suite = new TestSuite();
    
    // Run individual test suites
    await this.runTest('Authentication Flow', () => suite.testAuthenticationFlow());
    await this.runTest('Donation Flow', () => suite.testDonationFlow());
    await this.runTest('NGO Dashboard', () => suite.testNGODashboard());
    await this.runTest('Admin Panel', () => suite.testAdminPanel());
    await this.runTest('Navigation Flow', () => suite.testNavigationFlow());
    await this.runTest('API Integration', () => suite.testAPIIntegration());
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-results', 'testsprite-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total,
        passed,
        failed,
        successRate: (passed / total) * 100
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      config: this.config
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new TestSpriteRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestSpriteRunner;
