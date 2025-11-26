// Using any for now since AssessmentData structure may differ from DB model
type AssessmentData = any;

import { getScoringConfig, DEFAULT_SCORING_CONFIG } from '../config/scoringConfig';

export interface OpportunityScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  breakdown: {
    urgency: number;
    painSeverity: number;
    companySize: number;
    timeline: number;
    likelihood: number;
    currentState: number;
    budgetIndicators: number;
  };
  recommendations: string[];
  priority: 'High' | 'Medium' | 'Low';
}

/**
 * Opportunity Scoring System
 * Scores prospects 0-100 based on multiple factors
 * 
 * Scoring Breakdown (configurable via admin):
 * - Urgency (default 20 points): How urgent is solving challenges?
 * - Pain Severity (default 20 points): Number and severity of pain points
 * - Company Size (default 15 points): Field workers count (indicates budget)
 * - Timeline (default 15 points): Decision timeline
 * - Likelihood (default 15 points): Likelihood to implement
 * - Current State (default 10 points): Manual systems = higher score
 * - Budget Indicators (default 5 points): Software evaluation, next steps
 */
export async function calculateOpportunityScore(data: AssessmentData): Promise<OpportunityScore> {
  // Get configurable weights (async to allow DB lookup)
  let config;
  try {
    config = await getScoringConfig();
  } catch (error) {
    console.warn('Failed to load scoring config, using defaults:', error);
    config = DEFAULT_SCORING_CONFIG;
  }
  
  const weights = config.weights;
  
  // Calculate raw scores (0-100 scale for each factor)
  const rawScores = {
    urgency: calculateUrgencyScore(data.section2?.urgency || 0),
    painSeverity: calculatePainSeverityScore(data.section2 || {}),
    companySize: calculateCompanySizeScore(data.section1?.fieldWorkers || ''),
    timeline: calculateTimelineScore(data.section5?.timeline || ''),
    likelihood: calculateLikelihoodScore(data.section5?.likelihood || 0),
    currentState: calculateCurrentStateScore(data.section3 || {}),
    budgetIndicators: calculateBudgetIndicatorsScore(data.section5 || {}),
  };
  
  // Apply weights (normalize to configured weights)
  const maxPossibleScores = {
    urgency: 20,
    painSeverity: 20,
    companySize: 15,
    timeline: 15,
    likelihood: 15,
    currentState: 10,
    budgetIndicators: 5,
  };
  
  const breakdown = {
    urgency: Math.round((rawScores.urgency / maxPossibleScores.urgency) * weights.urgency),
    painSeverity: Math.round((rawScores.painSeverity / maxPossibleScores.painSeverity) * weights.painSeverity),
    companySize: Math.round((rawScores.companySize / maxPossibleScores.companySize) * weights.companySize),
    timeline: Math.round((rawScores.timeline / maxPossibleScores.timeline) * weights.timeline),
    likelihood: Math.round((rawScores.likelihood / maxPossibleScores.likelihood) * weights.likelihood),
    currentState: Math.round((rawScores.currentState / maxPossibleScores.currentState) * weights.currentState),
    budgetIndicators: Math.round((rawScores.budgetIndicators / maxPossibleScores.budgetIndicators) * weights.budgetIndicators),
  };

  const totalScore: number = Object.values(breakdown).reduce((sum: number, score: any) => sum + score, 0) as number;
  const maxScore: number = Object.values(weights).reduce((sum: number, w: any) => sum + w, 0) as number;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const grade = getGrade(percentage, config.gradeThresholds);
  const priority = getPriority(totalScore, config.priorityThresholds);

  const recommendations = generateRecommendations(data, breakdown);

  return {
    totalScore,
    maxScore,
    percentage,
    grade,
    breakdown,
    recommendations,
    priority,
  };
}

// Synchronous version for backwards compatibility (uses defaults)
export function calculateOpportunityScoreSync(data: AssessmentData): OpportunityScore {
  const breakdown = {
    urgency: calculateUrgencyScore(data.section2?.urgency || 0),
    painSeverity: calculatePainSeverityScore(data.section2 || {}),
    companySize: calculateCompanySizeScore(data.section1?.fieldWorkers || ''),
    timeline: calculateTimelineScore(data.section5?.timeline || ''),
    likelihood: calculateLikelihoodScore(data.section5?.likelihood || 0),
    currentState: calculateCurrentStateScore(data.section3 || {}),
    budgetIndicators: calculateBudgetIndicatorsScore(data.section5 || {}),
  };

  const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  const maxScore = 100;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const grade = getGrade(percentage, DEFAULT_SCORING_CONFIG.gradeThresholds);
  const priority = getPriority(totalScore, DEFAULT_SCORING_CONFIG.priorityThresholds);

  const recommendations = generateRecommendations(data, breakdown);

  return {
    totalScore,
    maxScore,
    percentage,
    grade,
    breakdown,
    recommendations,
    priority,
  };
}

function calculateUrgencyScore(urgency: number): number {
  // 1-3: 0-5 points, 4-6: 6-12 points, 7-8: 13-17 points, 9-10: 18-20 points
  if (urgency >= 9) return 20;
  if (urgency >= 7) return 15 + (urgency - 7) * 2; // 15-19
  if (urgency >= 4) return 6 + (urgency - 4) * 3; // 6-12
  return urgency * 2; // 0-6
}

function calculatePainSeverityScore(section2: any): number {
  const painPoints = section2.painPoints || [];
  const hoursPerWeek = section2.hoursPerWeek || '';
  
  let score = 0;
  
  // Base score from number of pain points (max 10 points)
  score += Math.min(painPoints.length * 1.5, 10);
  
  // Hours per week multiplier (max 10 points)
  if (hoursPerWeek.includes('20+')) score += 10;
  else if (hoursPerWeek.includes('10-20')) score += 7;
  else if (hoursPerWeek.includes('5-10')) score += 4;
  else if (hoursPerWeek.includes('Less than 5')) score += 2;
  else if (hoursPerWeek.includes('Not sure')) score += 5; // Indicates awareness of problem
  
  return Math.min(score, 20);
}

function calculateCompanySizeScore(fieldWorkers: string): number {
  // Larger companies = higher budget potential
  if (fieldWorkers.includes('250+')) return 15;
  if (fieldWorkers.includes('100-249')) return 13;
  if (fieldWorkers.includes('50-99')) return 11;
  if (fieldWorkers.includes('20-49')) return 9;
  if (fieldWorkers.includes('1-19')) return 6;
  return 0;
}

function calculateTimelineScore(timeline: string): number {
  // Shorter timeline = higher score
  if (timeline.includes('Within 1 month')) return 15;
  if (timeline.includes('1-3 months')) return 12;
  if (timeline.includes('3-6 months')) return 8;
  if (timeline.includes('6+ months')) return 4;
  if (timeline.includes('Researching now')) return 2;
  return 0;
}

function calculateLikelihoodScore(likelihood: number): number {
  // 1-3: 0-5 points, 4-6: 6-9 points, 7-8: 10-13 points, 9-10: 14-15 points
  if (likelihood >= 9) return 15;
  if (likelihood >= 7) return 10 + (likelihood - 7) * 2.5; // 10-15
  if (likelihood >= 4) return 6 + (likelihood - 4) * 1.5; // 6-9
  return likelihood * 1.5; // 0-6
}

function calculateCurrentStateScore(section3: any): number {
  let score = 0;
  
  // Manual systems = higher pain = higher score
  const timesheetMethod = section3.timesheetMethod || '';
  if (timesheetMethod.includes('Paper') || timesheetMethod.includes('Excel')) score += 5;
  if (timesheetMethod.includes('No formal')) score += 5;
  
  const constructionSoftware = section3.constructionSoftware || '';
  if (constructionSoftware.includes('No, using paper/Excel')) score += 3;
  if (constructionSoftware.includes('No')) score += 2;
  
  // Multiple gaps = higher score
  const notDoing = section3.notDoing || [];
  score += Math.min(notDoing.length * 0.5, 2);
  
  return Math.min(score, 10);
}

function calculateBudgetIndicatorsScore(section5: any): number {
  let score = 0;
  
  // Evaluating competitors = budget exists
  const evaluating = section5.evaluating || [];
  if (evaluating.length > 0 && !evaluating.includes('Not looking at alternatives yet')) {
    score += 3;
  }
  
  // Next steps indicate seriousness
  const nextSteps = section5.nextSteps || [];
  if (nextSteps.includes('Pricing information')) score += 1;
  if (nextSteps.includes('See how it integrates')) score += 1;
  
  return Math.min(score, 5);
}

function getGrade(
  percentage: number,
  thresholds: Record<string, number> = DEFAULT_SCORING_CONFIG.gradeThresholds
): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
  if (percentage >= thresholds['A+']) return 'A+';
  if (percentage >= thresholds['A']) return 'A';
  if (percentage >= thresholds['B+']) return 'B+';
  if (percentage >= thresholds['B']) return 'B';
  if (percentage >= thresholds['C+']) return 'C+';
  if (percentage >= thresholds['C']) return 'C';
  return 'D';
}

function getPriority(
  totalScore: number,
  thresholds: Record<string, number> = DEFAULT_SCORING_CONFIG.priorityThresholds
): 'High' | 'Medium' | 'Low' {
  if (totalScore >= thresholds['High']) return 'High';
  if (totalScore >= thresholds['Medium']) return 'Medium';
  return 'Low';
}

function generateRecommendations(data: AssessmentData, breakdown: any): string[] {
  const recommendations: string[] = [];
  
  // High urgency
  if (breakdown.urgency >= 15) {
    recommendations.push('High urgency - prioritize immediate follow-up');
  }
  
  // Union complexity
  if (data.section3?.unionized === 'Yes') {
    recommendations.push('Lead with union payroll complexity mastery (signature feature)');
  }
  
  // Multiple pain points
  const painPoints = data.section2?.painPoints || [];
  if (painPoints.length >= 5) {
    recommendations.push('Multiple pain points - emphasize integrated platform value');
  }
  
  // Material ordering pain
  if (painPoints.some((p: string) => p.includes('Material ordering'))) {
    recommendations.push('Highlight new material management/Purchase Order features');
  }
  
  // Service work
  if (painPoints.some((p: string) => p.includes('Service work'))) {
    recommendations.push('Show work orders/service work tracking capabilities');
  }
  
  // Job profitability
  if (painPoints.some((p: string) => p.includes('job profitability'))) {
    recommendations.push('Focus demo on real-time job costing and profitability reports');
  }
  
  // Evaluating competitors
  const evaluating = data.section5?.evaluating || [];
  if (evaluating.includes('Procore')) {
    recommendations.push('Prepare competitive comparison vs. Procore (1/10th price, built FOR subs)');
  }
  
  // Demo focus areas
  const demoFocus = data.section4?.demoFocus || [];
  if (demoFocus.length > 0) {
    recommendations.push(`Customize demo to focus on: ${demoFocus.slice(0, 3).join(', ')}`);
  }
  
  // Timeline urgency
  if (data.section5?.timeline?.includes('Within 1 month')) {
    recommendations.push('Fast-track demo scheduling - decision timeline is immediate');
  }
  
  return recommendations;
}

