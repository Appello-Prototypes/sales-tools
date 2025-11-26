import mongoose from 'mongoose';
import Assessment from '../models/Assessment';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appello-assessment';

const testScenarios = [
  {
    name: 'Large Union Insulation Contractor',
    companyName: 'Thermal Solutions Inc.',
    section1: {
      trade: 'Mechanical Insulation',
      fieldWorkers: '100-249',
      role: 'Owner/CEO',
    },
    section2: {
      painPoints: [
        'Time tracking/payroll processing delays',
        'Job profitability visibility (finding out too late)',
        'Union payroll complexity (multiple CBAs)',
        'Material ordering and cost tracking',
        'Change order capture and billing',
      ],
      magicWand: 'Automated union payroll that handles all our CBAs without manual calculations',
      urgency: 9,
      hoursPerWeek: '20+',
    },
    section3: {
      timesheetMethod: 'Paper timesheets',
      unionized: 'Yes, fully unionized',
      cbaCount: '6+',
      unions: ['SMWIA', 'UA', 'IUPAT'],
      accountingSoftware: 'Sage 100',
      payrollSoftware: 'Dayforce Powerpay',
      constructionSoftware: 'No, using paper/Excel',
      notDoing: [
        'Job costing/tracking (real-time visibility)',
        'Material ordering and procurement (formal process)',
        'Business intelligence/advanced analytics',
      ],
    },
    section4: {
      demoFocus: [
        'Union payroll calculations',
        'Real-time job costing',
        'Material management workflow',
      ],
      evaluators: ['Owner', 'Operations Manager', 'Office Manager'],
      techComfort: 'Comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: 'Within 1 month',
      evaluating: ['Procore', 'Foundation Construction Software'],
      nextSteps: ['Pricing information', 'See how it integrates with Sage 100'],
      likelihood: 9,
      specificQuestions: 'How does it handle multi-CBA scenarios with different wage rates?',
    },
  },
  {
    name: 'Small Non-Union HVAC Contractor',
    companyName: 'Comfort Air Systems',
    section1: {
      trade: 'HVAC',
      fieldWorkers: '1-19',
      role: 'Owner',
    },
    section2: {
      painPoints: [
        'Scheduling conflicts and crew allocation',
        'Invoicing/billing delays',
        'Paper forms everywhere',
      ],
      magicWand: 'Stop losing paperwork and get paid faster',
      urgency: 7,
      hoursPerWeek: '5-10',
    },
    section3: {
      timesheetMethod: 'Excel spreadsheets',
      unionized: 'No, we are an open shop',
      accountingSoftware: 'QuickBooks Online',
      payrollSoftware: 'QuickBooks Payroll',
      constructionSoftware: 'No, using paper/Excel',
      notDoing: [
        'Project scheduling (formal system)',
        'Document management (centralized)',
        'Safety forms/inspections (digital)',
      ],
    },
    section4: {
      demoFocus: [
        'Scheduling and crew management',
        'Digital forms',
        'Invoicing automation',
      ],
      evaluators: ['Owner'],
      techComfort: 'Somewhat comfortable',
      smartphones: 'Yes, most crew members have smartphones',
    },
    section5: {
      timeline: '1-3 months',
      evaluating: ['Buildertrend', 'ServiceTitan'],
      nextSteps: ['See how it works', 'Pricing information'],
      likelihood: 7,
      specificQuestions: 'Can we start with just scheduling and forms?',
    },
  },
  {
    name: 'Mid-Size Mixed Union Plumbing Contractor',
    companyName: 'Precision Plumbing Services',
    section1: {
      trade: 'Plumbing',
      fieldWorkers: '20-49',
      role: 'Operations Manager',
    },
    section2: {
      painPoints: [
        'Service work tracking (time & materials)',
        'Work orders getting lost',
        'Field-office communication',
        'Equipment tracking',
      ],
      magicWand: 'Track service work and bill accurately without losing work orders',
      urgency: 8,
      hoursPerWeek: '10-20',
    },
    section3: {
      timesheetMethod: 'Mobile app (current system)',
      unionized: 'Yes, mixed union and non-union workforce',
      cbaCount: '2-3',
      unions: ['UA'],
      accountingSoftware: 'QuickBooks Desktop',
      payrollSoftware: 'ADP',
      constructionSoftware: 'Yes - ServiceTitan',
      notDoing: [
        'Work orders/service work tracking (time & materials)',
        'Equipment tracking',
      ],
    },
    section4: {
      demoFocus: [
        'Work orders and service work',
        'Time & materials billing',
        'Equipment management',
      ],
      evaluators: ['Operations Manager', 'Office Manager'],
      techComfort: 'Very comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: '1-3 months',
      evaluating: ['ServiceTitan (upgrade)', 'Not looking at alternatives yet'],
      nextSteps: ['See how it integrates', 'Compare to current system'],
      likelihood: 8,
      specificQuestions: 'How does this compare to ServiceTitan for service work?',
    },
  },
  {
    name: 'Large Electrical Contractor - Government Work',
    companyName: 'National Electric Contractors',
    section1: {
      trade: 'Electrical',
      fieldWorkers: '250+',
      role: 'VP Operations',
    },
    section2: {
      painPoints: [
        'Compliance and safety documentation',
        'Certification tracking and renewals',
        'Government contract requirements (COR, WH-347)',
        'Job costing/tracking (real-time visibility)',
      ],
      magicWand: 'Automated compliance tracking that keeps us audit-ready',
      urgency: 10,
      hoursPerWeek: '20+',
    },
    section3: {
      timesheetMethod: 'Digital system (current)',
      unionized: 'Yes, fully unionized',
      cbaCount: '4-5',
      unions: ['IBEW'],
      accountingSoftware: 'Sage Intacct',
      payrollSoftware: 'Spectrum Payroll',
      constructionSoftware: 'Yes - Procore',
      notDoing: [
        'Business intelligence/advanced analytics',
        'Automated compliance reporting',
      ],
    },
    section4: {
      demoFocus: [
        'Safety & compliance tracking',
        'Government contract forms (COR, WH-347)',
        'Real-time job costing',
      ],
      evaluators: ['VP Operations', 'Safety Manager', 'CFO'],
      techComfort: 'Very comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: 'Within 1 month',
      evaluating: ['Procore (add-on)', 'Foundation Construction Software'],
      nextSteps: ['Pricing information', 'See compliance features', 'Integration demo'],
      likelihood: 9,
      specificQuestions: 'Does it handle COR and WH-347 forms automatically?',
    },
  },
  {
    name: 'Small Sheet Metal Contractor - Family Business',
    companyName: 'Metro Sheet Metal Works',
    section1: {
      trade: 'Sheet Metal',
      fieldWorkers: '1-19',
      role: 'Owner',
    },
    section2: {
      painPoints: [
        'Estimating (no formal system)',
        'Material waste and cost overruns',
        'Losing money on jobs',
      ],
      magicWand: 'Know if we\'re making money on a job before it\'s too late',
      urgency: 6,
      hoursPerWeek: 'Less than 5',
    },
    section3: {
      timesheetMethod: 'Paper timesheets',
      unionized: 'No, we are an open shop',
      accountingSoftware: 'QuickBooks Desktop',
      payrollSoftware: 'Same as accounting software (integrated)',
      constructionSoftware: 'No, using paper/Excel',
      notDoing: [
        'Estimating (digital system)',
        'Job costing/tracking (real-time visibility)',
        'Material ordering and procurement (formal process)',
      ],
    },
    section4: {
      demoFocus: [
        'Estimating',
        'Job costing',
        'Material management',
      ],
      evaluators: ['Owner'],
      techComfort: 'Somewhat comfortable',
      smartphones: 'Yes, most crew members have smartphones',
    },
    section5: {
      timeline: '3-6 months',
      evaluating: ['Not looking at alternatives yet'],
      nextSteps: ['Learn more about features'],
      likelihood: 6,
      specificQuestions: 'Is estimating included? How accurate is it?',
    },
  },
  {
    name: 'Mid-Size Fire Protection Contractor',
    companyName: 'SafeGuard Fire Systems',
    section1: {
      trade: 'Fire Protection',
      fieldWorkers: '50-99',
      role: 'General Manager',
    },
    section2: {
      painPoints: [
        'Change orders falling through cracks',
        'Billing delays',
        'Material ordering chaos',
        'Field-office communication',
      ],
      magicWand: 'Capture every change order and bill it quickly',
      urgency: 8,
      hoursPerWeek: '10-20',
    },
    section3: {
      timesheetMethod: 'Excel spreadsheets',
      unionized: 'Yes, mixed union and non-union workforce',
      cbaCount: '1',
      unions: ['UA'],
      accountingSoftware: 'Sage 50',
      payrollSoftware: 'Paychex',
      constructionSoftware: 'Yes - Jonas Premier',
      notDoing: [
        'Material ordering and procurement (formal process)',
        'Change order tracking',
      ],
    },
    section4: {
      demoFocus: [
        'Change order capture',
        'Material management',
        'Billing automation',
      ],
      evaluators: ['General Manager', 'Project Manager'],
      techComfort: 'Comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: '1-3 months',
      evaluating: ['Jonas Premier (upgrade)', 'Foundation Construction Software'],
      nextSteps: ['Pricing information', 'See change order workflow'],
      likelihood: 8,
      specificQuestions: 'How quickly can we capture and bill change orders?',
    },
  },
  {
    name: 'Large Multi-Trade Contractor',
    companyName: 'Integrated Mechanical Services',
    section1: {
      trade: 'Multi-Trade (HVAC, Plumbing, Insulation)',
      fieldWorkers: '250+',
      role: 'CEO',
    },
    section2: {
      painPoints: [
        'Multiple disconnected systems',
        'No unified view of operations',
        'Business intelligence/advanced analytics',
        'Job profitability visibility',
        'Material waste across divisions',
      ],
      magicWand: 'One platform that handles everything - no more juggling 5 different systems',
      urgency: 9,
      hoursPerWeek: '20+',
    },
    section3: {
      timesheetMethod: 'Digital system (current)',
      unionized: 'Yes, fully unionized',
      cbaCount: '6+',
      unions: ['SMWIA', 'UA', 'IBEW'],
      accountingSoftware: 'NetSuite',
      payrollSoftware: 'Workday',
      constructionSoftware: 'Yes - Autodesk Construction Cloud',
      notDoing: [
        'Business intelligence/advanced analytics',
        'Unified operations platform',
      ],
    },
    section4: {
      demoFocus: [
        'Integrated platform overview',
        'Business intelligence and analytics',
        'Multi-trade job management',
      ],
      evaluators: ['CEO', 'CFO', 'Operations Director'],
      techComfort: 'Very comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: '3-6 months',
      evaluating: ['Autodesk Construction Cloud (upgrade)', 'Procore'],
      nextSteps: ['See platform integration', 'ROI analysis', 'Pricing information'],
      likelihood: 7,
      specificQuestions: 'Can this replace our current systems? What\'s the migration path?',
    },
  },
  {
    name: 'Small Specialty Contractor - New Business',
    companyName: 'Elite Refrigeration Services',
    section1: {
      trade: 'Refrigeration',
      fieldWorkers: '1-19',
      role: 'Owner',
    },
    section2: {
      painPoints: [
        'No formal processes',
        'Everything is manual',
        'Growing pains',
      ],
      magicWand: 'Get organized before we grow too big to manage manually',
      urgency: 5,
      hoursPerWeek: 'Not sure',
    },
    section3: {
      timesheetMethod: 'No formal system',
      unionized: 'No, we are an open shop',
      accountingSoftware: 'QuickBooks Online',
      payrollSoftware: 'Gusto',
      constructionSoftware: 'No, using paper/Excel',
      notDoing: [
        'Project scheduling (formal system)',
        'Job costing/tracking (real-time visibility)',
        'Estimating (digital system)',
        'Invoicing/billing (automated)',
        'Document management (centralized)',
        'Safety forms/inspections (digital)',
      ],
    },
    section4: {
      demoFocus: [
        'Getting started basics',
        'Core features',
        'Mobile app for field',
      ],
      evaluators: ['Owner'],
      techComfort: 'Comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: '6+ months',
      evaluating: ['Not looking at alternatives yet'],
      nextSteps: ['Learn more about features'],
      likelihood: 5,
      specificQuestions: 'What\'s the best way to get started? Can we start small?',
    },
  },
  {
    name: 'Mid-Size Insulation Contractor - High Growth',
    companyName: 'Advanced Insulation Solutions',
    section1: {
      trade: 'Mechanical Insulation',
      fieldWorkers: '50-99',
      role: 'President',
    },
    section2: {
      painPoints: [
        'Scaling operations',
        'Hiring and onboarding',
        'Certification tracking',
        'Job profitability visibility',
        'Material ordering at scale',
      ],
      magicWand: 'Scale from 50 to 150 employees without adding admin staff',
      urgency: 8,
      hoursPerWeek: '15-20',
    },
    section3: {
      timesheetMethod: 'Digital system (current)',
      unionized: 'Yes, mixed union and non-union workforce',
      cbaCount: '2-3',
      unions: ['SMWIA', 'UA'],
      accountingSoftware: 'Sage 100',
      payrollSoftware: 'Spectrum Payroll',
      constructionSoftware: 'Yes - Foundation Construction Software',
      notDoing: [
        'Business intelligence/advanced analytics',
        'Automated onboarding',
      ],
    },
    section4: {
      demoFocus: [
        'Scaling capabilities',
        'Certification management',
        'Business intelligence',
      ],
      evaluators: ['President', 'HR Manager', 'Operations Manager'],
      techComfort: 'Very comfortable with technology',
      smartphones: 'Yes, all crew members have smartphones',
    },
    section5: {
      timeline: '1-3 months',
      evaluating: ['Foundation Construction Software (upgrade)', 'Procore'],
      nextSteps: ['See scaling features', 'Pricing information', 'ROI analysis'],
      likelihood: 8,
      specificQuestions: 'How does this help us scale? What about onboarding new employees?',
    },
  },
  {
    name: 'Small Painting Contractor - Service Focus',
    companyName: 'Premier Paint & Coating',
    section1: {
      trade: 'Painting & Coating',
      fieldWorkers: '1-19',
      role: 'Owner',
    },
    section2: {
      painPoints: [
        'Service work tracking',
        'Time & materials billing',
        'Customer communication',
        'Scheduling conflicts',
      ],
      magicWand: 'Track service calls and bill accurately for time & materials work',
      urgency: 7,
      hoursPerWeek: '5-10',
    },
    section3: {
      timesheetMethod: 'Paper timesheets',
      unionized: 'No, we are an open shop',
      accountingSoftware: 'QuickBooks Online',
      payrollSoftware: 'QuickBooks Payroll',
      constructionSoftware: 'No, using paper/Excel',
      notDoing: [
        'Work orders/service work tracking (time & materials)',
        'Project scheduling (formal system)',
      ],
    },
    section4: {
      demoFocus: [
        'Work orders and service work',
        'Time & materials tracking',
        'Customer portal',
      ],
      evaluators: ['Owner'],
      techComfort: 'Somewhat comfortable',
      smartphones: 'Yes, most crew members have smartphones',
    },
    section5: {
      timeline: '1-3 months',
      evaluating: ['ServiceTitan', 'BuildOps'],
      nextSteps: ['See service work features', 'Pricing information'],
      likelihood: 7,
      specificQuestions: 'How does this handle time & materials billing for service calls?',
    },
  },
];

async function seedTestAssessments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`\nCreating ${testScenarios.length} test assessments...\n`);

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      const submissionId = uuidv4();
      
      const assessment = await Assessment.create({
        submissionId,
        companyName: scenario.companyName,
        section1: scenario.section1,
        section2: scenario.section2,
        section3: scenario.section3,
        section4: scenario.section4,
        section5: scenario.section5,
        status: 'completed',
        currentStep: 5,
        startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        completedAt: new Date(),
        timeToComplete: Math.floor(Math.random() * 1800 + 600), // 10-40 minutes
      });

      console.log(`✓ Created: ${scenario.name} (${scenario.companyName})`);
      console.log(`  Submission ID: ${submissionId}`);
      console.log(`  Trade: ${scenario.section1.trade}`);
      console.log(`  Field Workers: ${scenario.section1.fieldWorkers}`);
      console.log(`  Urgency: ${scenario.section2.urgency}/10`);
      console.log('');
    }

    console.log(`\n✅ Successfully created ${testScenarios.length} test assessments!`);
    console.log('\nYou can now view them in the admin dashboard at /admin/dashboard\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test assessments:', error);
    process.exit(1);
  }
}

seedTestAssessments();

