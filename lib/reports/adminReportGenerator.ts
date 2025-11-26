/**
 * Admin/Sales Intelligence Report Generator
 * 
 * Generates comprehensive sales intelligence report for internal use
 */

import { CompanyResearch } from '../ai/researchService';
import { OpportunityScore } from '../scoring/opportunityScorer';
import { ROICalculation } from '../roi/roiCalculator';

export interface AdminReport {
  // Assessment Summary
  assessmentId: string;
  submittedAt: Date;
  contactInfo: {
    name?: string;
    email?: string;
    companyName?: string;
    role?: string;
  };
  
  // Opportunity Score
  opportunityScore: OpportunityScore;
  
  // ROI Analysis
  roi: ROICalculation;
  
  // Company Research (comprehensive intelligence)
  companyResearch: CompanyResearch;
  
  // Assessment Responses Summary
  assessmentSummary: {
    trade: string;
    fieldWorkers: string;
    topPainPoints: string[];
    urgency: number;
    timeline: string;
    likelihood: number;
    currentTools: string[];
    demoFocus: string[];
  };
  
  // Consolidated Sales Intelligence & Recommendations
  salesIntelligence: {
    priority: 'High' | 'Medium' | 'Low';
    nextSteps: Array<{
      action: string;
      rationale: string;
      source?: string;
    }>;
    demoFocus: string[];
    talkingPoints: Array<{
      point: string;
      source: string;
      evidence?: string;
    }>;
    objections: Array<{
      objection: string;
      response: string;
      source?: string;
    }>;
    competitiveAdvantages: Array<{
      advantage: string;
      evidence: string;
      source?: string;
    }>;
    buyingSignals: Array<{
      signal: string;
      evidence: string;
      source?: string;
    }>;
    risks: Array<{
      risk: string;
      mitigation: string;
      source?: string;
    }>;
    keyContacts?: Array<{
      name?: string;
      role?: string;
      email?: string;
      source?: string;
    }>;
    decisionMakers?: string[];
  };
  
  // Competitive Intelligence
  competitiveIntelligence: {
    competitors: Array<{
      name: string;
      website?: string;
      description?: string;
      differentiation?: string;
    }>;
    marketPosition?: string;
  };
  
  // Industry Context
  industryContext: {
    trends?: string[];
    challenges?: string[];
    opportunities?: string[];
  };
  
  // ATLAS Intelligence Summary
  atlasSummary?: {
    similarCustomersCount: number;
    caseStudiesCount: number;
    keyInsights: string[];
    successPatterns: string[];
  };
}

/**
 * Generate comprehensive admin report with consolidated sales intelligence
 */
export function generateAdminReport(
  assessmentData: any,
  opportunityScore: OpportunityScore,
  roi: ROICalculation,
  companyResearch: CompanyResearch
): AdminReport {
  const salesIntel = companyResearch.salesIntelligence || {};
  
  return {
    assessmentId: assessmentData.submissionId,
    submittedAt: new Date(),
    contactInfo: {
      name: assessmentData.name,
      email: assessmentData.email,
      companyName: assessmentData.companyName,
      role: assessmentData.section1?.role,
    },
    opportunityScore,
    roi,
    companyResearch,
    assessmentSummary: {
      trade: assessmentData.section1?.trade || '',
      fieldWorkers: assessmentData.section1?.fieldWorkers || '',
      topPainPoints: assessmentData.section2?.painPoints || [],
      urgency: assessmentData.section2?.urgency || 0,
      timeline: assessmentData.section5?.timeline || '',
      likelihood: assessmentData.section5?.likelihood || 0,
      currentTools: [
        assessmentData.section3?.accountingSoftware,
        assessmentData.section3?.payrollSoftware,
        assessmentData.section3?.constructionSoftware,
      ].filter(Boolean),
      demoFocus: assessmentData.section4?.demoFocus || [],
    },
    salesIntelligence: {
      priority: opportunityScore.priority,
      nextSteps: generateNextSteps(assessmentData, opportunityScore, companyResearch, roi),
      demoFocus: assessmentData.section4?.demoFocus || [],
      talkingPoints: formatTalkingPoints(salesIntel.talkingPoints || []),
      objections: formatObjections(salesIntel.objections || []),
      competitiveAdvantages: formatAdvantages(salesIntel.competitiveAdvantages || []),
      buyingSignals: formatBuyingSignals(salesIntel.buyingSignals || [], assessmentData),
      risks: formatRisks(salesIntel.risks || []),
      keyContacts: salesIntel.keyContacts || [],
      decisionMakers: salesIntel.decisionMakers || [],
    },
    competitiveIntelligence: {
      competitors: companyResearch.competitors || [],
      marketPosition: generateMarketPosition(companyResearch, assessmentData),
    },
    industryContext: {
      trends: companyResearch.industryInsights?.trends,
      challenges: companyResearch.industryInsights?.challenges,
      opportunities: companyResearch.industryInsights?.opportunities,
    },
    atlasSummary: {
      similarCustomersCount: companyResearch.atlasIntelligence?.similarCustomers?.length || 0,
      caseStudiesCount: companyResearch.atlasIntelligence?.caseStudies?.length || 0,
      keyInsights: companyResearch.atlasIntelligence?.insights || [],
      successPatterns: extractSuccessPatterns(companyResearch.atlasIntelligence),
    },
  };
}

/**
 * Format talking points with source attribution
 */
function formatTalkingPoints(points: string[]): Array<{ point: string; source: string; evidence?: string }> {
  return points.map(point => {
    // Extract source from point if it contains "Based on" or "From"
    const sourceMatch = point.match(/(?:Based on|From|Source:)\s*([^:]+)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : 'Research Analysis';
    
    return {
      point,
      source,
      evidence: point.includes('ROI') || point.includes('%') || point.includes('$') ? 'Quantified data' : undefined,
    };
  });
}

/**
 * Format objections with responses
 */
function formatObjections(objections: string[]): Array<{ objection: string; response: string; source?: string }> {
  return objections.map(obj => {
    // Try to split objection and response
    const parts = obj.split(/[—–-]|Response:|because/i);
    if (parts.length >= 2) {
      return {
        objection: parts[0].trim(),
        response: parts.slice(1).join(' ').trim(),
        source: obj.includes('ATLAS') ? 'ATLAS Database' : 'Research Analysis',
      };
    }
    return {
      objection: obj,
      response: 'Address during demo with specific examples',
      source: 'Research Analysis',
    };
  });
}

/**
 * Format competitive advantages with evidence
 */
function formatAdvantages(advantages: string[]): Array<{ advantage: string; evidence: string; source?: string }> {
  return advantages.map(adv => {
    const sourceMatch = adv.match(/(?:from|based on|source:)\s*([^,\.]+)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : 'Research Analysis';
    
    return {
      advantage: adv,
      evidence: adv.includes('unlike') || adv.includes('because') ? adv : 'Research comparison',
      source,
    };
  });
}

/**
 * Format buying signals with evidence
 */
function formatBuyingSignals(signals: string[], assessmentData: any): Array<{ signal: string; evidence: string; source?: string }> {
  const formatted = signals.map(signal => {
    const parts = signal.split(/[—–-]|Evidence:/i);
    if (parts.length >= 2) {
      return {
        signal: parts[0].trim(),
        evidence: parts.slice(1).join(' ').trim(),
        source: 'Assessment + Research',
      };
    }
    return {
      signal,
      evidence: 'Assessment responses',
      source: 'Assessment',
    };
  });
  
  // Add assessment-based signals
  if (assessmentData.section5?.timeline?.includes('Within 1 month')) {
    formatted.push({
      signal: 'Urgent timeline',
      evidence: `Timeline: ${assessmentData.section5.timeline}`,
      source: 'Assessment Response',
    });
  }
  
  if (assessmentData.section2?.urgency >= 8) {
    formatted.push({
      signal: 'High urgency',
      evidence: `Urgency score: ${assessmentData.section2.urgency}/10`,
      source: 'Assessment Response',
    });
  }
  
  return formatted;
}

/**
 * Format risks with mitigations
 */
function formatRisks(risks: string[]): Array<{ risk: string; mitigation: string; source?: string }> {
  return risks.map(risk => {
    const parts = risk.split(/[—–-]|Mitigation:/i);
    if (parts.length >= 2) {
      return {
        risk: parts[0].trim(),
        mitigation: parts.slice(1).join(' ').trim(),
        source: risk.includes('ATLAS') ? 'ATLAS Database' : 'Research Analysis',
      };
    }
    return {
      risk,
      mitigation: 'Address proactively during sales process',
      source: 'Research Analysis',
    };
  });
}

/**
 * Extract success patterns from ATLAS data
 */
function extractSuccessPatterns(atlasIntelligence?: CompanyResearch['atlasIntelligence']): string[] {
  if (!atlasIntelligence?.similarCustomers?.length) {
    return [];
  }
  
  const patterns: string[] = [];
  const customers = atlasIntelligence.similarCustomers;
  
  // Extract common patterns
  if (customers.length >= 3) {
    patterns.push(`${customers.length} similar customers found in database`);
  }
  
  if (atlasIntelligence.caseStudies?.length) {
    patterns.push(`${atlasIntelligence.caseStudies.length} relevant case studies available`);
  }
  
  return patterns;
}

function generateNextSteps(
  assessmentData: any,
  score: OpportunityScore,
  research: CompanyResearch,
  roi?: ROICalculation
): Array<{ action: string; rationale: string; source?: string }> {
  const steps: Array<{ action: string; rationale: string; source?: string }> = [];
  
  // High priority immediate actions
  if (score.priority === 'High') {
    steps.push({
      action: 'Schedule demo within 24-48 hours',
      rationale: `High priority opportunity (score: ${score.totalScore}/100, grade: ${score.grade})`,
      source: 'Opportunity Score Analysis',
    });
    if (roi) {
      steps.push({
        action: 'Send personalized ROI report',
        rationale: `ROI: ${roi.roiPercentage}%, Annual Savings: $${roi.totalAnnualSavings.toLocaleString()}`,
        source: 'ROI Calculation',
      });
    }
  } else if (score.priority === 'Medium') {
    steps.push({
      action: 'Schedule demo within 1 week',
      rationale: `Medium priority opportunity (score: ${score.totalScore}/100)`,
      source: 'Opportunity Score Analysis',
    });
    if (research.atlasIntelligence?.caseStudies?.length) {
      steps.push({
        action: 'Follow up with relevant case studies',
        rationale: `${research.atlasIntelligence.caseStudies.length} case studies available from ATLAS database`,
        source: 'ATLAS Database',
      });
    }
  } else {
    steps.push({
      action: 'Add to nurture sequence',
      rationale: 'Low priority - maintain engagement',
      source: 'Opportunity Score Analysis',
    });
  }
  
  // Timeline-based actions
  if (assessmentData.section5?.timeline?.includes('Within 1 month')) {
    steps.push({
      action: 'Fast-track onboarding process',
      rationale: `Timeline: ${assessmentData.section5.timeline}`,
      source: 'Assessment Response',
    });
    if (research.atlasIntelligence?.similarCustomers?.length) {
      steps.push({
        action: 'Reference similar customer implementation timelines',
        rationale: `${research.atlasIntelligence.similarCustomers.length} similar customers in database`,
        source: 'ATLAS Database',
      });
    }
  }
  
  // Tool-specific actions
  if (research.toolsResearch?.mentioned?.length) {
    steps.push({
      action: `Research integration with: ${research.toolsResearch.mentioned.join(', ')}`,
      rationale: `Current tools identified: ${research.toolsResearch.mentioned.join(', ')}`,
      source: 'Assessment + Website Analysis',
    });
  }
  
  // Competitor mentions
  if (assessmentData.section5?.evaluating?.length) {
    steps.push({
      action: `Prepare competitive comparison vs: ${assessmentData.section5.evaluating.join(', ')}`,
      rationale: `Competitors being evaluated: ${assessmentData.section5.evaluating.join(', ')}`,
      source: 'Assessment Response',
    });
  }
  
  // ATLAS-based actions
  if (research.atlasIntelligence?.similarCustomers?.length) {
    steps.push({
      action: 'Prepare success stories from similar customers',
      rationale: `${research.atlasIntelligence.similarCustomers.length} similar customers found in ATLAS`,
      source: 'ATLAS Database',
    });
  }
  
  return steps;
}

function generateMarketPosition(
  research: CompanyResearch,
  assessmentData: any
): string {
  const size = assessmentData.section1?.fieldWorkers || '';
  const trade = assessmentData.section1?.trade || '';
  
  if (size.includes('250+')) {
    return `Large ${trade} contractor - enterprise opportunity`;
  } else if (size.includes('100-249')) {
    return `Mid-large ${trade} contractor - growth opportunity`;
  } else if (size.includes('50-99')) {
    return `Mid-size ${trade} contractor - scaling opportunity`;
  } else {
    return `Small ${trade} contractor - efficiency opportunity`;
  }
}

