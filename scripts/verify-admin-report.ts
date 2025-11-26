/**
 * Quick verification script to check if admin reports are being generated
 */

const BASE_URL = 'http://localhost:3000';
const submissionId = process.argv[2];

if (!submissionId) {
  console.log('Usage: npx tsx scripts/verify-admin-report.ts <submissionId>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/verify-admin-report.ts 32758d88-7cb3-4e69-b6a4-c0936cf6aba6');
  process.exit(1);
}

async function verify() {
  try {
    // Check if assessment exists and has admin report
    const response = await fetch(`${BASE_URL}/api/assessments/${submissionId}/report`);
    const data = await response.json();
    
    console.log('\n📊 Assessment Report Status\n');
    console.log('='.repeat(60));
    
    if (data.report) {
      console.log('✅ Customer Report: Generated');
      console.log(`   Sections: ${Object.keys(data.report).length}`);
    } else {
      console.log('❌ Customer Report: Not found');
    }
    
    if (data.roi) {
      console.log('✅ ROI Calculation: Generated');
      console.log(`   Annual Savings: $${data.roi.totalAnnualSavings?.toLocaleString() || 'N/A'}`);
    }
    
    if (data.score) {
      console.log('✅ Opportunity Score: Generated');
      console.log(`   Score: ${data.score.percentage}% (${data.score.grade})`);
    }
    
    if (data.auditTrail) {
      console.log('✅ Audit Trail: Generated');
      console.log(`   Actions: ${data.auditTrail.reportGeneration?.entries?.length || 0}`);
      console.log(`   Claude Queries: ${data.auditTrail.summary?.totalClaudeQueries || 0}`);
      console.log(`   ATLAS Queries: ${data.auditTrail.summary?.totalAtlasQueries || 0}`);
      console.log(`   Firecrawl Actions: ${data.auditTrail.summary?.totalFirecrawlActions || 0}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 To view the admin report, log into the admin dashboard and click the briefcase icon.');
    console.log(`\n🔗 Links:`);
    console.log(`   Customer Report: ${BASE_URL}/assessment/report/${submissionId}`);
    console.log(`   Admin Dashboard: ${BASE_URL}/admin/dashboard`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

verify();

