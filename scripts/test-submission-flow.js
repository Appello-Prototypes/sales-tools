// Simple Node.js script to test the submission flow
// Uses native fetch (Node 18+)

const BASE_URL = 'http://localhost:3002';

async function testSubmissionFlow() {
  console.log('🧪 Testing Assessment Submission Flow\n');
  
  try {
    // Step 1: Start assessment
    console.log('1. Starting assessment...');
    const startResponse = await fetch(`${BASE_URL}/api/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!startResponse.ok) {
      throw new Error(`Failed to start: ${startResponse.status}`);
    }
    
    const { submissionId } = await startResponse.json();
    console.log(`   ✓ Assessment started: ${submissionId}\n`);
    
    // Step 2: Save Step 1
    console.log('2. Saving Step 1 (Company Basics)...');
    const step1Data = {
      step: 1,
      data: {
        section1: {
          trade: 'Mechanical Insulation',
          fieldWorkers: '20-49',
          role: 'Owner/CEO',
        },
      },
    };
    
    const save1Response = await fetch(`${BASE_URL}/api/assessments/${submissionId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step1Data),
    });
    
    if (!save1Response.ok) {
      throw new Error(`Failed to save step 1: ${save1Response.status}`);
    }
    console.log('   ✓ Step 1 saved\n');
    
    // Step 3: Save Step 2
    console.log('3. Saving Step 2 (Pain Points)...');
    const step2Data = {
      step: 2,
      data: {
        section2: {
          painPoints: [
            'Time tracking/payroll processing delays',
            'Job profitability visibility (finding out too late)',
            'Material ordering and cost tracking',
          ],
          magicWand: 'Automated union payroll that handles all our CBAs',
          urgency: 8,
          hoursPerWeek: '10-20 hours/week',
        },
      },
    };
    
    const save2Response = await fetch(`${BASE_URL}/api/assessments/${submissionId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step2Data),
    });
    
    if (!save2Response.ok) {
      throw new Error(`Failed to save step 2: ${save2Response.status}`);
    }
    console.log('   ✓ Step 2 saved\n');
    
    // Step 4: Save Step 3
    console.log('4. Saving Step 3 (Current State)...');
    const step3Data = {
      step: 3,
      data: {
        section3: {
          timesheetMethod: 'Paper timesheets',
          unionized: 'Yes, fully unionized',
          cbaCount: '2-3',
          unions: ['SMWIA', 'UA'],
          accountingSoftware: 'QuickBooks Desktop',
          payrollSoftware: 'ADP',
          constructionSoftware: 'No, using paper/Excel',
          notDoing: [
            'Job costing/tracking (real-time visibility)',
            'Material ordering and procurement (formal process)',
          ],
        },
      },
    };
    
    const save3Response = await fetch(`${BASE_URL}/api/assessments/${submissionId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step3Data),
    });
    
    if (!save3Response.ok) {
      throw new Error(`Failed to save step 3: ${save3Response.status}`);
    }
    console.log('   ✓ Step 3 saved\n');
    
    // Step 5: Save Step 4
    console.log('5. Saving Step 4 (Demo Customization)...');
    const step4Data = {
      step: 4,
      data: {
        section4: {
          demoFocus: [
            'Union payroll calculations',
            'Real-time job costing',
          ],
          evaluators: ['Owner', 'Operations Manager'],
          techComfort: 'Comfortable with technology',
          smartphones: 'Yes, all crew members have smartphones',
        },
      },
    };
    
    const save4Response = await fetch(`${BASE_URL}/api/assessments/${submissionId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step4Data),
    });
    
    if (!save4Response.ok) {
      throw new Error(`Failed to save step 4: ${save4Response.status}`);
    }
    console.log('   ✓ Step 4 saved\n');
    
    // Step 6: Submit assessment
    console.log('6. Submitting assessment...');
    const submitData = {
      section1: step1Data.data.section1,
      section2: step2Data.data.section2,
      section3: step3Data.data.section3,
      section4: step4Data.data.section4,
      section5: {
        timeline: 'Within 1 month',
        evaluating: ['Procore'],
        nextSteps: ['Pricing information', 'See how it integrates'],
        likelihood: 8,
        specificQuestions: 'How does it handle multiple CBAs?',
      },
    };
    
    const submitResponse = await fetch(`${BASE_URL}/api/assessments/${submissionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Failed to submit: ${submitResponse.status} - ${errorText}`);
    }
    
    const submitResult = await submitResponse.json();
    console.log('   ✓ Assessment submitted successfully!');
    console.log(`   Score: ${submitResult.score.total}/100 (${submitResult.score.grade}) - ${submitResult.score.priority} Priority\n`);
    
    // Step 7: Verify in database
    console.log('7. Verifying in database...');
    const { exec } = require('child_process');
    exec(`mongosh appello-assessment --quiet --eval "db.assessments.findOne({submissionId: '${submissionId}'}, {status: 1, opportunityScore: 1, opportunityGrade: 1, opportunityPriority: 1})"`, (error, stdout, stderr) => {
      if (error) {
        console.log(`   ⚠ Could not verify: ${error.message}`);
      } else {
        console.log(`   ${stdout}`);
      }
    });
    
    // Step 8: Test admin API (without auth for now)
    console.log('\n8. Testing admin API...');
    console.log('   Note: Admin API requires authentication');
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   View in dashboard: ${BASE_URL}/admin/dashboard`);
    console.log(`   View report: ${BASE_URL}/assessment/report/${submissionId}\n`);
    
    console.log('✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSubmissionFlow();

