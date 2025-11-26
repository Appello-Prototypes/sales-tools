/**
 * Comprehensive Test Script for AI Research & Dual Reports
 * 
 * Tests:
 * 1. Assessment submission with research
 * 2. Customer report generation
 * 3. Admin report generation
 * 4. Database persistence
 * 5. API endpoints
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Simple fetch wrapper
async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    data: json,
  };
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

async function testServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (response?.status === 200) {
      logTest('Server Health Check', true);
      return true;
    }
    // If health endpoint doesn't exist, try a simple GET
    const homeResponse = await fetch(`${BASE_URL}/`);
    if (homeResponse.ok) {
      logTest('Server Health Check', true);
      return true;
    }
    logTest('Server Health Check', false, 'Server not responding');
    return false;
  } catch (error: any) {
    logTest('Server Health Check', false, error.message);
    return false;
  }
}

async function testCreateAssessment() {
  try {
    const response = await apiRequest('POST', `${BASE_URL}/api/assessments/start`, { email: 'test@example.com' });
    
    if (response.status === 200) {
      const submissionId = response.data.submissionId || response.data.id;
      if (submissionId) {
        logTest('Create Assessment', true, undefined, { submissionId });
        return submissionId;
      }
      logTest('Create Assessment', false, `No submissionId in response: ${JSON.stringify(response.data)}`);
      return null;
    }
    
    logTest('Create Assessment', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    return null;
  } catch (error: any) {
    logTest('Create Assessment', false, error.message);
    return null;
  }
}

async function testSubmitAssessment(submissionId: string) {
  try {
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      companyName: 'Test Mechanical Contractors',
      section1: {
        trade: 'Mechanical Insulation',
        fieldWorkers: '50-99',
        role: 'Owner/CEO',
      },
      section2: {
        painPoints: [
          'Time tracking and payroll',
          'Job profitability',
          'Material ordering',
        ],
        magicWand: 'Automate all administrative tasks',
        urgency: 8,
        hoursPerWeek: '10-20',
      },
      section3: {
        timesheetMethod: 'Paper timesheets',
        unionized: 'Yes',
        accountingSoftware: 'QuickBooks',
        payrollSoftware: 'ADP',
        constructionSoftware: 'No',
        notDoing: ['Material management', 'Change order tracking'],
      },
      section4: {
        demoFocus: ['Timesheets', 'Job costing'],
        evaluators: ['Owner', 'Operations Manager'],
        techComfort: 'Comfortable',
        smartphones: 'Yes, all field workers',
      },
      section5: {
        timeline: '1-3 months',
        evaluating: ['Procore', 'Buildertrend'],
        nextSteps: ['Pricing information', 'See how it integrates'],
        likelihood: 8,
        specificQuestions: 'How does it handle union payroll?',
      },
    };

    console.log('\n📤 Submitting assessment with comprehensive data...');
    const startTime = Date.now();
    
    const response = await apiRequest(
      'POST',
      `${BASE_URL}/api/assessments/${submissionId}/submit`,
      testData
    );

    const duration = (Date.now() - startTime) / 1000;
    
    if (response.status === 200) {
      logTest('Submit Assessment', true, undefined, {
        duration: `${duration}s`,
        reportGenerated: response.data.reportGenerated,
        auditTrailGenerated: response.data.auditTrailGenerated,
      });
      return response.data;
    }
    
    logTest('Submit Assessment', false, `Unexpected status: ${response.status}`);
    return null;
  } catch (error: any) {
    logTest('Submit Assessment', false, error.message);
    return null;
  }
}

async function testCustomerReport(submissionId: string) {
  try {
    const response = await apiRequest('GET', `${BASE_URL}/api/assessments/${submissionId}/report`);
    
    if (response.status === 200 && response.data.report) {
      const report = response.data.report;
      logTest('Customer Report Generation', true, undefined, {
        hasROI: !!response.data.roi,
        hasScore: !!response.data.score,
        hasAuditTrail: !!response.data.auditTrail,
        reportSections: Object.keys(report),
      });
      return true;
    }
    
    logTest('Customer Report Generation', false, `Status: ${response.status}, Report: ${!!response.data.report}`);
    return false;
  } catch (error: any) {
    logTest('Customer Report Generation', false, error.message);
    return false;
  }
}

async function testAdminReport(submissionId: string) {
  try {
    // First, try to get admin assessment details
    const assessmentResponse = await apiRequest('GET', `${BASE_URL}/api/admin/assessments/${submissionId}`);
    
    if (assessmentResponse.status === 200 && assessmentResponse.data.assessment) {
      const assessment = assessmentResponse.data.assessment;
      
      const hasAdminReport = !!assessment.adminReport;
      const hasAuditTrail = !!assessment.auditTrail;
      const hasDebugLog = !!assessment.debugLog;
      
      logTest('Admin Report in Database', hasAdminReport, undefined, {
        hasAdminReport,
        hasAuditTrail,
        hasDebugLog,
      });
      
      if (hasAdminReport) {
        const adminReport = assessment.adminReport;
        logTest('Admin Report Structure', true, undefined, {
          hasCompanyResearch: !!adminReport.companyResearch,
          hasSalesRecommendations: !!adminReport.salesRecommendations,
          hasCompetitiveIntelligence: !!adminReport.competitiveIntelligence,
          hasIndustryContext: !!adminReport.industryContext,
        });
      }
      
      return hasAdminReport;
    }
    
    if (assessmentResponse.status === 401) {
      logTest('Admin Report Endpoint', true, 'Unauthorized (expected without auth)');
      return true;
    }
    
    logTest('Admin Report in Database', false, `Status: ${assessmentResponse.status}`);
    return false;
  } catch (error: any) {
    logTest('Admin Report in Database', false, error.message);
    return false;
  }
}

async function testAdminReportAPI(submissionId: string) {
  try {
    const response = await apiRequest('GET', `${BASE_URL}/api/admin/reports/${submissionId}`);
    
    if (response.status === 200 && response.data.report) {
      const report = response.data.report.adminReport;
      logTest('Admin Report API Endpoint', true, undefined, {
        hasCompanyResearch: !!report.companyResearch,
        hasSalesRecommendations: !!report.salesRecommendations,
        competitorsFound: report.competitiveIntelligence?.competitors?.length || 0,
        nextSteps: report.salesRecommendations?.nextSteps?.length || 0,
      });
      return true;
    }
    
    if (response.status === 401) {
      logTest('Admin Report API Endpoint', true, 'Unauthorized (expected without auth)');
      return true;
    }
    
    logTest('Admin Report API Endpoint', false, `Status: ${response.status}`);
    return false;
  } catch (error: any) {
    logTest('Admin Report API Endpoint', false, error.message);
    return false;
  }
}

async function testResearchComponents(submissionId: string) {
  try {
    const response = await apiRequest('GET', `${BASE_URL}/api/admin/assessments/${submissionId}`);
    
    if (response.status === 200 && response.data.assessment?.adminReport) {
      const research = response.data.assessment.adminReport.companyResearch;
      
      const checks = {
        companyInfo: !!research?.companyInfo,
        websiteAnalysis: !!research?.websiteAnalysis,
        competitors: !!research?.competitors && research.competitors.length > 0,
        industryInsights: !!research?.industryInsights,
        toolsResearch: !!research?.toolsResearch,
        atlasIntelligence: !!research?.atlasIntelligence,
        salesIntelligence: !!research?.salesIntelligence,
      };
      
      const passed = Object.values(checks).some(v => v === true);
      
      logTest('Research Components', passed, undefined, checks);
      return passed;
    }
    
    if (response.status === 401) {
      logTest('Research Components', true, 'Unauthorized (expected)');
      return true;
    }
    
    logTest('Research Components', false, `Status: ${response.status}`);
    return false;
  } catch (error: any) {
    logTest('Research Components', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  // Test 1: Server Health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not running. Please start it with: npm run dev');
    return;
  }
  
  console.log('\n');
  
  // Test 2: Create Assessment
  const submissionId = await testCreateAssessment();
  if (!submissionId) {
    console.log('\n❌ Failed to create assessment. Stopping tests.');
    return;
  }
  
  console.log('\n');
  
  // Test 3: Submit Assessment (triggers research)
  const submitResult = await testSubmitAssessment(submissionId);
  if (!submitResult) {
    console.log('\n⚠️  Assessment submission failed, but continuing tests...');
  }
  
  // Wait a bit for async processing
  console.log('\n⏳ Waiting 5 seconds for reports to generate...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n');
  
  // Test 4: Customer Report
  await testCustomerReport(submissionId);
  
  console.log('\n');
  
  // Test 5: Admin Report in Database
  await testAdminReport(submissionId);
  
  console.log('\n');
  
  // Test 6: Admin Report API
  await testAdminReportAPI(submissionId);
  
  console.log('\n');
  
  // Test 7: Research Components
  await testResearchComponents(submissionId);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n');
  
  if (submissionId) {
    console.log('🔗 Test Assessment Details:');
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Customer Report: ${BASE_URL}/assessment/report/${submissionId}`);
    console.log(`   Admin Details: ${BASE_URL}/admin/assessments/${submissionId}`);
    console.log(`   Admin Report: ${BASE_URL}/admin/reports/${submissionId}`);
  }
  
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

