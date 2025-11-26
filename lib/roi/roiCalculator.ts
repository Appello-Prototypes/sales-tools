// Using any for now since AssessmentData structure may differ from DB model
type AssessmentData = any;

export interface ROICalculation {
  // Time Costs
  hoursPerWeek: number;
  hoursPerYear: number;
  timeCostPerYear: number;
  
  // Money Costs
  profitMarginLoss: number;
  revenueLoss: number;
  changeOrderLoss: number;
  complianceCosts: number;
  
  // Total Costs
  totalAnnualCost: number;
  
  // Appello Investment
  appelloInvestment: {
    software: number;
    onboarding: number;
    training: number;
    total: number;
  };
  
  // Savings with Appello
  timeSavings: number;
  profitImprovement: number;
  changeOrderCapture: number;
  complianceSavings: number;
  totalAnnualSavings: number;
  
  // ROI Metrics
  netAnnualValue: number;
  roiPercentage: number;
  paybackMonths: number;
  
  // Breakdown by Pain Point
  painPointCosts: Array<{
    painPoint: string;
    annualCost: number;
    appelloSolution: string;
    savings: number;
  }>;
}

/**
 * ROI Calculator based on assessment responses
 * Uses ATLAS insights and Appello ROI data
 */
export function calculateROI(data: AssessmentData): ROICalculation {
  const fieldWorkers = parseFieldWorkers(data.section1?.fieldWorkers || '');
  const hoursPerWeek = parseHoursPerWeek(data.section2?.hoursPerWeek || '');
  const painPoints = data.section2?.painPoints || [];
  const urgency = data.section2?.urgency || 5;
  
  // Estimate annual revenue based on field workers
  // Industry average: $100K-150K revenue per field worker
  const estimatedRevenue = fieldWorkers * 120000; // Conservative $120K per worker
  
  // Time Costs
  const hoursPerYear = hoursPerWeek * 52;
  const hourlyRate = 35; // Average admin rate (from ATLAS: $30-40/hr)
  const timeCostPerYear = hoursPerYear * hourlyRate;
  
  // Money Costs
  const profitMarginLossPercent = calculateProfitMarginLoss(painPoints, urgency);
  const profitMarginLoss = (estimatedRevenue * profitMarginLossPercent) / 100;
  
  const changeOrderLossPercent = painPoints.some((p: string) => p.includes('Change orders')) ? 8 : 0;
  const changeOrderLoss = (estimatedRevenue * changeOrderLossPercent) / 100;
  
  const complianceCosts = painPoints.some((p: string) => p.includes('Safety') || p.includes('compliance')) ? 15000 : 0;
  
  const totalAnnualCost = timeCostPerYear + profitMarginLoss + changeOrderLoss + complianceCosts;
  
  // Appello Investment
  const userCount = Math.max(fieldWorkers + 3, 10); // Field workers + 3 office staff, minimum 10
  const softwareCost = userCount * 10 * 12; // $10/user/month
  const onboardingCost = 6000; // One-time
  const trainingCost = 20 * hourlyRate; // 20 hours
  
  const appelloInvestment = {
    software: softwareCost,
    onboarding: onboardingCost,
    training: trainingCost,
    total: softwareCost + onboardingCost + trainingCost,
  };
  
  // Savings with Appello
  const timeSavingsPercent = 75; // 75% reduction (from ATLAS: Thermec case study)
  const timeSavings = timeCostPerYear * (timeSavingsPercent / 100);
  
  const profitImprovementPercent = Math.min(profitMarginLossPercent * 0.6, 8); // Recover 60% of loss, max 8%
  const profitImprovement = (estimatedRevenue * profitImprovementPercent) / 100;
  
  const changeOrderCapture = changeOrderLoss * 0.8; // Capture 80% of lost change orders
  
  const complianceSavings = complianceCosts * 0.7; // 70% reduction in compliance costs
  
  const totalAnnualSavings = timeSavings + profitImprovement + changeOrderCapture + complianceSavings;
  
  // ROI Metrics
  const netAnnualValue = totalAnnualSavings - appelloInvestment.software; // Exclude one-time costs
  const roiPercentage = ((netAnnualValue - appelloInvestment.onboarding - appelloInvestment.training) / appelloInvestment.total) * 100;
  const paybackMonths = (appelloInvestment.total / (totalAnnualSavings / 12));
  
  // Pain Point Costs Breakdown
  const painPointCosts = calculatePainPointCosts(painPoints, hoursPerWeek, estimatedRevenue, fieldWorkers);
  
  return {
    hoursPerWeek,
    hoursPerYear,
    timeCostPerYear,
    profitMarginLoss,
    revenueLoss: estimatedRevenue,
    changeOrderLoss,
    complianceCosts,
    totalAnnualCost,
    appelloInvestment,
    timeSavings,
    profitImprovement,
    changeOrderCapture,
    complianceSavings,
    totalAnnualSavings,
    netAnnualValue,
    roiPercentage: Math.max(roiPercentage, 0),
    paybackMonths: Math.max(paybackMonths, 0),
    painPointCosts,
  };
}

function parseFieldWorkers(fieldWorkers: string): number {
  if (fieldWorkers.includes('250+')) return 250;
  if (fieldWorkers.includes('100-249')) return 150;
  if (fieldWorkers.includes('50-99')) return 75;
  if (fieldWorkers.includes('20-49')) return 35;
  if (fieldWorkers.includes('1-19')) return 15;
  return 10; // Default
}

function parseHoursPerWeek(hoursPerWeek: string): number {
  if (hoursPerWeek.includes('20+')) return 20;
  if (hoursPerWeek.includes('10-20')) return 15;
  if (hoursPerWeek.includes('5-10')) return 7.5;
  if (hoursPerWeek.includes('Less than 5')) return 3;
  if (hoursPerWeek.includes('Not sure')) return 12; // Conservative estimate
  return 10; // Default
}

function calculateProfitMarginLoss(painPoints: string[], urgency: number): number {
  let lossPercent = 0;
  
  // Base loss from pain points
  if (painPoints.some((p: string) => p.includes('job profitability'))) lossPercent += 3;
  if (painPoints.some((p: string) => p.includes('Material ordering'))) lossPercent += 2;
  if (painPoints.some((p: string) => p.includes('Losing money'))) lossPercent += 2;
  if (painPoints.some((p: string) => p.includes('Scheduling'))) lossPercent += 1;
  
  // Urgency multiplier (higher urgency = more severe impact)
  const urgencyMultiplier = urgency / 10;
  lossPercent = lossPercent * urgencyMultiplier;
  
  // Cap at 8% (from ATLAS: 5-8% margin erosion)
  return Math.min(lossPercent, 8);
}

function calculatePainPointCosts(
  painPoints: string[],
  hoursPerWeek: number,
  estimatedRevenue: number,
  fieldWorkers: number
): Array<{ painPoint: string; annualCost: number; appelloSolution: string; savings: number }> {
  const hourlyRate = 35;
  const costs: Array<{ painPoint: string; annualCost: number; appelloSolution: string; savings: number }> = [];
  
  painPoints.forEach((painPoint) => {
    let annualCost = 0;
    let solution = '';
    let savingsPercent = 0;
    
    if (painPoint.includes('Time tracking') || painPoint.includes('payroll')) {
      annualCost = (hoursPerWeek * 0.3) * 52 * hourlyRate; // 30% of time on payroll
      solution = 'Automated mobile timesheets with union payroll calculations';
      savingsPercent = 75;
    } else if (painPoint.includes('job profitability')) {
      annualCost = estimatedRevenue * 0.05; // 5% margin loss
      solution = 'Real-time job costing and profitability dashboards';
      savingsPercent = 60;
    } else if (painPoint.includes('Invoicing') || painPoint.includes('billing')) {
      annualCost = (hoursPerWeek * 0.2) * 52 * hourlyRate; // 20% of time on billing
      solution = 'Automated progress billing and invoicing';
      savingsPercent = 70;
    } else if (painPoint.includes('Material ordering')) {
      annualCost = estimatedRevenue * 0.03; // 3% material waste
      solution = 'Material request → PO → receiving workflow';
      savingsPercent = 50;
    } else if (painPoint.includes('Change orders')) {
      annualCost = estimatedRevenue * 0.08; // 8% lost change orders
      solution = 'Mobile change order capture and tracking';
      savingsPercent = 80;
    } else if (painPoint.includes('Scheduling')) {
      annualCost = (hoursPerWeek * 0.15) * 52 * hourlyRate; // 15% of time on scheduling
      solution = 'Automated crew scheduling with certification cross-referencing';
      savingsPercent = 65;
    } else if (painPoint.includes('Paper forms') || painPoint.includes('documents')) {
      annualCost = (hoursPerWeek * 0.1) * 52 * hourlyRate; // 10% of time on forms
      solution = 'Digital forms and document management';
      savingsPercent = 80;
    } else if (painPoint.includes('communication')) {
      annualCost = (hoursPerWeek * 0.1) * 52 * hourlyRate; // 10% of time on communication
      solution = 'Integrated field-office communication hub';
      savingsPercent = 50;
    } else {
      annualCost = (hoursPerWeek * 0.05) * 52 * hourlyRate; // Default 5% allocation
      solution = 'Integrated platform addressing this challenge';
      savingsPercent = 60;
    }
    
    costs.push({
      painPoint,
      annualCost: Math.round(annualCost),
      appelloSolution: solution,
      savings: Math.round(annualCost * (savingsPercent / 100)),
    });
  });
  
  return costs;
}

