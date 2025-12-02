/**
 * Deal Scoring System
 * 
 * Generates comprehensive scores for deals based on multiple factors:
 * - Deal Stage (pipeline progression)
 * - Deal Amount (revenue potential)
 * - Close Date (urgency/timeline)
 * - Activity Level (engagement signals)
 * - Company/Contact associations
 * - AI-generated insights
 */

export interface DealScoreBreakdown {
  stageScore: number;        // 0-25: Pipeline progression
  valueScore: number;        // 0-25: Deal amount/revenue
  timelineScore: number;     // 0-20: Close date proximity
  activityScore: number;     // 0-15: Recent activity
  associationScore: number;  // 0-15: Company/contact quality
}

export interface DealScore {
  totalScore: number;        // 0-100 composite score
  percentage: number;        // Percentage representation
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  priority: 'Hot' | 'Warm' | 'Cool' | 'Cold';
  breakdown: DealScoreBreakdown;
  healthIndicator: 'Excellent' | 'Good' | 'Fair' | 'At Risk' | 'Critical';
  recommendations: string[];
}

// Standard HubSpot deal stages with progression values
const STAGE_PROGRESSION: Record<string, number> = {
  // Early stages (0-20%)
  'appointmentscheduled': 10,
  'qualifiedtobuy': 15,
  'new': 10,
  'lead': 10,
  'contacted': 15,
  
  // Middle stages (20-60%)
  'presentationscheduled': 20,
  'discovery': 25,
  'qualified': 35,
  'decisionmakerboughtin': 40,
  'proposal': 50,
  'contractsent': 60,
  
  // Late stages (60-100%)
  'negotiation': 70,
  'closedwon': 100,
  'closedlost': 0,
  
  // Default for custom stages
  'default': 30,
};

export interface DealData {
  dealId: string;
  dealname: string;
  amount?: string | number;
  dealstage?: string;
  pipeline?: string;
  closedate?: string | Date;
  dealtype?: string;
  isClosed?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  companyIds?: string[];
  contactIds?: string[];
  properties?: Record<string, any>;
  lastActivityDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Calculate comprehensive deal score
 */
export function calculateDealScore(deal: DealData): DealScore {
  const breakdown = calculateBreakdown(deal);
  const totalScore = Math.round(
    breakdown.stageScore +
    breakdown.valueScore +
    breakdown.timelineScore +
    breakdown.activityScore +
    breakdown.associationScore
  );
  
  const percentage = Math.min(100, totalScore);
  const grade = getGrade(percentage);
  const priority = getPriority(percentage, deal);
  const healthIndicator = getHealthIndicator(percentage, deal);
  const recommendations = generateRecommendations(deal, breakdown);
  
  return {
    totalScore,
    percentage,
    grade,
    priority,
    breakdown,
    healthIndicator,
    recommendations,
  };
}

function calculateBreakdown(deal: DealData): DealScoreBreakdown {
  return {
    stageScore: calculateStageScore(deal),
    valueScore: calculateValueScore(deal),
    timelineScore: calculateTimelineScore(deal),
    activityScore: calculateActivityScore(deal),
    associationScore: calculateAssociationScore(deal),
  };
}

/**
 * Stage Score (0-25 points)
 * Higher score for deals further along in the pipeline
 */
function calculateStageScore(deal: DealData): number {
  if (deal.isClosed) {
    return deal.isWon ? 25 : 0;
  }
  
  const stage = (deal.dealstage || '').toLowerCase().replace(/\s+/g, '');
  const progression = STAGE_PROGRESSION[stage] ?? STAGE_PROGRESSION['default'];
  
  // Scale to 0-25
  return Math.round((progression / 100) * 25);
}

/**
 * Value Score (0-25 points)
 * Higher score for higher-value deals
 */
function calculateValueScore(deal: DealData): number {
  const amount = parseFloat(String(deal.amount || '0')) || 0;
  
  if (amount <= 0) return 3; // Minimal points for deals without amount
  
  // Tiered scoring based on deal value
  if (amount >= 100000) return 25;  // $100k+
  if (amount >= 50000) return 22;   // $50k-$100k
  if (amount >= 25000) return 19;   // $25k-$50k
  if (amount >= 10000) return 15;   // $10k-$25k
  if (amount >= 5000) return 12;    // $5k-$10k
  if (amount >= 1000) return 8;     // $1k-$5k
  return 5;                          // < $1k
}

/**
 * Timeline Score (0-20 points)
 * Higher score for deals with close dates that are soon (but not overdue)
 */
function calculateTimelineScore(deal: DealData): number {
  if (!deal.closedate) return 5; // Some points for having a deal
  
  const closeDate = new Date(deal.closedate);
  const now = new Date();
  const daysUntilClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Overdue deals get lower scores
  if (daysUntilClose < -30) return 2;  // Severely overdue
  if (daysUntilClose < -7) return 5;   // Overdue
  if (daysUntilClose < 0) return 8;    // Just overdue
  
  // Upcoming close dates
  if (daysUntilClose <= 7) return 20;   // Closing this week
  if (daysUntilClose <= 14) return 18;  // Closing in 2 weeks
  if (daysUntilClose <= 30) return 15;  // Closing this month
  if (daysUntilClose <= 60) return 12;  // Closing in 2 months
  if (daysUntilClose <= 90) return 10;  // Closing in 3 months
  if (daysUntilClose <= 180) return 7;  // Closing in 6 months
  return 5;                              // Closing later
}

/**
 * Activity Score (0-15 points)
 * Higher score for deals with recent activity
 */
function calculateActivityScore(deal: DealData): number {
  const lastActivity = deal.lastActivityDate || deal.updatedAt;
  if (!lastActivity) return 3;
  
  const activityDate = new Date(lastActivity);
  const now = new Date();
  const daysSinceActivity = Math.ceil((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceActivity <= 1) return 15;   // Activity today
  if (daysSinceActivity <= 3) return 13;   // Activity in last 3 days
  if (daysSinceActivity <= 7) return 11;   // Activity this week
  if (daysSinceActivity <= 14) return 9;   // Activity in 2 weeks
  if (daysSinceActivity <= 30) return 7;   // Activity this month
  if (daysSinceActivity <= 60) return 5;   // Activity in 2 months
  if (daysSinceActivity <= 90) return 3;   // Activity in 3 months
  return 1;                                 // Stale deal
}

/**
 * Association Score (0-15 points)
 * Higher score for deals with strong company/contact associations
 */
function calculateAssociationScore(deal: DealData): number {
  let score = 0;
  
  const companyCount = deal.companyIds?.length || 0;
  const contactCount = deal.contactIds?.length || 0;
  
  // Company associations (0-7 points)
  if (companyCount >= 1) score += 5;  // Has company
  if (companyCount >= 2) score += 2;  // Multiple companies
  
  // Contact associations (0-8 points)
  if (contactCount >= 1) score += 3;  // Has contact
  if (contactCount >= 2) score += 2;  // Multiple contacts
  if (contactCount >= 3) score += 2;  // Good coverage
  if (contactCount >= 5) score += 1;  // Strong coverage
  
  return Math.min(15, score);
}

function getGrade(percentage: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
}

function getPriority(percentage: number, deal: DealData): 'Hot' | 'Warm' | 'Cool' | 'Cold' {
  // Closed deals are always cold
  if (deal.isClosed && !deal.isWon) return 'Cold';
  if (deal.isClosed && deal.isWon) return 'Cool';
  
  if (percentage >= 70) return 'Hot';
  if (percentage >= 50) return 'Warm';
  if (percentage >= 30) return 'Cool';
  return 'Cold';
}

function getHealthIndicator(
  percentage: number, 
  deal: DealData
): 'Excellent' | 'Good' | 'Fair' | 'At Risk' | 'Critical' {
  if (deal.isLost) return 'Critical';
  
  // Check for warning signs
  const closeDate = deal.closedate ? new Date(deal.closedate) : null;
  const isOverdue = closeDate && closeDate < new Date();
  const lastActivity = deal.lastActivityDate || deal.updatedAt;
  const daysSinceActivity = lastActivity 
    ? Math.ceil((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Overdue + stale = Critical
  if (isOverdue && daysSinceActivity > 30) return 'Critical';
  
  // Either overdue or stale = At Risk
  if (isOverdue || daysSinceActivity > 60) return 'At Risk';
  
  if (percentage >= 75) return 'Excellent';
  if (percentage >= 55) return 'Good';
  if (percentage >= 35) return 'Fair';
  return 'At Risk';
}

function generateRecommendations(deal: DealData, breakdown: DealScoreBreakdown): string[] {
  const recommendations: string[] = [];
  
  // Stage recommendations
  if (breakdown.stageScore < 10) {
    recommendations.push('Move deal forward in pipeline - schedule discovery call');
  }
  
  // Value recommendations
  if (breakdown.valueScore < 10) {
    recommendations.push('Update deal amount to reflect true opportunity value');
  }
  
  // Timeline recommendations
  if (breakdown.timelineScore < 8) {
    if (deal.closedate && new Date(deal.closedate) < new Date()) {
      recommendations.push('Deal is overdue - update close date or close the deal');
    } else {
      recommendations.push('Set a realistic close date to track progress');
    }
  }
  
  // Activity recommendations
  if (breakdown.activityScore < 7) {
    recommendations.push('Deal is stale - reach out to re-engage');
  }
  
  // Association recommendations
  if (breakdown.associationScore < 5) {
    recommendations.push('Add company and key contacts to deal for better tracking');
  }
  
  // If all scores are good, give positive feedback
  if (recommendations.length === 0) {
    recommendations.push('Deal is well-positioned - focus on closing');
  }
  
  return recommendations;
}

/**
 * Get a formatted stage label from stage ID
 */
export function getStageLabel(stage: string): string {
  const stageLabels: Record<string, string> = {
    'appointmentscheduled': 'Appointment Scheduled',
    'qualifiedtobuy': 'Qualified to Buy',
    'presentationscheduled': 'Presentation Scheduled',
    'decisionmakerboughtin': 'Decision Maker Bought In',
    'contractsent': 'Contract Sent',
    'closedwon': 'Closed Won',
    'closedlost': 'Closed Lost',
    'new': 'New',
    'lead': 'Lead',
    'contacted': 'Contacted',
    'discovery': 'Discovery',
    'qualified': 'Qualified',
    'proposal': 'Proposal',
    'negotiation': 'Negotiation',
  };
  
  const normalized = stage.toLowerCase().replace(/\s+/g, '');
  return stageLabels[normalized] || stage;
}

/**
 * Format currency amount
 */
export function formatDealAmount(amount: string | number | undefined): string {
  if (!amount) return '$0';
  const num = parseFloat(String(amount));
  if (isNaN(num)) return '$0';
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toLocaleString()}`;
}

/**
 * Get priority color class for UI
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Hot': return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    case 'Warm': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
    case 'Cool': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
    case 'Cold': return 'text-slate-400 bg-slate-100 dark:bg-slate-800';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
  }
}

/**
 * Get health indicator color class for UI
 */
export function getHealthColor(health: string): string {
  switch (health) {
    case 'Excellent': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
    case 'Good': return 'text-green-500 bg-green-50 dark:bg-green-950/30';
    case 'Fair': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
    case 'At Risk': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
    case 'Critical': return 'text-red-500 bg-red-50 dark:bg-red-950/30';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
  }
}

/**
 * Get grade color class for UI
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+': 
    case 'A': return 'text-emerald-500';
    case 'B+':
    case 'B': return 'text-blue-500';
    case 'C+':
    case 'C': return 'text-amber-500';
    case 'D': return 'text-orange-500';
    case 'F': return 'text-red-500';
    default: return 'text-slate-500';
  }
}


