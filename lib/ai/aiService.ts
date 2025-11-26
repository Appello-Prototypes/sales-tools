/**
 * Unified AI Service
 * 
 * Combines MCP tools (ATLAS, Firecrawl) with Claude API
 * Provides high-level functions for AI-powered features
 */

import { chatWithClaude, analyzeWithClaude } from './claude';
import { queryATLAS, findSimilarCustomers, scrapeWithFirecrawl, searchWithFirecrawl } from './mcpTools';
import { AuditTrail } from './auditTrail';

export interface AssessmentContext {
  submissionId: string;
  currentStep: number;
  responses: Record<string, any>;
  profile?: {
    trade?: string;
    fieldWorkers?: string;
    painPoints?: string[];
  };
}

export interface SimilarCustomer {
  companyName: string;
  trade: string;
  fieldWorkers: string;
  painPoints: string[];
  outcomes: string[];
  roi?: number;
}

/**
 * Generate adaptive questions based on current responses
 */
export async function generateAdaptiveQuestions(context: AssessmentContext): Promise<string[]> {
  // Query ATLAS for similar customer patterns
  const similarCustomers = await findSimilarCustomers(context.profile || {});
  
  // Use Claude to generate questions based on patterns
  const prompt = `Based on these similar customer patterns and the current assessment responses, generate 2-3 follow-up questions that would help qualify this prospect better.

Similar Customers:
${JSON.stringify(similarCustomers.slice(0, 3), null, 2)}

Current Responses:
${JSON.stringify(context.responses, null, 2)}

Generate questions that:
1. Are relevant to their specific profile
2. Help identify ICP fit
3. Provide value to the prospect
4. Are concise and easy to answer

Return as a JSON array of question strings.`;

  const response = await analyzeWithClaude(
    prompt,
    'You are an expert at creating qualifying questions for B2B SaaS assessments.',
    { temperature: 0.8 }
  );

  try {
    const questions = JSON.parse(response);
    return Array.isArray(questions) ? questions : [response];
  } catch {
    // If not JSON, split by newlines
    return response.split('\n').filter(q => q.trim().length > 0);
  }
}

/**
 * Get real-time insights during assessment
 */
export async function getRealTimeInsights(context: AssessmentContext): Promise<string[]> {
  // Query ATLAS for insights
  const query = `Find insights about companies with trade=${context.profile?.trade}, fieldWorkers=${context.profile?.fieldWorkers}`;
  const atlasResults = await queryATLAS(query);
  
  // Use Claude to generate contextual insights
  const prompt = `Based on this assessment context and similar customer data, generate 2-3 real-time insights to show the prospect.

Assessment Context:
${JSON.stringify(context.responses, null, 2)}

Similar Customer Data:
${JSON.stringify(atlasResults.results?.slice(0, 2) || [], null, 2)}

Generate insights that:
1. Are relevant to their specific situation
2. Provide value (benchmarks, comparisons, recommendations)
3. Are concise and actionable
4. Build trust and engagement

Return as a JSON array of insight strings.`;

  const response = await analyzeWithClaude(
    prompt,
    'You are an expert at providing valuable insights to prospects during assessments.',
    { temperature: 0.7 }
  );

  try {
    const insights = JSON.parse(response);
    return Array.isArray(insights) ? insights : [response];
  } catch {
    return [response];
  }
}

/**
 * Find similar customers for report personalization
 */
export async function findSimilarCustomersForReport(
  profile: {
    trade?: string;
    fieldWorkers?: string;
    painPoints?: string[];
  },
  auditTrail?: AuditTrail
): Promise<SimilarCustomer[]> {
  const customers = await findSimilarCustomers(profile, auditTrail);
  
  // Enhance with Claude analysis
  const prompt = `Analyze these customer profiles and extract key information:

${JSON.stringify(customers.slice(0, 5), null, 2)}

Extract:
- Company name
- Trade
- Field workers
- Pain points
- Outcomes/ROI if available

Return as JSON array.`;

  const response = await analyzeWithClaude(
    prompt,
    'You are an expert at analyzing customer data.',
    {},
    auditTrail
  );
  
  try {
    return JSON.parse(response);
  } catch {
    return customers as SimilarCustomer[];
  }
}

/**
 * Research competitor assessments
 */
export async function researchCompetitorAssessments(competitorName: string): Promise<any> {
  // Search for competitor assessment pages
  const searchResults = await searchWithFirecrawl(
    `${competitorName} assessment tool pre-demo qualification`,
    { limit: 5 }
  );

  // Scrape relevant pages
  const competitorData = await Promise.all(
    (searchResults.data || []).slice(0, 3).map((result: any) =>
      scrapeWithFirecrawl(result.url, { formats: ['markdown'] })
    )
  );

  // Analyze with Claude
  const prompt = `Analyze these competitor assessment pages and extract:
1. Key questions they ask
2. Value propositions they offer
3. Report features
4. Assessment flow

Competitor Pages:
${JSON.stringify(competitorData.map((d: any) => d.markdown || d.content), null, 2)}`;

  const analysis = await analyzeWithClaude(
    prompt,
    'You are an expert at analyzing competitive assessment tools.'
  );

  return {
    competitorName,
    pages: competitorData,
    analysis,
  };
}

export default {
  generateAdaptiveQuestions,
  getRealTimeInsights,
  findSimilarCustomersForReport,
  researchCompetitorAssessments,
};

