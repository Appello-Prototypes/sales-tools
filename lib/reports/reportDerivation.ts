/**
 * Report Derivation Transparency
 * 
 * Tracks and explains exactly how each report was generated
 */

import { CustomerReport } from './reportGenerator';
import { AdminReport } from './adminReportGenerator';
import { OpportunityScore } from '../scoring/opportunityScorer';
import { ROICalculation } from '../roi/roiCalculator';
import { CompanyResearch } from '../ai/researchService';

export interface ReportDerivation {
  reportType: 'customer' | 'admin';
  generatedAt: Date;
  dataSources: {
    assessmentData: boolean;
    roiCalculation: boolean;
    opportunityScore: boolean;
    companyResearch?: boolean;
    aiEnhancement?: boolean;
  };
  steps: Array<{
    step: number;
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    duration?: number;
    success: boolean;
    error?: string;
  }>;
  calculations: {
    roi?: {
      formula: string;
      inputs: Record<string, any>;
      result: number;
    };
    score?: {
      formula: string;
      breakdown: Record<string, number>;
      total: number;
    };
  };
  aiQueries?: Array<{
    type: 'claude' | 'atlas' | 'firecrawl';
    purpose: string;
    query: string;
    response?: any;
    tokens?: number;
  }>;
  transparency: {
    howROIWasCalculated: string;
    howScoreWasCalculated: string;
    howRecommendationsWereGenerated: string;
    dataSourcesUsed: string[];
    assumptionsMade: string[];
  };
}

/**
 * Generate derivation transparency for customer report
 */
export function deriveCustomerReport(
  report: CustomerReport,
  roi: ROICalculation,
  score: OpportunityScore,
  auditTrail?: any
): ReportDerivation {
  return {
    reportType: 'customer',
    generatedAt: new Date(),
    dataSources: {
      assessmentData: true,
      roiCalculation: true,
      opportunityScore: true,
      aiEnhancement: !!auditTrail,
    },
    steps: [
      {
        step: 1,
        name: 'Data Collection',
        description: 'Collected assessment responses from all 5 sections',
        inputs: ['section1', 'section2', 'section3', 'section4', 'section5'],
        outputs: ['assessmentData'],
        success: true,
      },
      {
        step: 2,
        name: 'ROI Calculation',
        description: 'Calculated annual costs, savings, and ROI based on field workers, pain points, and time spent',
        inputs: ['fieldWorkers', 'hoursPerWeek', 'painPoints', 'urgency'],
        outputs: ['totalAnnualCost', 'totalAnnualSavings', 'roiPercentage', 'paybackMonths'],
        success: true,
      },
      {
        step: 3,
        name: 'Opportunity Scoring',
        description: 'Scored opportunity based on urgency, pain severity, company size, timeline, likelihood, current state, and budget indicators',
        inputs: ['urgency', 'painPoints', 'fieldWorkers', 'timeline', 'likelihood', 'currentState', 'budgetIndicators'],
        outputs: ['opportunityScore', 'grade', 'priority'],
        success: true,
      },
      {
        step: 4,
        name: 'Base Report Generation',
        description: 'Generated structured report with ROI, solutions, and vision',
        inputs: ['assessmentData', 'roi', 'score'],
        outputs: ['customerReport'],
        success: true,
      },
      {
        step: 5,
        name: 'AI Enhancement',
        description: 'Enhanced report with industry benchmarks, peer comparison, success stories, and personalized insights',
        inputs: ['baseReport', 'assessmentData'],
        outputs: ['enhancedReport'],
        success: !!auditTrail,
      },
    ],
    calculations: {
      roi: {
        formula: 'Annual Savings - Appello Investment / Appello Investment × 100',
        inputs: {
          timeCostPerYear: roi.timeCostPerYear,
          profitMarginLoss: roi.profitMarginLoss,
          changeOrderLoss: roi.changeOrderLoss,
          complianceCosts: roi.complianceCosts,
          totalAnnualSavings: roi.totalAnnualSavings,
          appelloInvestment: roi.appelloInvestment.total,
        },
        result: roi.roiPercentage,
      },
      score: {
        formula: 'Sum of weighted factors (Urgency + Pain Severity + Company Size + Timeline + Likelihood + Current State + Budget Indicators)',
        breakdown: score.breakdown,
        total: score.totalScore,
      },
    },
    aiQueries: auditTrail?.reportGeneration?.entries?.map((entry: any) => ({
      type: entry.type === 'claude_query' ? 'claude' : entry.type === 'atlas_query' ? 'atlas' : 'firecrawl',
      purpose: entry.action,
      query: entry.details?.prompt || entry.details?.query || '',
      tokens: entry.tokens?.input + entry.tokens?.output || 0,
    })) || [],
    transparency: {
      howROIWasCalculated: `
        ROI was calculated using the following methodology:
        1. Time Costs: ${roi.hoursPerWeek} hours/week × 52 weeks × $35/hour = $${roi.timeCostPerYear.toLocaleString()}/year
        2. Money Costs: Profit margin loss (${((roi.profitMarginLoss / (roi.revenueLoss || 1)) * 100).toFixed(1)}% of revenue) + Change orders (${((roi.changeOrderLoss / (roi.revenueLoss || 1)) * 100).toFixed(1)}% of revenue) + Compliance costs = $${(roi.profitMarginLoss + roi.changeOrderLoss + roi.complianceCosts).toLocaleString()}/year
        3. Total Annual Cost: $${roi.totalAnnualCost.toLocaleString()}
        4. Appello Investment: $${roi.appelloInvestment.total.toLocaleString()} (one-time) + $${roi.appelloInvestment.software.toLocaleString()}/year
        5. Annual Savings: $${roi.totalAnnualSavings.toLocaleString()} (75% time savings + profit improvement + change order capture)
        6. ROI: ((${roi.totalAnnualSavings.toLocaleString()} - ${roi.appelloInvestment.software.toLocaleString()}) / ${roi.appelloInvestment.total.toLocaleString()}) × 100 = ${roi.roiPercentage.toFixed(1)}%
      `,
      howScoreWasCalculated: `
        Opportunity Score Breakdown (Total: ${score.totalScore}/100):
        - Urgency (${score.breakdown.urgency}/20): Based on urgency rating of ${report.urgency}/10
        - Pain Severity (${score.breakdown.painSeverity}/20): ${report.topPainPoints.length} pain points identified
        - Company Size (${score.breakdown.companySize}/15): ${report.fieldWorkers} field workers
        - Timeline (${score.breakdown.timeline}/15): ${report.timeline}
        - Likelihood (${score.breakdown.likelihood}/15): Based on assessment response
        - Current State (${score.breakdown.currentState}/10): Manual systems indicate higher opportunity
        - Budget Indicators (${score.breakdown.budgetIndicators}/5): Software evaluation and next steps
        Grade: ${score.grade} (${score.percentage}%)
        Priority: ${score.priority}
      `,
      howRecommendationsWereGenerated: `
        Recommendations were generated using:
        1. Assessment responses (pain points, urgency, timeline, likelihood)
        2. ROI calculations (showing specific savings opportunities)
        3. AI analysis of similar customers from ATLAS database
        4. Industry benchmarks and peer comparisons
        5. Personalized insights based on their specific situation
      `,
      dataSourcesUsed: [
        'Assessment form responses',
        'ROI calculation engine',
        'Opportunity scoring algorithm',
        ...(auditTrail ? ['ATLAS database (similar customers)', 'Claude AI (industry insights)', 'Claude AI (peer comparison)', 'Claude AI (success stories)'] : []),
      ],
      assumptionsMade: [
        `Average admin rate: $35/hour (industry standard)`,
        `Revenue per field worker: $120,000/year (industry average)`,
        `Time savings with Appello: 75% reduction (based on customer case studies)`,
        `Profit improvement: 60% recovery of margin loss (conservative estimate)`,
        `Change order capture: 80% of lost change orders`,
      ],
    },
  };
}

/**
 * Generate derivation transparency for admin report
 */
export function deriveAdminReport(
  report: AdminReport,
  companyResearch: CompanyResearch,
  auditTrail?: any
): ReportDerivation {
  return {
    reportType: 'admin',
    generatedAt: new Date(),
    dataSources: {
      assessmentData: true,
      roiCalculation: true,
      opportunityScore: true,
      companyResearch: !!companyResearch,
      aiEnhancement: !!auditTrail,
    },
    steps: [
      {
        step: 1,
        name: 'Company Web Research',
        description: 'Searched web for company information, website, and basic details',
        inputs: ['companyName', 'trade'],
        outputs: ['companyInfo', 'website'],
        success: !!companyResearch.companyInfo || !!companyResearch.website,
      },
      {
        step: 2,
        name: 'Website Analysis',
        description: 'Scraped and analyzed company website for technologies, services, and value propositions',
        inputs: ['website'],
        outputs: ['websiteAnalysis'],
        success: !!companyResearch.websiteAnalysis,
      },
      {
        step: 3,
        name: 'Competitor Research',
        description: 'Identified local competitors and their differentiation',
        inputs: ['companyName', 'trade', 'location'],
        outputs: ['competitors'],
        success: !!companyResearch.competitors && companyResearch.competitors.length > 0,
      },
      {
        step: 4,
        name: 'Industry Research',
        description: 'Researched industry trends, challenges, and opportunities',
        inputs: ['trade', 'fieldWorkers'],
        outputs: ['industryInsights'],
        success: !!companyResearch.industryInsights,
      },
      {
        step: 5,
        name: 'Tools Research',
        description: 'Analyzed software stack and integration opportunities',
        inputs: ['section3 (tools)'],
        outputs: ['toolsResearch'],
        success: !!companyResearch.toolsResearch,
      },
      {
        step: 6,
        name: 'ATLAS Intelligence',
        description: 'Queried ATLAS database for similar customers and case studies',
        inputs: ['trade', 'fieldWorkers', 'painPoints'],
        outputs: ['atlasIntelligence'],
        success: !!companyResearch.atlasIntelligence,
      },
      {
        step: 7,
        name: 'Sales Intelligence Generation',
        description: 'Generated sales recommendations, talking points, objections, and competitive advantages',
        inputs: ['allResearch', 'assessmentData'],
        outputs: ['salesIntelligence'],
        success: !!report.salesIntelligence,
      },
    ],
    calculations: {
      roi: {
        formula: 'Same as customer report',
        inputs: {},
        result: report.roi.roiPercentage,
      },
      score: {
        formula: 'Same as customer report',
        breakdown: report.opportunityScore.breakdown,
        total: report.opportunityScore.totalScore,
      },
    },
    aiQueries: auditTrail?.actions?.map((action: any) => ({
      type: action.type === 'claude_query' ? 'claude' : action.type === 'atlas_query' ? 'atlas' : 'firecrawl',
      purpose: action.action,
      query: action.details?.prompt || action.details?.query || '',
      tokens: action.tokens?.input + action.tokens?.output || 0,
    })) || [],
    transparency: {
      howROIWasCalculated: 'Same methodology as customer report',
      howScoreWasCalculated: 'Same methodology as customer report',
      howRecommendationsWereGenerated: `
        Sales recommendations were generated using:
        1. Comprehensive company research (web, website, competitors, industry)
        2. Tools and software stack analysis
        3. ATLAS database queries for similar customers
        4. AI analysis of buying signals and objections
        5. Assessment responses (timeline, likelihood, demo focus)
        6. Competitive intelligence analysis
      `,
      dataSourcesUsed: [
        'Assessment form responses',
        'Web search (Firecrawl)',
        'Company website scraping',
        'Competitor research',
        'Industry trend analysis',
        'ATLAS database (similar customers, case studies)',
        'Claude AI (sales intelligence generation)',
      ],
      assumptionsMade: [
        'Company website accurately represents their operations',
        'Competitor information from web search is current',
        'Industry trends are applicable to this company',
        'Similar customers in ATLAS are relevant comparisons',
      ],
    },
  };
}

