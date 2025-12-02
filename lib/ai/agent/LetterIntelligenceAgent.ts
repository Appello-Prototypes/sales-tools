/**
 * Letter Intelligence Agent
 * 
 * An AI agent that deeply researches a company/contact before generating
 * a highly personalized letter. Uses ATLAS for historical knowledge,
 * HubSpot for CRM data, and Firecrawl for web research.
 * 
 * The agent:
 * 1. Determines customer vs prospect status from HubSpot
 * 2. Researches the company background
 * 3. Finds similar customers and their success stories
 * 4. Identifies pain points and opportunities
 * 5. Crafts a personalized, research-backed letter
 * 
 * Prompts are configurable via the LetterPromptConfig model.
 */

import {
  AgentEngine,
  AgentTool,
  AgentContext,
  AgentProgress,
  createAtlasTool,
  loadHubspotTools,
  loadFirecrawlTools,
  createFunctionTool,
} from './index';

import connectDB from '@/lib/mongodb';
import LetterPromptConfig, {
  getPromptConfig,
  ILetterPromptConfig,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_LETTER_TYPES,
  DEFAULT_TONES,
  DEFAULT_RESEARCH_INSTRUCTIONS,
  DEFAULT_QUALITY_STANDARDS,
} from '@/models/LetterPromptConfig';

// ============================================================================
// Types
// ============================================================================

export interface LetterContext extends AgentContext {
  companyId?: string;
  companyName: string;
  companyIndustry?: string;
  companyDomain?: string;
  companyLocation?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  letterType: string; // Now supports custom types
  customInstructions?: string;
  tone?: string; // Now supports custom tones
  isExistingCustomer?: boolean; // Determined from HubSpot
  promptConfig?: ILetterPromptConfig; // Optional override
}

export interface LetterIntelligenceOutput {
  letter: string;
  subject?: string;
  researchSummary: {
    companyInsights: string[];
    industryContext: string[];
    similarCustomers: string[];
    painPoints: string[];
    opportunities: string[];
    customerStatus?: 'existing_customer' | 'prospect' | 'unknown';
    // Prior interactions found in HubSpot - CRITICAL for follow-up letters
    priorInteractions?: {
      found: boolean;
      interactions: Array<{
        date: string;
        type: 'call' | 'meeting' | 'email' | 'note' | 'other';
        summary: string;
        participants?: string[];
      }>;
      summary: string; // e.g., "3 documented calls between Jan-Mar 2024" or "No prior interactions found"
    };
  };
  personalizationPoints: string[];
  suggestedFollowUp?: string;
  confidence: number;
}

// ============================================================================
// Prompt Configuration Loader
// ============================================================================

let cachedConfig: ILetterPromptConfig | null = null;
let configLoadedAt: number = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute cache

/**
 * Load prompt configuration (with caching)
 */
export async function loadPromptConfig(forceRefresh = false): Promise<ILetterPromptConfig> {
  const now = Date.now();
  
  if (!forceRefresh && cachedConfig && (now - configLoadedAt) < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  
  try {
    await connectDB();
    cachedConfig = await getPromptConfig();
    configLoadedAt = now;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load prompt config, using defaults:', error);
    // Return default config if DB fails
    return {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      letterTypes: DEFAULT_LETTER_TYPES,
      tones: DEFAULT_TONES,
      defaults: {
        letterType: 'cold_outreach',
        tone: 'professional',
        maxWordCount: 150,
        includeSubject: true,
      },
      researchInstructions: DEFAULT_RESEARCH_INSTRUCTIONS,
      qualityStandards: DEFAULT_QUALITY_STANDARDS,
      version: 1,
      lastUpdatedBy: 'defaults',
    } as ILetterPromptConfig;
  }
}

// ============================================================================
// System Prompt Builder
// ============================================================================

/**
 * Build the complete system prompt from configuration
 */
export function buildSystemPrompt(
  config: ILetterPromptConfig,
  letterType: string,
  tone: string,
  customInstructions?: string
): string {
  const parts: string[] = [];
  
  // Base system prompt
  parts.push(config.systemPrompt);
  
  // Research instructions
  parts.push('\n## Research Instructions');
  parts.push(config.researchInstructions.customerVsProspectPrompt);
  parts.push('\n### ATLAS Knowledge Base');
  parts.push(config.researchInstructions.atlasPrompt);
  parts.push('\n### HubSpot CRM');
  parts.push(config.researchInstructions.hubspotPrompt);
  parts.push('\n### Firecrawl Web Research');
  parts.push(config.researchInstructions.firecrawlPrompt);
  
  // Letter type specific instructions
  const letterTypeConfig = config.letterTypes.find(t => t.id === letterType && t.isActive);
  if (letterTypeConfig) {
    parts.push('\n' + letterTypeConfig.prompt);
  }
  
  // Tone instructions
  const toneConfig = config.tones.find(t => t.id === tone && t.isActive);
  if (toneConfig) {
    parts.push(`\n## Tone: ${toneConfig.name}`);
    parts.push(toneConfig.prompt);
  }
  
  // Quality standards
  parts.push('\n' + config.qualityStandards);
  
  // Custom instructions (if any)
  if (customInstructions) {
    parts.push('\n## Additional Custom Instructions');
    parts.push(customInstructions);
  }
  
  // Output format instructions
  parts.push(`
## Output Format
When you call finish_letter, provide structured JSON with:
{
  "letter": "The complete letter text",
  "subject": "Email subject line",
  "researchSummary": {
    "companyInsights": ["insight1", "insight2"],
    "industryContext": ["context1", "context2"],
    "similarCustomers": ["customer1", "customer2"],
    "painPoints": ["pain1", "pain2"],
    "opportunities": ["opp1", "opp2"],
    "customerStatus": "existing_customer" | "prospect" | "unknown",
    "priorInteractions": {
      "found": true/false,
      "interactions": [
        {"date": "2024-01-15", "type": "call", "summary": "Discussed project timeline", "participants": ["John Smith"]}
      ],
      "summary": "2 documented calls in Q1 2024" OR "No prior interactions found in HubSpot"
    }
  },
  "personalizationPoints": ["point1", "point2"],
  "suggestedFollowUp": "Suggestion for next steps",
  "confidence": 0.85
}

### CRITICAL ACCURACY RULES:
1. The "priorInteractions" field MUST be populated based on actual HubSpot data
2. If "found" is false, the letter MUST NOT reference any previous conversations
3. Every claim in the letter must be traceable to a research finding
4. If letter type is "follow_up" but no prior interactions exist, write as cold outreach instead`);
  
  return parts.join('\n');
}

// ============================================================================
// Agent Factory
// ============================================================================

export async function createLetterIntelligenceAgent(
  letterType: string = 'cold_outreach',
  tone: string = 'professional',
  customInstructions?: string,
  promptConfig?: ILetterPromptConfig
): Promise<AgentEngine<LetterContext, LetterIntelligenceOutput>> {
  // Load tools
  const tools: AgentTool[] = [
    createAtlasTool(),
    ...(await loadHubspotTools()),
    ...(await loadFirecrawlTools()),
  ];

  // Load or use provided config
  const config = promptConfig || await loadPromptConfig();
  
  // Build the complete system prompt
  const systemPrompt = buildSystemPrompt(config, letterType, tone, customInstructions);

  return new AgentEngine<LetterContext, LetterIntelligenceOutput>({
    name: 'letter-intelligence',
    systemPrompt,
    tools,
    maxIterations: 50, // Allow thorough research
    finishToolName: 'finish_letter',
  });
}

// ============================================================================
// Helper: Build User Message
// ============================================================================

export function buildLetterPrompt(context: LetterContext): string {
  const parts: string[] = [
    `Generate a ${context.letterType.replace(/_/g, ' ')} letter for:`,
    '',
    `## Target Company`,
    `- Company: ${context.companyName}`,
  ];

  if (context.companyIndustry) parts.push(`- Industry: ${context.companyIndustry}`);
  if (context.companyLocation) parts.push(`- Location: ${context.companyLocation}`);
  if (context.companyDomain) parts.push(`- Website: ${context.companyDomain}`);
  if (context.companyId) parts.push(`- HubSpot Company ID: ${context.companyId}`);

  if (context.contactName) {
    parts.push('', '## Target Contact');
    parts.push(`- Name: ${context.contactName}`);
    if (context.contactTitle) parts.push(`- Title: ${context.contactTitle}`);
    if (context.contactEmail) parts.push(`- Email: ${context.contactEmail}`);
  }

  // Customer status hint (if already determined)
  if (context.isExistingCustomer !== undefined) {
    parts.push('', '## Customer Status (Pre-determined)');
    parts.push(context.isExistingCustomer 
      ? '⚠️ This is an EXISTING CUSTOMER - adjust your approach accordingly'
      : '⚠️ This is a NEW PROSPECT - focus on establishing credibility'
    );
  }

  parts.push('', '## Your Task');
  parts.push('1. FIRST: Check HubSpot to determine if this is an existing customer or prospect');
  parts.push('2. Research this company thoroughly using ATLAS, HubSpot, and Firecrawl');
  parts.push('3. Find similar customers, relevant case studies, and industry insights');
  parts.push('4. Identify specific pain points and opportunities');
  parts.push('5. Write a highly personalized letter based on your research');
  parts.push('6. Call finish_letter when ready with your complete analysis');

  parts.push('', 'Be thorough in your research - the quality of the letter depends on it.');
  parts.push('IMPORTANT: Determine customer vs prospect status BEFORE writing the letter.');

  return parts.join('\n');
}

// ============================================================================
// Main Function: Generate Letter with Intelligence
// ============================================================================

export async function generateLetterWithIntelligence(
  context: LetterContext,
  onProgress: (progress: AgentProgress) => void
): Promise<{
  success: boolean;
  output?: LetterIntelligenceOutput;
  error?: string;
  stats: { iterations: number; toolCalls: number };
  promptConfig?: {
    letterType: string;
    tone: string;
    version: number;
  };
}> {
  try {
    // Load prompt configuration
    const promptConfig = context.promptConfig || await loadPromptConfig();
    
    onProgress({
      type: 'thinking',
      timestamp: new Date(),
      data: {
        message: `Loading prompt configuration (v${promptConfig.version})...`,
      },
    });

    // Create the agent with configurable prompts
    const agent = await createLetterIntelligenceAgent(
      context.letterType,
      context.tone || 'professional',
      context.customInstructions,
      promptConfig
    );

    // Build the prompt
    const userMessage = buildLetterPrompt(context);

    // Run the agent
    const result = await agent.run(userMessage, context, onProgress);

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      stats: {
        iterations: result.iterations,
        toolCalls: result.toolCalls,
      },
      promptConfig: {
        letterType: context.letterType,
        tone: context.tone || 'professional',
        version: promptConfig.version,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stats: { iterations: 0, toolCalls: 0 },
    };
  }
}

// ============================================================================
// Utility: Get Available Letter Types and Tones
// ============================================================================

export async function getAvailableOptions(): Promise<{
  letterTypes: Array<{ id: string; name: string; description: string; isCustom: boolean }>;
  tones: Array<{ id: string; name: string; description: string }>;
}> {
  const config = await loadPromptConfig();
  
  return {
    letterTypes: config.letterTypes
      .filter(t => t.isActive)
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        isCustom: t.isCustom,
      })),
    tones: config.tones
      .filter(t => t.isActive)
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
  };
}
