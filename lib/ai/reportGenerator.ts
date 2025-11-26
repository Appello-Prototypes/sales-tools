/**
 * AI-Enhanced Report Generator
 * 
 * Uses Claude + MCP tools (ATLAS, Firecrawl) to generate personalized report content
 */

import { analyzeWithClaude } from './claude';
import { findSimilarCustomersForReport, researchCompetitorAssessments } from './aiService';
import { CustomerReport } from '../reports/reportGenerator';
import { AuditTrail, createAuditTrail, finalizeAuditTrail, addAuditEntry } from './auditTrail';
import { getScoringConfig } from '../config/scoringConfig';
import { CitationTracker, createCitationTracker, Citation } from './citationTracker';
import { CompanyResearch } from './researchService';

export interface AIEnhancedReport extends CustomerReport {
  // AI-Generated Sections (with citations)
  industryBenchmarks?: {
    fieldWorkersPercentile?: string;
    typicalROI?: string;
    averageSavings?: string;
    commonPainPoints?: string[];
    citations?: string[]; // Citation IDs
    _aiGenerated?: boolean; // Flag to mark as AI-generated
  };
  
  peerComparison?: {
    similarCompaniesCount?: number;
    averageROI?: number;
    commonOutcomes?: string[];
    typicalTimeline?: string;
    citations?: string[];
    _aiGenerated?: boolean;
  };
  
  successStories?: Array<{
    companyProfile: string;
    challenge: string;
    solution: string;
    outcome: string;
    citations?: string[];
    _aiGenerated?: boolean;
  }>;
  
  competitiveIntelligence?: {
    marketPosition?: string;
    differentiation?: string[];
    citations?: string[];
    _aiGenerated?: boolean;
  };
  
  personalizedInsights?: Array<{
    insight: string;
    citations?: string[];
    _aiGenerated?: boolean;
  }>;
  
  nextSteps?: {
    immediateActions?: string[];
    demoFocus?: string[];
    timelineGuidance?: string;
    citations?: string[];
    _aiGenerated?: boolean;
  };
  
  // Company Background (from website research)
  companyBackground?: {
    history?: string;
    founded?: string;
    headquarters?: string;
    keyMilestones?: Array<{ year?: number; event: string }>;
    mission?: string;
    values?: string[];
    citations?: string[];
    _source?: 'website_research';
  };
  
  // All citations for the report
  _citations?: Citation[];
}

/**
 * Enhance existing report with AI-generated content
 */
export async function enhanceReportWithAI(
  baseReport: CustomerReport,
  assessmentData: any,
  auditTrail?: AuditTrail,
  companyResearch?: CompanyResearch
): Promise<{ report: AIEnhancedReport; auditTrail: AuditTrail }> {
  const trail = auditTrail || createAuditTrail();
  const citationTracker = createCitationTracker();
  
  try {
    // Track report generation start
    addAuditEntry(trail, {
      action: 'Start AI Report Enhancement',
      type: 'data_source',
      details: {
        dataUsed: {
          trade: baseReport.trade,
          fieldWorkers: baseReport.fieldWorkers,
          painPoints: baseReport.topPainPoints,
        },
      },
    });

    // Find similar customers using ATLAS
    addAuditEntry(trail, {
      action: 'Finding Similar Customers',
      type: 'atlas_query',
      details: {
        query: `Similar customers: ${baseReport.trade}, ${baseReport.fieldWorkers} field workers`,
      },
    });
    const similarCustomers = await findSimilarCustomersForReport({
      trade: baseReport.trade,
      fieldWorkers: baseReport.fieldWorkers,
      painPoints: baseReport.topPainPoints,
    }, trail);

    // Cite ATLAS query
    const atlasCitationId = citationTracker.citeATLAS(
      `Similar customers: ${baseReport.trade}, ${baseReport.fieldWorkers} field workers`,
      similarCustomers
    );

    // Generate AI content sections with citations
    const [
      benchmarks,
      peerComparison,
      successStories,
      insights,
      nextSteps,
      companyBackground,
    ] = await Promise.all([
      generateIndustryBenchmarks(baseReport, similarCustomers, trail, citationTracker, atlasCitationId),
      generatePeerComparison(baseReport, similarCustomers, trail, citationTracker, atlasCitationId),
      generateSuccessStories(baseReport, similarCustomers, trail, citationTracker, atlasCitationId),
      generatePersonalizedInsights(baseReport, assessmentData, trail, citationTracker),
      generateNextSteps(baseReport, assessmentData, trail, citationTracker),
      generateCompanyBackground(companyResearch, citationTracker),
    ]);

    finalizeAuditTrail(trail);

    return {
      report: {
        ...baseReport,
        industryBenchmarks: benchmarks,
        peerComparison,
        successStories,
        personalizedInsights: insights,
        nextSteps,
        companyBackground,
        _citations: citationTracker.getAllCitations(),
      },
      auditTrail: trail,
    };
  } catch (error) {
    console.error('Error enhancing report with AI:', error);
    
    addAuditEntry(trail, {
      action: 'AI Report Enhancement Error',
      type: 'error',
      details: {
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
    
    finalizeAuditTrail(trail);
    
    // Return base report if AI enhancement fails
    return {
      report: {
        ...baseReport,
        _citations: citationTracker.getAllCitations(),
      } as AIEnhancedReport,
      auditTrail: trail,
    };
  }
}

/**
 * Generate company background from website research
 */
function generateCompanyBackground(
  companyResearch?: CompanyResearch,
  citationTracker?: CitationTracker
): AIEnhancedReport['companyBackground'] {
  if (!companyResearch?.websiteAnalysis?.companyHistory) {
    return undefined;
  }

  const history = companyResearch.websiteAnalysis.companyHistory;
  const citations: string[] = [];

  // Cite company website if available
  if (companyResearch.website) {
    const citationId = citationTracker?.citeCompanyWebsite(
      companyResearch.website,
      JSON.stringify(history)
    );
    if (citationId) citations.push(citationId);
  }

  return {
    history: history.companyBackground,
    founded: history.founded || (history.foundingYear ? history.foundingYear.toString() : undefined),
    headquarters: history.headquarters,
    keyMilestones: history.keyMilestones,
    mission: history.mission,
    values: history.values,
    citations,
    _source: 'website_research',
  };
}

/**
 * Generate industry benchmarks
 */
async function generateIndustryBenchmarks(
  report: CustomerReport,
  similarCustomers: any[],
  auditTrail: AuditTrail,
  citationTracker?: CitationTracker,
  atlasCitationId?: string
): Promise<AIEnhancedReport['industryBenchmarks']> {
  // Load custom prompts if available
  let customPromptPrefix = '';
  try {
    const config = await getScoringConfig();
    if (config.customPrompts?.industryBenchmarks) {
      customPromptPrefix = `${config.customPrompts.industryBenchmarks}\n\n`;
    }
  } catch (error) {
    // Use default if config load fails
  }
  
  const prompt = `${customPromptPrefix}Based on this company profile and similar customer data, generate industry benchmarks with specific statistics and data points.

Company Profile:
- Trade: ${report.trade}
- Field Workers: ${report.fieldWorkers}
- Top Pain Points: ${report.topPainPoints.join(', ')}
- Annual Savings Potential: $${report.annualSavings.toLocaleString()}

Similar Customers Data (from ATLAS database):
${JSON.stringify(similarCustomers.slice(0, 5), null, 2)}

Generate benchmarks in this JSON format with specific numbers and statistics:
{
  "fieldWorkersPercentile": "Your company size puts you in the top X% of ${report.trade} contractors (based on analysis of ${similarCustomers.length} similar companies)",
  "typicalROI": "Companies like yours typically see X% ROI (average from ${similarCustomers.length} similar customers)",
  "averageSavings": "Similar companies save an average of $X annually (calculated from ${similarCustomers.length} comparable companies)",
  "commonPainPoints": ["pain point 1 (affects X% of similar companies)", "pain point 2 (affects Y% of similar companies)"]
}

IMPORTANT: Include specific numbers, percentages, and statistics. Reference the data sources (ATLAS database, similar customer analysis). Be data-driven and specific.`;

  try {
    const aiCitationId = citationTracker?.citeAI(
      'Industry Benchmarks',
      'Claude Sonnet 4.5',
      prompt.substring(0, 200),
      0.85
    );

    const response = await analyzeWithClaude(
      prompt,
      'You are an expert at analyzing industry data and creating benchmarks for B2B reports. Always include specific statistics and cite your data sources.',
      { temperature: 0.7 },
      auditTrail
    );

    // Try to parse JSON, fallback to text
    try {
      const benchmarks = JSON.parse(response);
      return {
        ...benchmarks,
        citations: [atlasCitationId, aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    } catch {
      // If not JSON, return structured data from text
      return {
        fieldWorkersPercentile: extractFromText(response, 'percentile'),
        typicalROI: extractFromText(response, 'ROI'),
        averageSavings: extractFromText(response, 'savings'),
        commonPainPoints: report.topPainPoints,
        citations: [atlasCitationId, aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    }
  } catch (error) {
    console.error('Error generating benchmarks:', error);
    return undefined;
  }
}

/**
 * Generate peer comparison
 */
async function generatePeerComparison(
  report: CustomerReport,
  similarCustomers: any[],
  auditTrail: AuditTrail,
  citationTracker?: CitationTracker,
  atlasCitationId?: string
): Promise<AIEnhancedReport['peerComparison']> {
  if (similarCustomers.length === 0) {
    return undefined;
  }

  // Load custom prompts if available
  let customPromptPrefix = '';
  try {
    const config = await getScoringConfig();
    if (config.customPrompts?.peerComparison) {
      customPromptPrefix = `${config.customPrompts.peerComparison}\n\n`;
    }
  } catch (error) {
    // Use default if config load fails
  }

  const prompt = `${customPromptPrefix}Based on similar customer data from ATLAS database, create a peer comparison with specific statistics.

Company Profile:
- Trade: ${report.trade}
- Field Workers: ${report.fieldWorkers}
- ROI: ${report.roiPercentage}%
- Annual Savings: $${report.annualSavings.toLocaleString()}

Similar Customers (from ATLAS database):
${JSON.stringify(similarCustomers.slice(0, 5), null, 2)}

Generate comparison in JSON format with specific numbers:
{
  "similarCompaniesCount": ${similarCustomers.length},
  "averageROI": <calculate average from similar customers>,
  "commonOutcomes": ["outcome 1 (X% of similar companies)", "outcome 2 (Y% of similar companies)"],
  "typicalTimeline": "X months (based on ${similarCustomers.length} similar implementations)"
}

IMPORTANT: Calculate actual averages from the similar customers data. Include percentages and statistics. Reference ATLAS database as the source.`;

  try {
    const aiCitationId = citationTracker?.citeAI(
      'Peer Comparison',
      'Claude Sonnet 4.5',
      prompt.substring(0, 200),
      0.85
    );

    const response = await analyzeWithClaude(
      prompt,
      'You are an expert at creating peer comparisons for B2B reports. Calculate actual statistics from the data provided.',
      { temperature: 0.7 },
      auditTrail
    );

    try {
      const comparison = JSON.parse(response);
      return {
        ...comparison,
        citations: [atlasCitationId, aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    } catch {
      return {
        similarCompaniesCount: similarCustomers.length,
        averageROI: report.roiPercentage,
        commonOutcomes: ['Improved efficiency', 'Reduced administrative time'],
        typicalTimeline: '3-6 months',
        citations: [atlasCitationId, aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    }
  } catch (error) {
    console.error('Error generating peer comparison:', error);
    return undefined;
  }
}

/**
 * Generate relevant success stories
 */
async function generateSuccessStories(
  report: CustomerReport,
  similarCustomers: any[],
  auditTrail: AuditTrail,
  citationTracker?: CitationTracker,
  atlasCitationId?: string
): Promise<AIEnhancedReport['successStories']> {
  if (similarCustomers.length === 0) {
    return undefined;
  }

  // Load custom prompts if available
  let customPromptPrefix = '';
  try {
    const config = await getScoringConfig();
    if (config.customPrompts?.successStories) {
      customPromptPrefix = `${config.customPrompts.successStories}\n\n`;
    }
  } catch (error) {
    // Use default if config load fails
  }

  const prompt = `${customPromptPrefix}Based on similar customer profiles from ATLAS database, generate 2-3 relevant success stories with specific, quantifiable outcomes.

Company Profile:
- Trade: ${report.trade}
- Field Workers: ${report.fieldWorkers}
- Pain Points: ${report.topPainPoints.join(', ')}

Similar Customers (from ATLAS database):
${JSON.stringify(similarCustomers.slice(0, 3), null, 2)}

Generate success stories in JSON array format with specific numbers:
[
  {
    "companyProfile": "Brief description (e.g., 'HVAC contractor with 30 field workers')",
    "challenge": "Their main challenge (be specific)",
    "solution": "How Appello solved it (specific features/processes)",
    "outcome": "Quantifiable result with specific numbers (e.g., 'Saved 15 hours/week, $50K annually, 85% ROI in 4 months')"
  }
]

IMPORTANT: Use actual data from similar customers when available. Include specific numbers, percentages, timeframes. Reference ATLAS database as the source. Make stories relevant to the company's specific pain points.`;

  try {
    const response = await analyzeWithClaude(
      prompt,
      'You are an expert at writing compelling customer success stories for B2B reports.',
      { temperature: 0.8 },
      auditTrail
    );

    const aiCitationId = citationTracker?.citeAI(
      'Success Stories',
      'Claude Sonnet 4.5',
      prompt.substring(0, 200),
      0.8
    );

    try {
      const stories = JSON.parse(response);
      return Array.isArray(stories) 
        ? stories.map(story => ({
            ...story,
            citations: [atlasCitationId, aiCitationId].filter(Boolean),
            _aiGenerated: true,
          }))
        : undefined;
    } catch {
      // Fallback: Generate from similar customers data
      return similarCustomers.slice(0, 2).map((customer: any) => ({
        companyProfile: `${customer.trade || 'Trade'} contractor with ${customer.fieldWorkers || 'field workers'}`,
        challenge: report.topPainPoints[0] || 'Operational inefficiencies',
        solution: 'Implemented Appello field workforce management',
        outcome: `Achieved ${report.roiPercentage}% ROI`,
        citations: [atlasCitationId, aiCitationId].filter(Boolean),
        _aiGenerated: true,
      }));
    }
  } catch (error) {
    console.error('Error generating success stories:', error);
    return undefined;
  }
}

/**
 * Generate personalized insights
 */
async function generatePersonalizedInsights(
  report: CustomerReport,
  assessmentData: any,
  auditTrail: AuditTrail,
  citationTracker?: CitationTracker
): Promise<AIEnhancedReport['personalizedInsights']> {
  // Load custom prompts if available
  let customPromptPrefix = '';
  try {
    const config = await getScoringConfig();
    if (config.customPrompts?.personalizedInsights) {
      customPromptPrefix = `${config.customPrompts.personalizedInsights}\n\n`;
    }
  } catch (error) {
    // Use default if config load fails
  }

  const prompt = `${customPromptPrefix}Based on this assessment, generate 3-5 personalized insights with specific statistics and actionable recommendations.

Assessment Summary:
- Trade: ${report.trade}
- Field Workers: ${report.fieldWorkers}
- Pain Points: ${report.topPainPoints.join(', ')}
- Magic Wand: ${report.magicWand}
- Urgency: ${report.urgency}/10
- Annual Savings Potential: $${report.annualSavings.toLocaleString()}
- ROI: ${report.roiPercentage}%

Generate insights that:
1. Are specific to their situation (reference their trade, size, pain points)
2. Include specific numbers or statistics when possible
3. Provide actionable value (what they should do)
4. Build trust and credibility (reference industry data or benchmarks)
5. Are concise (1-2 sentences each)

Return as JSON array of strings. Each insight should be data-driven and specific.`;

  try {
    const aiCitationId = citationTracker?.citeAI(
      'Personalized Insights',
      'Claude Sonnet 4.5',
      prompt.substring(0, 200),
      0.85
    );

    const response = await analyzeWithClaude(
      prompt,
      'You are an expert at providing valuable insights to prospects during assessments. Always include specific statistics and actionable recommendations.',
      { temperature: 0.7 },
      auditTrail
    );

    try {
      // Try to parse JSON array
      let insights = JSON.parse(response);
      if (!Array.isArray(insights)) {
        // If it's a JSON object with an array inside, extract it
        if (typeof insights === 'object' && insights !== null) {
          const values = Object.values(insights);
          if (values.length > 0 && Array.isArray(values[0])) {
            insights = values[0];
          } else {
            insights = [response];
          }
        } else {
          insights = [response];
        }
      }
      
      // Convert to array of objects with citations
      return insights.map((insight: string) => ({
        insight,
        citations: [aiCitationId].filter(Boolean),
        _aiGenerated: true,
      }));
    } catch {
      // If response contains JSON code block, extract it
      const jsonMatch = response.match(/```json\s*(\[.*?\])\s*```/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const insights = Array.isArray(parsed) ? parsed : [response];
          return insights.map((insight: string) => ({
            insight,
            citations: [aiCitationId].filter(Boolean),
            _aiGenerated: true,
          }));
        } catch {
          return [{
            insight: response,
            citations: [aiCitationId].filter(Boolean),
            _aiGenerated: true,
          }];
        }
      }
      return [{
        insight: response,
        citations: [aiCitationId].filter(Boolean),
        _aiGenerated: true,
      }];
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}

/**
 * Generate next steps
 */
async function generateNextSteps(
  report: CustomerReport,
  assessmentData: any,
  auditTrail: AuditTrail,
  citationTracker?: CitationTracker
): Promise<AIEnhancedReport['nextSteps']> {
  // Load custom prompts if available
  let customPromptPrefix = '';
  try {
    const config = await getScoringConfig();
    if (config.customPrompts?.nextSteps) {
      customPromptPrefix = `${config.customPrompts.nextSteps}\n\n`;
    }
  } catch (error) {
    // Use default if config load fails
  }

  const prompt = `${customPromptPrefix}Based on this assessment, generate personalized next steps.

Assessment Summary:
- Timeline: ${report.timeline}
- Demo Focus: ${report.recommendedDemoFocus.join(', ')}
- Urgency: ${report.urgency}/10
- ROI: ${report.roiPercentage}%

Generate next steps in JSON format:
{
  "immediateActions": ["action 1", "action 2"],
  "demoFocus": ["focus area 1", "focus area 2"],
  "timelineGuidance": "Guidance based on their timeline"
}`;

  try {
    const response = await analyzeWithClaude(
      prompt,
      'You are an expert at guiding prospects through next steps in B2B sales.',
      { temperature: 0.7 },
      auditTrail
    );

    const aiCitationId = citationTracker?.citeAI(
      'Next Steps',
      'Claude Sonnet 4.5',
      prompt.substring(0, 200),
      0.8
    );

    try {
      const nextSteps = JSON.parse(response);
      return {
        ...nextSteps,
        citations: [aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    } catch {
      return {
        immediateActions: [
          'Schedule a personalized demo',
          'Review this report with your team',
        ],
        demoFocus: report.recommendedDemoFocus,
        timelineGuidance: `Based on your timeline of "${report.timeline}", here's what to do next...`,
        citations: [aiCitationId].filter(Boolean),
        _aiGenerated: true,
      };
    }
  } catch (error) {
    console.error('Error generating next steps:', error);
    return undefined;
  }
}

/**
 * Helper to extract information from text
 */
function extractFromText(text: string, type: string): string {
  // Simple extraction - can be enhanced
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(type.toLowerCase())) {
      return line.trim();
    }
  }
  return '';
}

export default {
  enhanceReportWithAI,
};

