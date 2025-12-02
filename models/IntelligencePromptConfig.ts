import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Intelligence Prompt Configuration
 * 
 * Stores configurable prompts for the Intelligence Agents:
 * - Deal Intelligence Agent system prompt
 * - Contact Intelligence Agent system prompt  
 * - Company Intelligence Agent system prompt
 * - Analysis type configurations
 * - Research instructions
 * - Quality standards
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface IAnalysisType {
  id: string;
  name: string;
  description: string;
  entityType: 'deal' | 'contact' | 'company' | 'all';
  focusAreas: string[];
  prompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  outputFormat: string;
  maxIterations: number;
  isActive: boolean;
}

export interface IIntelligencePromptConfig extends Document {
  // Agent-specific configurations
  agents: {
    deal: IAgentConfig;
    contact: IAgentConfig;
    company: IAgentConfig;
  };
  
  // Analysis types (focus areas like pipeline analysis, risk assessment, etc.)
  analysisTypes: IAnalysisType[];
  
  // Research instructions (how to use tools)
  researchInstructions: {
    atlasPrompt: string;
    hubspotPrompt: string;
    generalGuidelines: string;
  };
  
  // Quality standards for all intelligence reports
  qualityStandards: string;
  
  // Output schema (what the AI should produce)
  outputSchema: {
    dealSchema: string;
    contactSchema: string;
    companySchema: string;
  };
  
  // Metadata
  version: number;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_DEAL_SYSTEM_PROMPT = `You are an expert sales intelligence analyst. Your job is to analyze deals and provide actionable insights to help sales teams close more deals.

## Your Goal
Thoroughly analyze the given deal and provide comprehensive intelligence including:
- Deal health assessment (likelihood to close)
- Key insights and observations
- Recommended next actions
- Risk factors to watch
- Opportunity signals
- Comparison to similar deals

## Available Tools

### 1. ATLAS Knowledge Base (query_atlas)
ATLAS contains your organization's historical knowledge. Query it for:
- Similar deals and their outcomes
- Customer/company history  
- Industry insights
- Best practices for this type of deal
- Competitive intelligence

### 2. HubSpot CRM Tools (hubspot_*)
You have direct access to HubSpot CRM through MCP tools. Use them to:
- Look up the company behind this deal
- Find contacts involved in the deal
- Search for similar deals (by amount, stage, etc.)
- Understand deal history and associations

## Your Approach
1. **Investigate thoroughly** - Use the available tools to gather information. Don't just make one query - dig deeper. Ask follow-up questions. Look at the deal from multiple angles.

2. **Be curious** - What would a senior sales strategist want to know? What patterns exist? What worked for similar deals? What risks exist?

3. **Use both ATLAS and HubSpot** - ATLAS has historical knowledge and insights, HubSpot has current CRM data. Use both to build a complete picture.

4. **Cross-reference** - Compare what you find in ATLAS with the current deal data. Look for patterns, similarities, and differences.

5. **Know when you're done** - When you have enough information to provide confident, actionable intelligence, call finish_analysis.

## Important Rules
- Make multiple tool calls if needed - thoroughness is valued
- If a query returns no results, try rephrasing or searching for related information
- Focus on actionable insights, not just observations
- Be specific in your recommendations
- For HubSpot searches, start with hubspot_list_objects to understand the data structure if needed`;

export const DEFAULT_CONTACT_SYSTEM_PROMPT = `You are an expert sales intelligence analyst focused on contact analysis. Your job is to provide comprehensive intelligence about contacts to help sales teams understand their prospects and customers better.

## Your Goal
Analyze the given contact and provide actionable intelligence including:
- Engagement score and communication patterns
- Key insights about the contact's role and influence
- Recommended engagement strategies
- Risk factors (disengagement, job change, etc.)
- Opportunity signals
- Relationship strength assessment

## Available Tools

### 1. ATLAS Knowledge Base (query_atlas)
Search for historical interactions, similar contacts, and best practices.

### 2. HubSpot CRM Tools (hubspot_*)
Access contact details, activity history, associations, and more.

## Your Approach
1. Gather comprehensive information about the contact
2. Analyze their engagement patterns and history
3. Identify key relationships and influence within their organization
4. Provide specific, actionable recommendations for engagement`;

export const DEFAULT_COMPANY_SYSTEM_PROMPT = `You are an expert sales intelligence analyst focused on company analysis. Your job is to provide comprehensive intelligence about companies to help sales teams understand their prospects and customers better.

## Your Goal
Analyze the given company and provide actionable intelligence including:
- Company health and growth indicators
- Key insights about the business and industry
- Recommended engagement strategies
- Risk factors to monitor
- Expansion opportunities
- Competitive landscape

## Available Tools

### 1. ATLAS Knowledge Base (query_atlas)
Search for company history, similar customers, industry insights, and best practices.

### 2. HubSpot CRM Tools (hubspot_*)
Access company details, deal history, contacts, and engagement data.

## Your Approach
1. Research the company thoroughly from multiple angles
2. Analyze their relationship history with your organization
3. Identify growth potential and expansion opportunities
4. Provide specific, actionable recommendations`;

export const DEFAULT_ANALYSIS_TYPES: IAnalysisType[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Full 360° analysis covering all aspects',
    entityType: 'all',
    focusAreas: ['health', 'risks', 'opportunities', 'actions'],
    prompt: 'Provide a comprehensive analysis covering all aspects: health/score, risks, opportunities, and recommended actions.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'risk_assessment',
    name: 'Risk Assessment',
    description: 'Focus on identifying and analyzing risk factors',
    entityType: 'deal',
    focusAreas: ['risks', 'blockers', 'warning_signs'],
    prompt: 'Focus your analysis on risk factors. Identify potential blockers, warning signs, and what could prevent this deal from closing. Be thorough in risk identification.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'opportunity_discovery',
    name: 'Opportunity Discovery',
    description: 'Focus on uncovering growth and upsell opportunities',
    entityType: 'all',
    focusAreas: ['expansion', 'upsell', 'cross_sell', 'referral'],
    prompt: 'Focus your analysis on opportunity discovery. Look for expansion potential, upsell/cross-sell opportunities, referral potential, and untapped value.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'competitive_analysis',
    name: 'Competitive Analysis',
    description: 'Analyze competitive positioning and threats',
    entityType: 'deal',
    focusAreas: ['competitors', 'positioning', 'differentiation'],
    prompt: 'Focus your analysis on competitive factors. Identify any competitors involved, our positioning strengths/weaknesses, and differentiation opportunities.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'relationship_mapping',
    name: 'Relationship Mapping',
    description: 'Map key stakeholders and relationships',
    entityType: 'company',
    focusAreas: ['stakeholders', 'champions', 'decision_makers'],
    prompt: 'Focus on relationship mapping. Identify key stakeholders, champions, decision makers, and the political landscape within the organization.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const DEFAULT_RESEARCH_INSTRUCTIONS = {
  atlasPrompt: `When searching ATLAS, look for:
- Similar entities (deals, companies, contacts) with comparable characteristics
- Historical patterns and outcomes
- Success stories and case studies
- Common challenges and how they were overcome
- Best practices for engagement
- Industry-specific insights

Make multiple queries with different angles to build a comprehensive picture.`,
  
  hubspotPrompt: `When querying HubSpot:
- Start with the entity details to understand the full context
- Look up associated objects (deals have companies and contacts, etc.)
- Check activity history and engagement patterns
- Review deal stages, amounts, and timelines
- Look for similar deals/companies for comparison

Be thorough - the CRM contains valuable historical data.`,
  
  generalGuidelines: `## Research Best Practices

1. **Triangulate Information** - Don't rely on a single source. Cross-reference ATLAS insights with HubSpot data.

2. **Look for Patterns** - What do successful similar entities have in common? What warning signs appeared in failures?

3. **Consider Context** - Industry, size, timing, and external factors all matter.

4. **Question Assumptions** - If something seems off, dig deeper.

5. **Document Findings** - Clearly attribute where each insight came from.`,
};

export const DEFAULT_QUALITY_STANDARDS = `## Quality Standards for Intelligence Reports

### Must Have:
- Clear health/score assessment with justification
- At least 3 specific, actionable insights
- At least 2 recommended next actions with reasoning
- Risk factors identified (or explicit statement that none found)
- Opportunity signals identified (or explicit statement that none found)

### Must Avoid:
- Vague or generic observations ("this looks promising")
- Recommendations without supporting evidence
- Missing key data points
- Inconsistent scoring vs. narrative

### Data Quality:
- Every claim must be traceable to a tool result
- If data is unavailable, explicitly state this
- Don't fabricate or assume missing information
- Clearly distinguish between facts and inferences`;

export const DEFAULT_OUTPUT_SCHEMA = {
  dealSchema: `{
  "healthScore": number (1-10),
  "grade": string ("A+", "A", "B+", "B", "C+", "C", "D", "F"),
  "priority": string ("Hot", "Warm", "Cool", "Cold"),
  "healthIndicator": string ("Excellent", "Good", "Fair", "At Risk", "Critical"),
  "insights": string[],
  "recommendedActions": string[],
  "riskFactors": string[],
  "opportunitySignals": string[],
  "similarDealsAnalysis": string,
  "investigationSummary": string,
  "breakdown": {
    "stageScore": number,
    "valueScore": number,
    "timelineScore": number,
    "activityScore": number,
    "associationScore": number
  }
}`,
  
  contactSchema: `{
  "engagementScore": number (1-10),
  "relationshipStrength": string ("Champion", "Supporter", "Neutral", "Detractor", "Unknown"),
  "insights": string[],
  "recommendedActions": string[],
  "riskFactors": string[],
  "opportunitySignals": string[],
  "engagementPatterns": string,
  "investigationSummary": string
}`,
  
  companySchema: `{
  "healthScore": number (1-10),
  "customerStatus": string ("Customer", "Prospect", "Former Customer", "Unknown"),
  "insights": string[],
  "recommendedActions": string[],
  "riskFactors": string[],
  "opportunitySignals": string[],
  "expansionPotential": string,
  "investigationSummary": string
}`,
};

// ============================================================================
// Schema
// ============================================================================

const AnalysisTypeSchema = new Schema<IAnalysisType>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  entityType: { type: String, enum: ['deal', 'contact', 'company', 'all'], required: true },
  focusAreas: [{ type: String }],
  prompt: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AgentConfigSchema = new Schema<IAgentConfig>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  systemPrompt: { type: String, required: true },
  outputFormat: { type: String, required: true },
  maxIterations: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
});

const IntelligencePromptConfigSchema = new Schema<IIntelligencePromptConfig>({
  agents: {
    deal: {
      type: AgentConfigSchema,
      default: {
        id: 'deal',
        name: 'Deal Intelligence Agent',
        description: 'Analyzes deals to provide insights, risks, and recommendations',
        systemPrompt: DEFAULT_DEAL_SYSTEM_PROMPT,
        outputFormat: 'json',
        maxIterations: 10,
        isActive: true,
      },
    },
    contact: {
      type: AgentConfigSchema,
      default: {
        id: 'contact',
        name: 'Contact Intelligence Agent',
        description: 'Analyzes contacts to understand engagement and relationship strength',
        systemPrompt: DEFAULT_CONTACT_SYSTEM_PROMPT,
        outputFormat: 'json',
        maxIterations: 10,
        isActive: true,
      },
    },
    company: {
      type: AgentConfigSchema,
      default: {
        id: 'company',
        name: 'Company Intelligence Agent',
        description: 'Analyzes companies to identify opportunities and risks',
        systemPrompt: DEFAULT_COMPANY_SYSTEM_PROMPT,
        outputFormat: 'json',
        maxIterations: 10,
        isActive: true,
      },
    },
  },
  analysisTypes: { type: [AnalysisTypeSchema], default: DEFAULT_ANALYSIS_TYPES },
  researchInstructions: {
    atlasPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.atlasPrompt },
    hubspotPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.hubspotPrompt },
    generalGuidelines: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.generalGuidelines },
  },
  qualityStandards: { type: String, default: DEFAULT_QUALITY_STANDARDS },
  outputSchema: {
    dealSchema: { type: String, default: DEFAULT_OUTPUT_SCHEMA.dealSchema },
    contactSchema: { type: String, default: DEFAULT_OUTPUT_SCHEMA.contactSchema },
    companySchema: { type: String, default: DEFAULT_OUTPUT_SCHEMA.companySchema },
  },
  version: { type: Number, default: 1 },
  lastUpdatedBy: { type: String, default: 'system' },
}, {
  timestamps: true,
});

// ============================================================================
// Model
// ============================================================================

const IntelligencePromptConfig: Model<IIntelligencePromptConfig> = 
  mongoose.models.IntelligencePromptConfig || 
  mongoose.model<IIntelligencePromptConfig>('IntelligencePromptConfig', IntelligencePromptConfigSchema);

export default IntelligencePromptConfig;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current intelligence prompt configuration (creates default if none exists)
 */
export async function getIntelligencePromptConfig(): Promise<IIntelligencePromptConfig> {
  let config = await IntelligencePromptConfig.findOne();
  
  if (!config) {
    config = await IntelligencePromptConfig.create({});
  }
  
  return config;
}

/**
 * Update the intelligence prompt configuration
 */
export async function updateIntelligencePromptConfig(
  updates: Partial<IIntelligencePromptConfig>,
  updatedBy: string = 'system'
): Promise<IIntelligencePromptConfig> {
  const config = await getIntelligencePromptConfig();
  
  // Save to history before updating
  const { saveIntelligenceConfigHistory } = await import('./IntelligencePromptConfigHistory');
  const previousConfig = {
    agents: JSON.parse(JSON.stringify(config.agents)),
    analysisTypes: JSON.parse(JSON.stringify(config.analysisTypes)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    outputSchema: JSON.parse(JSON.stringify(config.outputSchema)),
    version: config.version,
  };
  
  Object.assign(config, updates, {
    lastUpdatedBy: updatedBy,
    version: config.version + 1,
  });
  
  await config.save();
  
  // Save to history
  await saveIntelligenceConfigHistory(
    config,
    previousConfig,
    'update',
    updatedBy,
    `Updated configuration fields: ${Object.keys(updates).join(', ')}`
  );
  
  return config;
}

/**
 * Update a specific agent's configuration
 */
export async function updateAgentConfig(
  agentId: 'deal' | 'contact' | 'company',
  updates: Partial<IAgentConfig>,
  updatedBy: string
): Promise<IIntelligencePromptConfig> {
  const config = await getIntelligencePromptConfig();
  
  const { saveIntelligenceConfigHistory } = await import('./IntelligencePromptConfigHistory');
  const previousConfig = {
    agents: JSON.parse(JSON.stringify(config.agents)),
    analysisTypes: JSON.parse(JSON.stringify(config.analysisTypes)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    outputSchema: JSON.parse(JSON.stringify(config.outputSchema)),
    version: config.version,
  };
  
  config.agents[agentId] = {
    ...config.agents[agentId],
    ...updates,
  };
  
  config.version += 1;
  config.lastUpdatedBy = updatedBy;
  
  await config.save();
  
  await saveIntelligenceConfigHistory(
    config,
    previousConfig,
    'update_agent',
    updatedBy,
    `Updated ${agentId} agent configuration`
  );
  
  return config;
}

/**
 * Add a custom analysis type
 */
export async function addAnalysisType(
  analysisType: Omit<IAnalysisType, 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<IIntelligencePromptConfig> {
  const config = await getIntelligencePromptConfig();
  
  if (config.analysisTypes.some(t => t.id === analysisType.id)) {
    throw new Error(`Analysis type with ID "${analysisType.id}" already exists`);
  }
  
  const { saveIntelligenceConfigHistory } = await import('./IntelligencePromptConfigHistory');
  const previousConfig = {
    agents: JSON.parse(JSON.stringify(config.agents)),
    analysisTypes: JSON.parse(JSON.stringify(config.analysisTypes)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    outputSchema: JSON.parse(JSON.stringify(config.outputSchema)),
    version: config.version,
  };
  
  config.analysisTypes.push({
    ...analysisType,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  config.version += 1;
  config.lastUpdatedBy = createdBy;
  
  await config.save();
  
  await saveIntelligenceConfigHistory(
    config,
    previousConfig,
    'add_analysis_type',
    createdBy,
    `Added analysis type: ${analysisType.name}`
  );
  
  return config;
}

/**
 * Rollback to a specific version
 */
export async function rollbackIntelligenceConfig(
  targetVersion: number,
  rolledBackBy: string
): Promise<IIntelligencePromptConfig> {
  const { getIntelligenceConfigVersion, saveIntelligenceConfigHistory } = await import('./IntelligencePromptConfigHistory');
  
  const historyEntry = await getIntelligenceConfigVersion(targetVersion);
  if (!historyEntry) {
    throw new Error(`Version ${targetVersion} not found in history`);
  }
  
  const config = await getIntelligencePromptConfig();
  
  const previousConfig = {
    agents: JSON.parse(JSON.stringify(config.agents)),
    analysisTypes: JSON.parse(JSON.stringify(config.analysisTypes)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    outputSchema: JSON.parse(JSON.stringify(config.outputSchema)),
    version: config.version,
  };
  
  // Restore from snapshot
  config.agents = historyEntry.configSnapshot.agents;
  config.analysisTypes = historyEntry.configSnapshot.analysisTypes;
  config.researchInstructions = historyEntry.configSnapshot.researchInstructions;
  config.qualityStandards = historyEntry.configSnapshot.qualityStandards;
  config.outputSchema = historyEntry.configSnapshot.outputSchema;
  config.version += 1;
  config.lastUpdatedBy = rolledBackBy;
  
  await config.save();
  
  await saveIntelligenceConfigHistory(
    config,
    previousConfig,
    'rollback',
    rolledBackBy,
    `Rolled back to version ${targetVersion}`
  );
  
  return config;
}


