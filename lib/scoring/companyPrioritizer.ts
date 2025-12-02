import Company from '@/models/Company';
import Contact from '@/models/Contact';
import Deal from '@/models/Deal';
import Assessment from '@/models/Assessment';
import Estimate from '@/models/Estimate';
import GeneratedLetter from '@/models/GeneratedLetter';

export interface CompanyPriorityScore {
  companyId: string;
  companyName: string;
  hubspotId: string;
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
  
  // Scoring components
  totalScore: number;
  scoreBreakdown: {
    // HubSpot signals
    dealValue: number;        // 0-25: Value of open deals
    dealStage: number;        // 0-15: How far along in pipeline
    dealActivity: number;     // 0-10: Recent deal activity
    contactCount: number;     // 0-10: Number of contacts
    
    // Engagement signals
    assessmentScore: number;   // 0-20: Assessment opportunity score
    assessmentCount: number;  // 0-5: Number of assessments
    estimateCount: number;    // 0-5: Number of estimates
    letterCount: number;      // 0-5: Number of letters sent
    
    // Company attributes
    companySize: number;      // 0-10: Employee count indicator
    industryFit: number;      // 0-5: Industry match score
    
    // Recency
    lastActivity: number;     // 0-5: Days since last activity
  };
  
  // Supporting data
  openDeals: Array<{
    id: string;
    name: string;
    amount: string;
    stage: string;
    pipeline: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email?: string;
    title?: string;
  }>;
  assessments: Array<{
    id: string;
    score?: number;
    priority?: string;
    completedAt?: Date;
  }>;
  estimates: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: Date;
  }>;
  letters: Array<{
    id: string;
    status: string;
    createdAt: Date;
  }>;
  
  // Recommendations
  priority: 'High' | 'Medium' | 'Low';
  reasons: string[];
  nextAction?: string;
  
  // AI Analysis (optional, added when AI analysis is enabled)
  aiAnalysis?: {
    // Core scores (0-100)
    urgencyScore?: number;        // How urgent is outreach?
    opportunityScore?: number;   // Revenue potential
    riskScore?: number;           // Risk of losing/churn
    engagementScore?: number;    // Likelihood of response
    strategicScore?: number;      // Strategic value
    
    // Composite AI score
    aiPriorityScore?: number;    // Weighted composite (0-100)
    
    // AI Insights
    aiInsights?: {
      summary?: string;           // AI-generated summary
      strengths?: string[];       // Why prioritize
      concerns?: string[];        // Risk factors
      similarAccounts?: Array<{  // From ATLAS
        name: string;
        outcome: string;
        insights: string;
      }>;
      marketContext?: string;    // Industry/market insights
      recommendedActions?: string[]; // Next steps
    };
    
    // Justification
    justification?: {
      primaryReason?: string;    // Main reason for priority
      supportingFactors?: string[]; // Additional factors
      comparison?: string;        // How it compares to others
      confidence?: number;        // AI confidence (0-100)
    };
    
    // Data enrichment
    enrichedData?: {
      websiteContent?: string;  // From Firecrawl
      companyResearch?: any;     // Web research
      atlasMatches?: any[];      // Similar companies
    };
    
    // Metadata
    analyzedAt?: Date;
    analysisDuration?: number;   // milliseconds
    toolCalls?: number;
    iterations?: number;
  };
}

/**
 * Calculate priority score for a company based on multiple data sources
 */
export async function calculateCompanyPriority(
  company: any,
  deals: any[],
  contacts: any[],
  assessments: any[],
  estimates: any[],
  letters: any[]
): Promise<CompanyPriorityScore> {
  const companyId = company.hubspotId || company.id;
  
  // Filter data for this company
  const companyDeals = deals.filter(d => 
    d.companyIds?.includes(companyId) || 
    d.properties?.associatedcompanyid === companyId
  );
  
  const companyContacts = contacts.filter(c => 
    c.companyId === companyId || 
    c.properties?.associatedcompanyid === companyId
  );
  
  const companyAssessments = assessments.filter(a => 
    a.companyName?.toLowerCase() === company.name?.toLowerCase() ||
    a.website === company.domain ||
    a.website === company.website
  );
  
  const companyEstimates = estimates.filter(e => 
    e.preparedFor?.companyName?.toLowerCase() === company.name?.toLowerCase() ||
    e.hubspotCompanyId === companyId
  );
  
  const companyLetters = letters.filter(l => 
    l.companyId === companyId ||
    l.companyName?.toLowerCase() === company.name?.toLowerCase()
  );
  
  // Calculate score components
  const openDeals = companyDeals.filter(d => !d.isClosed);
  const dealValue = openDeals.reduce((sum, d) => {
    const amount = parseFloat(d.amount || '0');
    return sum + amount;
  }, 0);
  
  // Deal stage score (closer to close = higher score)
  const dealStageScore = openDeals.reduce((sum, d) => {
    const stage = d.dealstage?.toLowerCase() || '';
    let stageScore = 0;
    if (stage.includes('closed') || stage.includes('won')) stageScore = 15;
    else if (stage.includes('decision') || stage.includes('proposal')) stageScore = 12;
    else if (stage.includes('negotiation') || stage.includes('presentation')) stageScore = 10;
    else if (stage.includes('qualified') || stage.includes('discovery')) stageScore = 7;
    else if (stage.includes('lead') || stage.includes('contacted')) stageScore = 4;
    return sum + stageScore;
  }, 0) / Math.max(openDeals.length, 1);
  
  // Deal activity (recent updates)
  const now = new Date();
  const recentDealActivity = openDeals.filter(d => {
    const updated = new Date(d.updatedAt || d.lastSyncedAt || 0);
    const daysSince = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;
  
  // Assessment score
  const completedAssessments = companyAssessments.filter(a => a.status === 'completed');
  const avgAssessmentScore = completedAssessments.length > 0
    ? completedAssessments.reduce((sum, a) => sum + (a.opportunityScore || 0), 0) / completedAssessments.length
    : 0;
  
  // Company size score (based on employees)
  const employees = parseInt(company.employees || '0');
  let companySizeScore = 0;
  if (employees >= 250) companySizeScore = 10;
  else if (employees >= 100) companySizeScore = 8;
  else if (employees >= 50) companySizeScore = 6;
  else if (employees >= 20) companySizeScore = 4;
  else if (employees >= 1) companySizeScore = 2;
  
  // Industry fit (ICI subcontractors = higher score)
  const industry = (company.industry || '').toLowerCase();
  let industryFitScore = 2; // Default
  if (industry.includes('construction') || industry.includes('subcontractor') || 
      industry.includes('contractor') || industry.includes('trade')) {
    industryFitScore = 5;
  }
  
  // Last activity score
  const allActivities = [
    ...companyDeals.map(d => new Date(d.updatedAt || d.lastSyncedAt || 0)),
    ...companyAssessments.map(a => new Date(a.updatedAt || a.completedAt || 0)),
    ...companyEstimates.map(e => new Date(e.updatedAt || e.createdAt || 0)),
    ...companyLetters.map(l => new Date(l.updatedAt || l.createdAt || 0)),
  ];
  
  const lastActivity = allActivities.length > 0
    ? Math.max(...allActivities.map(d => d.getTime()))
    : 0;
  
  const daysSinceActivity = lastActivity > 0
    ? (now.getTime() - lastActivity) / (1000 * 60 * 60 * 24)
    : 999;
  
  let lastActivityScore = 0;
  if (daysSinceActivity <= 7) lastActivityScore = 5;
  else if (daysSinceActivity <= 30) lastActivityScore = 4;
  else if (daysSinceActivity <= 90) lastActivityScore = 3;
  else if (daysSinceActivity <= 180) lastActivityScore = 2;
  else if (daysSinceActivity <= 365) lastActivityScore = 1;
  
  // Calculate component scores
  const scoreBreakdown = {
    dealValue: Math.min(dealValue / 10000, 25), // Max 25 points for $100k+ deals
    dealStage: Math.min(dealStageScore, 15),
    dealActivity: Math.min(recentDealActivity * 2, 10),
    contactCount: Math.min(companyContacts.length, 10),
    assessmentScore: Math.min(avgAssessmentScore / 5, 20), // Scale 0-100 to 0-20
    assessmentCount: Math.min(completedAssessments.length, 5),
    estimateCount: Math.min(companyEstimates.length, 5),
    letterCount: Math.min(companyLetters.length, 5),
    companySize: companySizeScore,
    industryFit: industryFitScore,
    lastActivity: lastActivityScore,
  };
  
  // Calculate total score
  const totalScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);
  
  // Determine priority
  let priority: 'High' | 'Medium' | 'Low' = 'Low';
  if (totalScore >= 60) priority = 'High';
  else if (totalScore >= 35) priority = 'Medium';
  
  // Generate reasons
  const reasons: string[] = [];
  if (scoreBreakdown.dealValue > 10) reasons.push(`High-value deals: $${dealValue.toLocaleString()}`);
  if (scoreBreakdown.dealStage > 10) reasons.push('Deals in advanced stages');
  if (scoreBreakdown.assessmentScore > 10) reasons.push(`Strong assessment score: ${Math.round(avgAssessmentScore)}`);
  if (scoreBreakdown.companySize > 6) reasons.push(`Large company: ${employees} employees`);
  if (scoreBreakdown.contactCount > 5) reasons.push(`Multiple contacts: ${companyContacts.length}`);
  if (scoreBreakdown.estimateCount > 0) reasons.push(`Active estimates: ${companyEstimates.length}`);
  if (scoreBreakdown.lastActivity === 5) reasons.push('Recent activity (within 7 days)');
  if (reasons.length === 0) reasons.push('Baseline company data available');
  
  // Determine next action
  let nextAction: string | undefined;
  if (openDeals.length > 0 && scoreBreakdown.dealStage < 10) {
    nextAction = 'Follow up on open deals';
  } else if (companyAssessments.length === 0) {
    nextAction = 'Send assessment invitation';
  } else if (completedAssessments.length > 0 && companyEstimates.length === 0) {
    nextAction = 'Create estimate based on assessment';
  } else if (companyLetters.length === 0) {
    nextAction = 'Send personalized letter';
  } else if (scoreBreakdown.lastActivity < 3) {
    nextAction = 'Re-engage with personalized outreach';
  }
  
  return {
    companyId: company._id?.toString() || companyId,
    companyName: company.name,
    hubspotId: companyId,
    domain: company.domain,
    industry: company.industry,
    city: company.city,
    state: company.state,
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    scoreBreakdown,
    openDeals: openDeals.map(d => ({
      id: d.hubspotId || d.id,
      name: d.dealname || d.name,
      amount: d.amount || '0',
      stage: d.dealstage || '',
      pipeline: d.pipeline || '',
    })),
    contacts: companyContacts.map(c => ({
      id: c.hubspotId || c.id,
      name: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      email: c.email,
      title: c.jobTitle,
    })),
    assessments: completedAssessments.map(a => ({
      id: a._id?.toString() || a.submissionId,
      score: a.opportunityScore,
      priority: a.opportunityPriority,
      completedAt: a.completedAt,
    })),
    estimates: companyEstimates.map(e => ({
      id: e._id?.toString() || e.estimateNumber,
      status: e.status,
      total: e.totals?.total || 0,
      createdAt: e.createdAt,
    })),
    letters: companyLetters.map(l => ({
      id: l._id?.toString() || l.id,
      status: l.status,
      createdAt: l.createdAt,
    })),
    priority,
    reasons,
    nextAction,
  };
}

