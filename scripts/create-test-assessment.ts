/**
 * Create Test Assessment Script
 * 
 * Generates and submits a complete fake assessment for testing purposes
 * Run with: npx tsx scripts/create-test-assessment.ts
 */

import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fake data generators
const fakeNames = [
  'John Smith',
  'Sarah Johnson',
  'Mike Williams',
  'Emily Davis',
  'David Brown',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Martinez',
];

const fakeEmails = [
  'john.smith@example.com',
  'sarah.j@contractor.com',
  'mike.williams@buildco.com',
  'emily.davis@mechanical.com',
  'david.brown@hvacpro.com',
  'lisa.anderson@insulation.com',
  'robert.taylor@plumbing.com',
  'jennifer.martinez@electrical.com',
];

const trades = [
  'Mechanical Insulation',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Fire Protection',
  'General Mechanical',
];

const fieldWorkerRanges = ['1-19', '20-49', '50-99', '100-249', '250+'];
const roles = [
  'Owner/CEO',
  'Operations Manager',
  'Project Manager',
  'Office Administrator',
  'Estimator',
];

const painPoints = [
  'Time tracking and payroll processing takes too long (especially union/complex wage rules)',
  'Can\'t see job profitability in real-time (always looking backwards)',
  'Invoicing and progress billing is manual/slow (delays cash flow)',
  'Poor communication between field and office (things fall through cracks)',
  'Estimating is inconsistent or takes too long',
  'Can\'t track worker locations or equipment (where is everything?)',
  'Losing money on jobs but don\'t know why',
  'Paper forms and documents everywhere (hard to find, easy to lose)',
  'Scheduling conflicts and crew allocation issues',
  'Change orders fall through the cracks (leaving money on the table)',
];

const hoursPerWeekOptions = [
  'Less than 5 hours/week',
  '5-10 hours/week',
  '10-20 hours/week',
  '20+ hours/week',
  'Not sure, but it feels like too much',
];

const timesheetMethods = [
  'Paper forms',
  'Excel/Spreadsheets',
  'Mobile app (basic)',
  'Dedicated timesheet software',
];

const unionizedOptions = [
  'Yes, we are unionized',
  'No, we are open shop',
  'Mix of union and non-union',
];

const accountingSoftware = [
  'QuickBooks Desktop',
  'QuickBooks Online',
  'Sage 50',
  'Sage 100',
  'Sage 300',
  'Sage Intacct',
  'Spectrum by Viewpoint',
  'Vista by Viewpoint',
  'Foundation Construction Software',
  'ComputerEase',
  'NetSuite',
  'Microsoft Dynamics Business Central',
  'Xero',
  'FreshBooks',
  'Wave',
  'Excel/Manual',
  'Other',
];

const payrollSoftware = [
  'Dayforce Powerpay',
  'Payroll for Construction',
  'QuickBooks Payroll',
  'ADP',
  'Paychex',
  'Paycor',
  'Gusto',
  'BambooHR',
  'Workday',
  'Sage Payroll',
  'Spectrum Payroll',
  'Vista Payroll',
  'Foundation Payroll',
  'Excel/Manual',
  'Same as accounting software (integrated)',
  'Other',
];

const constructionSoftware = [
  'Procore',
  'Buildertrend',
  'Jonas Premier',
  'Foundation Construction Software',
  'Autodesk Construction Cloud',
  'BuildOps',
  'ServiceTitan',
  'Simpro',
  'Contractor Foreman',
  'Knowify',
  'Workyard',
  'Fieldwire',
  'SiteDocs',
  'ConnectTeam',
  'Bridgit Bench',
  'CoConstruct',
  'JobNimbus',
  'RedTeam',
  'eSub',
  'No, using paper/Excel',
  'Other',
];

const notDoingOptions = [
  'Job costing',
  'Equipment tracking',
  'Material management',
  'Project management',
  'Document management',
];

const demoFocusOptions = [
  'Mobile timesheets and GPS tracking (including union/complex wage rules)',
  'Job costing and profitability reports (real-time visibility)',
  'Scheduling and dispatch',
  'Estimating and proposals',
  'Invoicing and progress billing',
  'Purchase orders and material management',
  'Work orders and service work (time & materials tracking)',
  'Field forms and safety inspections',
  'Document storage and access',
  'Customer/project management',
  'Equipment and asset tracking',
  'AI-powered insights and automated reporting (Appello Apex)',
  'Advanced analytics and business intelligence',
  'Integration with accounting software',
  'Show me everything!',
];

const evaluators = [
  'Just me',
  'Other owners/partners',
  'Operations/Project managers',
  'Office/admin staff',
  'Field supervisors/foremen',
  'Accountant/bookkeeper',
  'IT person',
];

const techComfort = [
  'Very comfortable',
  'Somewhat comfortable',
  'Not very comfortable',
];

const smartphones = [
  'Yes, all workers',
  'Yes, most workers',
  'Yes, some workers',
  'No, not many workers',
];

const timelines = [
  'Researching now, no timeline',
  'Within 1 month',
  '1-3 months',
  '3-6 months',
  '6+ months',
];

const evaluatingOptions = [
  'Not looking at alternatives yet',
  'Procore',
  'Buildertrend',
  'Jonas',
  'Foundation',
  'Sage Contractor',
  'ComputerEase',
  'Other',
];

const nextStepsOptions = [
  'Pricing information',
  'Talk to a reference customer (similar trade/size)',
  'Internal team buy-in (we can help with that)',
  'See how it integrates with our accounting software',
  'Proof of ROI/business case',
  'Custom demo for other stakeholders',
  'Understanding implementation timeline',
  'Security/compliance documentation',
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateFakeAssessment() {
  const name = randomChoice(fakeNames);
  const email = randomChoice(fakeEmails);
  const trade = randomChoice(trades);
  const fieldWorkers = randomChoice(fieldWorkerRanges);
  const role = randomChoice(roles);
  
  return {
    name,
    email,
    section1: {
      trade,
      fieldWorkers,
      role,
    },
    section2: {
      painPoints: randomChoices(painPoints, 2, 5),
      magicWand: `I wish I could ${randomChoice([
        'automate all administrative tasks so I can focus on growing the business',
        'see real-time job profitability and make better decisions',
        'eliminate paper forms and have everything digital',
        'track my field workers and equipment in real-time',
        'get better insights from my data to improve operations',
        'reduce the time spent on payroll and timesheet processing',
      ])}`,
      urgency: Math.floor(Math.random() * 5) + 6, // 6-10
      hoursPerWeek: randomChoice(hoursPerWeekOptions),
    },
    section3: {
      timesheetMethod: randomChoice(timesheetMethods),
      unionized: randomChoice(unionizedOptions),
      accountingSoftware: randomChoice(accountingSoftware),
      payrollSoftware: randomChoice(payrollSoftware),
      constructionSoftware: randomChoice(constructionSoftware),
      notDoing: randomChoices(notDoingOptions, 1, 3),
    },
    section4: {
      demoFocus: randomChoices(demoFocusOptions, 2, 4),
      evaluators: randomChoices(evaluators, 1, 2),
      techComfort: randomChoice(techComfort),
      smartphones: randomChoice(smartphones),
    },
    section5: {
      timeline: randomChoice(timelines),
      evaluating: randomChoices(evaluatingOptions, 0, 3),
      nextSteps: randomChoices(nextStepsOptions, 2, 4),
      likelihood: Math.floor(Math.random() * 4) + 7, // 7-10
      specificQuestions: Math.random() > 0.5 
        ? 'How does this integrate with QuickBooks? What is the implementation timeline?'
        : undefined,
    },
  };
}

async function createTestAssessment() {
  try {
    console.log('🚀 Creating test assessment...\n');

    // Step 1: Start assessment
    console.log('Step 1: Starting assessment...');
    const startResponse = await fetch(`${API_BASE_URL}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!startResponse.ok) {
      const error = await startResponse.json();
      throw new Error(`Failed to start assessment: ${error.error || startResponse.statusText}`);
    }

    const { submissionId } = await startResponse.json();
    console.log(`✅ Assessment started with ID: ${submissionId}\n`);

    // Generate fake data
    const fakeData = generateFakeAssessment();
    console.log('📝 Generated fake data:');
    console.log(`   Name: ${fakeData.name}`);
    console.log(`   Email: ${fakeData.email}`);
    console.log(`   Trade: ${fakeData.section1.trade}`);
    console.log(`   Field Workers: ${fakeData.section1.fieldWorkers}`);
    console.log(`   Role: ${fakeData.section1.role}\n`);

    // Step 2: Save each section
    console.log('Step 2: Saving sections...');
    for (let step = 1; step <= 5; step++) {
      const sectionKey = `section${step}` as keyof typeof fakeData;
      const sectionData = fakeData[sectionKey];
      
      if (sectionData) {
        const saveResponse = await fetch(`${API_BASE_URL}/api/assessments/${submissionId}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step,
            data: {
              [sectionKey]: sectionData,
            },
          }),
        });

        if (!saveResponse.ok) {
          const error = await saveResponse.json();
          throw new Error(`Failed to save step ${step}: ${error.error || saveResponse.statusText}`);
        }

        console.log(`   ✅ Step ${step} saved`);
      }
    }

    // Step 3: Submit assessment
    console.log('\nStep 3: Submitting assessment...');
    const submitResponse = await fetch(`${API_BASE_URL}/api/assessments/${submissionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fakeData),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      throw new Error(`Failed to submit assessment: ${error.error || submitResponse.statusText}`);
    }

    const submitResult = await submitResponse.json();
    console.log('✅ Assessment submitted successfully!\n');

    console.log('📊 Results:');
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Assessment ID: ${submitResult.assessmentId}`);
    console.log(`   Opportunity Score: ${submitResult.score?.total || 'N/A'}`);
    console.log(`   Grade: ${submitResult.score?.grade || 'N/A'}`);
    console.log(`   Priority: ${submitResult.score?.priority || 'N/A'}`);
    console.log(`   Submitted At: ${submitResult.submittedAt}\n`);

    console.log('🔗 Links:');
    console.log(`   Customer Report: ${API_BASE_URL}/assessment/report/${submissionId}`);
    console.log(`   Admin Dashboard: ${API_BASE_URL}/admin/dashboard\n`);

    return {
      submissionId,
      ...submitResult,
    };
  } catch (error: any) {
    console.error('❌ Error creating test assessment:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createTestAssessment()
    .then(() => {
      console.log('✅ Test assessment creation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { createTestAssessment, generateFakeAssessment };

