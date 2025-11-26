// Using any for now since AssessmentData structure may differ from DB model
type AssessmentData = any;
import { ROICalculation } from '../roi/roiCalculator';
import { OpportunityScore } from '../scoring/opportunityScorer';

export interface CustomerReport {
  companyName?: string;
  trade: string;
  fieldWorkers: string;
  
  // Pain Summary
  topPainPoints: string[];
  magicWand: string;
  urgency: number;
  
  // Cost Analysis
  timeCost: {
    hoursPerWeek: number;
    hoursPerYear: number;
    costPerYear: number;
  };
  moneyCost: {
    profitMarginLoss: number;
    changeOrderLoss: number;
    complianceCosts: number;
    total: number;
  };
  totalCost: number;
  
  // Appello Solution
  appelloSolutions: Array<{
    painPoint: string;
    solution: string;
    savings: number;
  }>;
  
  // ROI
  appelloInvestment: number;
  annualSavings: number;
  netValue: number;
  roiPercentage: number;
  paybackMonths: number;
  
  // Vision ("Carrot")
  vision: {
    title: string;
    before: string[];
    after: string[];
    impact: string;
  };
  
  // Next Steps
  recommendedDemoFocus: string[];
  timeline: string;
}

export function generateCustomerReport(
  data: AssessmentData,
  roi: ROICalculation,
  score: OpportunityScore
): CustomerReport {
  const topPainPoints = (data.section2?.painPoints || []).slice(0, 5);
  const demoFocus = data.section4?.demoFocus || [];
  
  // Generate vision based on their pain points
  const vision = generateVision(data, roi);
  
  return {
    companyName: data.companyName,
    trade: data.section1?.trade || 'ICI Contractor',
    fieldWorkers: data.section1?.fieldWorkers || '',
    topPainPoints,
    magicWand: data.section2?.magicWand || '',
    urgency: data.section2?.urgency || 5,
    timeCost: {
      hoursPerWeek: roi.hoursPerWeek,
      hoursPerYear: roi.hoursPerYear,
      costPerYear: roi.timeCostPerYear,
    },
    moneyCost: {
      profitMarginLoss: roi.profitMarginLoss,
      changeOrderLoss: roi.changeOrderLoss,
      complianceCosts: roi.complianceCosts,
      total: roi.profitMarginLoss + roi.changeOrderLoss + roi.complianceCosts,
    },
    totalCost: roi.totalAnnualCost,
    appelloSolutions: roi.painPointCosts.map((cost) => ({
      painPoint: cost.painPoint,
      solution: cost.appelloSolution,
      savings: cost.savings,
    })),
    appelloInvestment: roi.appelloInvestment.total,
    annualSavings: roi.totalAnnualSavings,
    netValue: roi.netAnnualValue,
    roiPercentage: roi.roiPercentage,
    paybackMonths: roi.paybackMonths,
    vision,
    recommendedDemoFocus: demoFocus.length > 0 ? demoFocus.slice(0, 3) : [],
    timeline: data.section5?.timeline || '',
  };
}

function generateVision(data: AssessmentData, roi: ROICalculation): {
  title: string;
  before: string[];
  after: string[];
  impact: string;
} {
  const painPoints = data.section2?.painPoints || [];
  const magicWand = data.section2?.magicWand || '';
  
  const before: string[] = [];
  const after: string[] = [];
  
  // Generate before/after based on pain points
  if (painPoints.some((p: string) => p.includes('Time tracking') || p.includes('payroll'))) {
    before.push('Spending 15+ hours/week processing timesheets and payroll');
    after.push('Automated timesheets reduce payroll processing to <2 hours/week');
  }
  
  if (painPoints.some((p: string) => p.includes('job profitability'))) {
    before.push('Finding out jobs are over budget weeks after it\'s too late');
    after.push('Real-time job costing shows profitability daily - catch issues early');
  }
  
  if (painPoints.some((p: string) => p.includes('Material ordering'))) {
    before.push('Chaotic material requests, lost POs, and cost tracking nightmares');
    after.push('Streamlined material request → PO → receiving workflow with automatic cost posting');
  }
  
  if (painPoints.some((p: string) => p.includes('Change orders'))) {
    before.push('Change orders fall through cracks - leaving money on the table');
    after.push('Capture 100% of billable change orders with mobile documentation');
  }
  
  if (painPoints.some((p: string) => p.includes('Paper forms'))) {
    before.push('Paper forms everywhere - hard to find, easy to lose');
    after.push('All forms digital, searchable, and audit-ready in one place');
  }
  
  if (painPoints.some((p: string) => p.includes('Scheduling'))) {
    before.push('Scheduling conflicts and crew allocation headaches');
    after.push('Automated scheduling with certification cross-referencing prevents conflicts');
  }
  
  // Default if no specific matches
  if (before.length === 0) {
    before.push('Manual processes eating into your margins');
    before.push('Multiple disconnected systems creating chaos');
    after.push('One integrated platform streamlining all operations');
    after.push('Automated workflows saving time and reducing errors');
  }
  
  // Impact statement
  const impact = `Save ${Math.round(roi.hoursPerWeek)} hours/week and ${formatCurrency(roi.totalAnnualSavings)} annually while improving job profitability by ${Math.round((roi.profitImprovement / roi.revenueLoss) * 100)}%`;
  
  return {
    title: magicWand || 'Transform Your Operations with Appello',
    before,
    after,
    impact,
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

