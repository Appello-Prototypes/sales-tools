// Fake data generators (extracted for reuse)

export const fakeNames = [
  'John Smith',
  'Sarah Johnson',
  'Mike Williams',
  'Emily Davis',
  'David Brown',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Martinez',
];

export const fakeEmails = [
  'john.smith@example.com',
  'sarah.j@contractor.com',
  'mike.williams@buildco.com',
  'emily.davis@mechanical.com',
  'david.brown@hvacpro.com',
  'lisa.anderson@insulation.com',
  'robert.taylor@plumbing.com',
  'jennifer.martinez@electrical.com',
];

export const trades = [
  'Mechanical Insulation',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Fire Protection',
  'General Mechanical',
];

export const fieldWorkerRanges = ['1-19', '20-49', '50-99', '100-249', '250+'];
export const roles = [
  'Owner/CEO',
  'Operations Manager',
  'Project Manager',
  'Office Administrator',
  'Estimator',
];

export const painPoints = [
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

export const hoursPerWeekOptions = [
  'Less than 5 hours/week',
  '5-10 hours/week',
  '10-20 hours/week',
  '20+ hours/week',
  'Not sure, but it feels like too much',
];

export const timesheetMethods = [
  'Paper forms',
  'Excel/Spreadsheets',
  'Mobile app (basic)',
  'Dedicated timesheet software',
];

export const unionizedOptions = [
  'Yes, we are unionized',
  'No, we are open shop',
  'Mix of union and non-union',
];

export const accountingSoftware = [
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

export const payrollSoftware = [
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

export const constructionSoftware = [
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

export const notDoingOptions = [
  'Job costing',
  'Equipment tracking',
  'Material management',
  'Project management',
  'Document management',
];

export const demoFocusOptions = [
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

export const evaluators = [
  'Just me',
  'Other owners/partners',
  'Operations/Project managers',
  'Office/admin staff',
  'Field supervisors/foremen',
  'Accountant/bookkeeper',
  'IT person',
];

export const techComfort = [
  'Very comfortable',
  'Somewhat comfortable',
  'Not very comfortable',
];

export const smartphones = [
  'Yes, all workers',
  'Yes, most workers',
  'Yes, some workers',
  'No, not many workers',
];

export const timelines = [
  'Researching now, no timeline',
  'Within 1 month',
  '1-3 months',
  '3-6 months',
  '6+ months',
];

export const evaluatingOptions = [
  'Not looking at alternatives yet',
  'Procore',
  'Buildertrend',
  'Jonas',
  'Foundation',
  'Sage Contractor',
  'ComputerEase',
  'Other',
];

export const nextStepsOptions = [
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

export function generateFakeAssessment() {
  // Use Rival Insulation as test data
  const name = 'Chris Tremberth'; // CEO from website
  const email = 'chris@rivalinsulation.com';
  const companyName = 'Rival Insulation';
  const website = 'https://rivalinsulation.com';
  const trade = 'Mechanical Insulation'; // From website
  const fieldWorkers = '20-49'; // Estimated based on company size
  const role = 'Owner/CEO';
  
  return {
    name,
    email,
    companyName,
    website,
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

