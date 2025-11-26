import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { verifyAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { calculateOpportunityScore } from '@/lib/scoring/opportunityScorer';
import { calculateROI } from '@/lib/roi/roiCalculator';
import { generateCustomerReport } from '@/lib/reports/reportGenerator';
import { enhanceReportWithAI } from '@/lib/ai/reportGenerator';
import { researchCompany } from '@/lib/ai/researchService';
import { generateAdminReport } from '@/lib/reports/adminReportGenerator';
import { createDebugLog, logSubmission, logScoring, logROI, logReport, logAI, finalizeDebugLog, logError } from '@/lib/debug/assessmentLogger';

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

import { generateFakeAssessment } from './fakeData';

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateFakeAssessmentOld() {
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

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Generate fake assessment data
    const fakeData = generateFakeAssessmentOld();
    
    // Create new assessment
    const submissionId = uuidv4();
    const startedAt = new Date();
    
    const assessment = new Assessment({
      submissionId,
      name: fakeData.name,
      email: fakeData.email,
      startedAt,
      status: 'in_progress',
      currentStep: 1,
      section1: {},
      section2: {},
      section3: {},
      section4: {},
      section5: {},
    });
    
    await assessment.save();
    
    // Update all sections
    assessment.section1 = fakeData.section1;
    assessment.section2 = fakeData.section2;
    assessment.section3 = fakeData.section3;
    assessment.section4 = fakeData.section4;
    assessment.section5 = fakeData.section5;
    
    // Calculate time to complete (simulate 2-5 minutes)
    const completedAt = new Date();
    const timeToComplete = Math.floor(Math.random() * 180) + 120; // 2-5 minutes
    
    assessment.completedAt = completedAt;
    assessment.timeToComplete = timeToComplete;
    assessment.status = 'completed';
    assessment.currentStep = 5;
    
    await assessment.save();
    
    // Calculate and store opportunity score
    const data = {
      section1: assessment.section1,
      section2: assessment.section2,
      section3: assessment.section3,
      section4: assessment.section4,
      section5: assessment.section5,
    };
    const score = await calculateOpportunityScore(data);
    
    assessment.opportunityScore = score.totalScore;
    assessment.opportunityGrade = score.grade;
    assessment.opportunityPriority = score.priority;
    await assessment.save();
    
    // Generate comprehensive reports (same flow as submit route)
    const debugLog = createDebugLog(submissionId);
    let auditTrail = null;
    let adminReport = null;
    let reportGenerated = false;
    
    try {
      logReport(submissionId, 'Starting comprehensive report generation');
      
      const data = {
        submissionId: assessment.submissionId,
        name: assessment.name,
        email: assessment.email,
        companyName: assessment.companyName,
        section1: assessment.section1,
        section2: assessment.section2,
        section3: assessment.section3,
        section4: assessment.section4,
        section5: assessment.section5,
      };
      
      // Calculate ROI
      logROI(submissionId, 'Calculating ROI', { fieldWorkers: data.section1?.fieldWorkers, painPoints: data.section2?.painPoints?.length });
      const roi = calculateROI(data);
      
      // Step 1: Conduct comprehensive company research
      logAI(submissionId, 'Starting comprehensive company research', {
        companyName: assessment.companyName || assessment.name,
        email: assessment.email,
        trade: data.section1?.trade,
      });
      
      const { createAuditTrail } = await import('@/lib/ai/auditTrail');
      const researchAuditTrail = createAuditTrail();
      
      const companyResearch = await researchCompany({
        ...data,
        companyName: (assessment as any).companyName || (data as any).companyName,
        website: (assessment as any).website || (data as any).website,
      }, researchAuditTrail);
      
      logAI(submissionId, 'Company research completed', {
        websiteFound: !!companyResearch.website,
        competitorsFound: companyResearch.competitors?.length || 0,
        atlasResults: companyResearch.atlasIntelligence?.similarCustomers?.length || 0,
      });
      
      // Step 2: Generate Customer Report
      logReport(submissionId, 'Generating customer-facing report');
      const baseReport = generateCustomerReport(data, roi, score);
      
      // Enhance customer report with AI
      logAI(submissionId, 'Enhancing customer report with AI');
      const customerReportResult = await enhanceReportWithAI(baseReport, data);
      auditTrail = customerReportResult.auditTrail;
      
      // Merge research audit trail
      if (auditTrail && researchAuditTrail) {
        // Merge entries from research audit trail
        if (researchAuditTrail.reportGeneration?.entries) {
          auditTrail.reportGeneration.entries.push(...researchAuditTrail.reportGeneration.entries);
        }
        // Merge summary counts
        if (researchAuditTrail.summary) {
          auditTrail.summary.totalClaudeQueries += researchAuditTrail.summary.totalClaudeQueries || 0;
          auditTrail.summary.totalAtlasQueries += researchAuditTrail.summary.totalAtlasQueries || 0;
          auditTrail.summary.totalFirecrawlActions += researchAuditTrail.summary.totalFirecrawlActions || 0;
          auditTrail.summary.errors += researchAuditTrail.summary.errors || 0;
          // Merge token usage
          if (researchAuditTrail.summary.totalTokensUsed && auditTrail.summary.totalTokensUsed) {
            auditTrail.summary.totalTokensUsed.input += researchAuditTrail.summary.totalTokensUsed.input || 0;
            auditTrail.summary.totalTokensUsed.output += researchAuditTrail.summary.totalTokensUsed.output || 0;
            auditTrail.summary.totalTokensUsed.thinking += researchAuditTrail.summary.totalTokensUsed.thinking || 0;
          }
        }
      }
      
      // Step 3: Generate Admin/Sales Intelligence Report
      logReport(submissionId, 'Generating admin/sales intelligence report');
      adminReport = generateAdminReport(data, score, roi, companyResearch);
      
      logReport(submissionId, 'Admin report generated', {
        competitors: adminReport.competitiveIntelligence.competitors.length,
        nextSteps: adminReport.salesIntelligence.nextSteps.length,
      });
      
      // Finalize audit trail
      const { finalizeAuditTrail } = await import('@/lib/ai/auditTrail');
      if (auditTrail) {
        finalizeAuditTrail(auditTrail);
      }
      
      // Save everything to database
      assessment.auditTrail = auditTrail;
      assessment.debugLog = debugLog;
      assessment.adminReport = adminReport;
      assessment.customerReport = customerReportResult.report;
      assessment.customerReportGeneratedAt = new Date();
      await assessment.save();
      
      finalizeDebugLog(submissionId);
      reportGenerated = true;
      
      console.log('✅ Comprehensive reports generated successfully');
      
    } catch (error: any) {
      logError(submissionId, 'report', 'Error generating reports', error);
      console.error('❌ Error generating reports:', error);
      // Continue even if report generation fails
    }
    
    return NextResponse.json({
      success: true,
      submissionId,
      assessmentId: assessment._id.toString(),
      submittedAt: completedAt.toISOString(),
      reportUrl: `/assessment/report/${submissionId}`,
      adminUrl: `/admin/assessments/${submissionId}`,
      score: {
        total: score.totalScore,
        grade: score.grade,
        priority: score.priority,
      },
      data: {
        name: fakeData.name,
        email: fakeData.email,
        trade: fakeData.section1.trade,
        fieldWorkers: fakeData.section1.fieldWorkers,
        role: fakeData.section1.role,
      },
      reportGenerated,
      auditTrailGenerated: !!auditTrail,
      adminReportGenerated: !!adminReport,
      adminReportUrl: adminReport ? `/admin/reports/${submissionId}` : undefined,
    });
  } catch (error: any) {
    console.error('Error creating test assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create test assessment', details: error.message },
      { status: 500 }
    );
  }
}

