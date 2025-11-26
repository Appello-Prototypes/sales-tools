// Diagnostic script to check why assessments might not appear in dashboard

async function diagnoseDashboard() {
  console.log('🔍 Dashboard Diagnostics\n');
  
  try {
    // Check MongoDB directly
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    console.log('1. Checking MongoDB assessments...\n');
    const { stdout } = await execAsync(
      `mongosh appello-assessment --quiet --eval "db.assessments.find({}).sort({createdAt: -1}).limit(5).forEach(doc => print(JSON.stringify({id: doc.submissionId.substring(0,8), status: doc.status, score: doc.opportunityScore, grade: doc.opportunityGrade, priority: doc.opportunityPriority, company: doc.companyName || 'N/A', createdAt: doc.createdAt}, null, 2)))"`
    );
    console.log(stdout);
    
    console.log('\n2. Testing Admin API (requires auth cookie)...');
    console.log('   Run this in browser console after logging in:');
    console.log('   fetch("/api/admin/assessments?status=completed").then(r => r.json()).then(console.log)');
    
    console.log('\n3. Testing Public Assessment API...');
    const response = await fetch('http://localhost:3002/api/assessments/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ Start endpoint works');
      console.log(`   Submission ID: ${data.submissionId}`);
    } else {
      console.log(`   ✗ Start endpoint failed: ${response.status}`);
    }
    
    console.log('\n✅ Diagnostics complete');
    console.log('\nNext steps:');
    console.log('1. Complete an assessment form manually');
    console.log('2. Check browser console for errors');
    console.log('3. Check Network tab for API responses');
    console.log('4. Verify assessment appears in MongoDB');
    console.log('5. Login to admin dashboard and check if it appears');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

diagnoseDashboard();

