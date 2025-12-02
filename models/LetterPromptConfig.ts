import mongoose, { Schema, Document, Model } from 'mongoose';
import { saveConfigHistory } from './LetterPromptConfigHistory';

/**
 * Letter Prompt Configuration
 * 
 * Stores configurable prompts for the Letter Intelligence Agent:
 * - System prompt (the base AI instructions)
 * - Letter type configurations (cold_outreach, follow_up, etc.)
 * - Tone configurations (professional, friendly, etc.)
 * - Custom letter types created by users
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface ILetterType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon?: string;
  isCustom: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IToneConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isActive: boolean;
}

export interface ILetterPromptConfig extends Document {
  // System prompt - the main AI instructions
  systemPrompt: string;
  
  // Letter types (built-in + custom)
  letterTypes: ILetterType[];
  
  // Tone configurations
  tones: IToneConfig[];
  
  // Default settings
  defaults: {
    letterType: string;
    tone: string;
    maxWordCount: number;
    includeSubject: boolean;
  };
  
  // Research instructions
  researchInstructions: {
    atlasPrompt: string;
    hubspotPrompt: string;
    firecrawlPrompt: string;
    customerVsProspectPrompt: string;
  };
  
  // Quality standards
  qualityStandards: string;
  
  // Metadata
  version: number;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_SYSTEM_PROMPT = `You are an expert B2B sales copywriter and research analyst. Your job is to create highly personalized, compelling outreach letters that resonate with the recipient.

## Your Process

1. **Deep Research First** - Before writing anything, thoroughly investigate:
   - The company's business, industry, and challenges
   - Similar customers you've helped (from ATLAS)
   - The contact's role and likely priorities
   - Recent company news or changes
   - Whether they are an EXISTING CUSTOMER or a NEW PROSPECT

2. **Find Connection Points** - Look for:
   - Industry-specific pain points
   - Similar companies that became customers
   - Relevant case studies or success stories
   - Timing signals (growth, challenges, changes)

3. **Craft the Letter** - Write a letter that:
   - Opens with something specific and relevant (NOT generic)
   - Shows you understand their business
   - References similar customers or relevant insights
   - Has a clear, low-friction call to action
   - Feels personal, not templated

## Customer Status Awareness
- Check HubSpot to determine if this company is an EXISTING CUSTOMER or a NEW PROSPECT
- For existing customers: Reference the relationship, past successes, and focus on expansion/upsell
- For prospects: Focus on establishing credibility and demonstrating value

## Available Tools

### ATLAS Knowledge Base (query_atlas)
Search for similar customers, success stories, pain points, and best practices.

### HubSpot CRM (hubspot_*)
Access company details, contact information, deal history, and customer status.

### Firecrawl Web Research (firecrawl_*)
Research the company website, find recent news, and gather real-time information.

## Quality Standards
- NO generic openings ("I hope this email finds you well")
- NO vague value propositions
- MUST reference specific research findings
- MUST feel like it was written specifically for this person
- Keep it concise (follow word count guidelines for letter type)`;

export const DEFAULT_LETTER_TYPES: ILetterType[] = [
  {
    id: 'cold_outreach',
    name: 'Cold Outreach',
    description: 'First contact with a new prospect who doesn\'t know you',
    prompt: `## Cold Outreach Letter Guidelines
- This is first contact - they don't know you yet
- Lead with relevance and value, not your product
- Reference a specific trigger, insight, or research finding
- Ask for a conversation, not a sale
- Keep under 150 words
- Subject line should be intriguing but not clickbait`,
    icon: 'Mail',
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    description: 'Continue a previous conversation or touchpoint',
    prompt: `## Follow-Up Letter Guidelines

### ⚠️ CRITICAL PREREQUISITE - Verify Prior Contact First:
Before writing ANY follow-up letter, you MUST:
1. Search HubSpot for documented interactions (calls, meetings, emails, notes) with this contact/company
2. If NO prior interactions are found in HubSpot, you MUST write a COLD OUTREACH letter instead
3. If prior interactions ARE found, document them in your research summary with dates and details

### Requirements for Verified Follow-Ups:
- Reference the SPECIFIC previous interaction with date/context from HubSpot data
- Include in research summary: "Verified prior interaction: [date] - [type] - [summary]"
- Add new value or insight they didn't have before
- Be specific about proposed next steps
- Create gentle urgency without being pushy
- Keep under 100 words
- Subject line should reference the actual previous contact

### If No Prior Interaction Found:
- DO NOT fabricate or assume any previous conversation
- Switch to cold outreach approach automatically
- Note in research summary: "No prior interactions found - treating as new prospect"`,
    icon: 'RefreshCw',
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    description: 'Reconnect with dormant contacts or lost opportunities',
    prompt: `## Re-engagement Letter Guidelines
- Acknowledge the gap in communication naturally
- Lead with something new (product update, case study, insight)
- Don't be apologetic - be valuable
- Offer a fresh reason to reconnect
- Keep under 150 words
- Subject line should spark curiosity`,
    icon: 'Zap',
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'referral',
    name: 'Referral',
    description: 'Leverage a mutual connection for introduction',
    prompt: `## Referral Letter Guidelines
- Lead with the referrer's name prominently
- Explain why they thought of this connection
- Be specific about the mutual benefit
- Make it easy to say yes to a conversation
- Keep under 125 words
- Subject line should include referrer name`,
    icon: 'Users',
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'existing_customer',
    name: 'Existing Customer',
    description: 'Reach out to current customers for expansion or check-in',
    prompt: `## Existing Customer Letter Guidelines
- Reference the existing relationship and specific successes
- Focus on expansion opportunities or new solutions
- Be consultative, not sales-y
- Show appreciation for their business
- Suggest a strategic discussion, not a sales pitch
- Keep under 150 words
- Subject line should feel like a valued partner check-in`,
    icon: 'Heart',
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const DEFAULT_TONES: IToneConfig[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal and business-appropriate',
    prompt: 'Write in a professional, business-appropriate tone. Use formal language while remaining approachable. Avoid slang or overly casual expressions.',
    isActive: true,
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable',
    prompt: 'Write in a warm, friendly tone that feels like a genuine human connection. Be conversational while still being respectful. Show personality.',
    isActive: true,
  },
  {
    id: 'consultative',
    name: 'Consultative',
    description: 'Expert advisor positioning',
    prompt: 'Write as a trusted advisor sharing insights. Position yourself as a knowledgeable expert who genuinely wants to help. Ask thoughtful questions.',
    isActive: true,
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'Time-sensitive with clear deadline',
    prompt: 'Write with appropriate urgency. Create a sense of timeliness without being pushy. Reference specific deadlines or time-sensitive opportunities.',
    isActive: true,
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed and informal',
    prompt: 'Write in a casual, relaxed tone. Feel free to use contractions and informal language. Keep it light while still being professional.',
    isActive: true,
  },
];

export const DEFAULT_RESEARCH_INSTRUCTIONS = {
  atlasPrompt: `When searching ATLAS, look for:
- Companies in the same industry that are existing customers
- Success stories and case studies relevant to this prospect
- Common pain points for companies of this size/industry
- Effective outreach strategies that have worked before`,
  
  hubspotPrompt: `When querying HubSpot, determine:
- Is this company an EXISTING CUSTOMER or a PROSPECT?
- What is their deal stage and history?
- Who are the key contacts and their roles?
- What products/services do they currently use (if customer)?

### ⚠️ CRITICAL - Prior Interaction Verification:
You MUST search for and document ALL prior interactions including:
- Meeting notes and call logs
- Email correspondence
- Notes from previous conversations
- Any engagement history with dates

If you find prior interactions, document them with:
- Date of interaction
- Type (call, meeting, email, note)
- Summary of what was discussed
- Who was involved

If NO prior interactions are found, explicitly state: "No documented prior interactions found in HubSpot"`,
  
  firecrawlPrompt: `When researching online, find:
- Recent company news and announcements
- Company mission, values, and culture
- Key leadership and decision makers
- Products, services, and competitive positioning
- Industry challenges and trends`,
  
  customerVsProspectPrompt: `CRITICAL: Before writing, determine if this is an existing customer or prospect.

For EXISTING CUSTOMERS:
- Reference the existing relationship
- Focus on expansion, new solutions, or strategic value
- Be a trusted partner, not a salesperson
- Mention specific successes or shared history

For NEW PROSPECTS:
- Establish credibility through research and similar customers
- Focus on demonstrating value and understanding their challenges
- Build trust through relevant insights
- Make a compelling case for a conversation

### 100% ACCURACY RULE:
- NEVER fabricate or assume prior conversations that aren't documented in HubSpot
- If the letter type is "Follow Up" but NO prior interactions exist, you MUST:
  1. Note "No prior interactions found" in research summary
  2. Write the letter as COLD OUTREACH instead
  3. Do NOT reference any imagined previous conversations`,
};

export const DEFAULT_QUALITY_STANDARDS = `## Quality Standards for Every Letter

### Must Have:
- Specific reference to research findings (company news, similar customers, industry insights)
- Personalization that couldn't apply to any other company
- Clear, single call to action
- Appropriate length for letter type

### Must Avoid:
- Generic openings ("I hope this finds you well", "I wanted to reach out")
- Vague value propositions ("help you succeed", "drive results")
- Multiple CTAs or confusing next steps
- Overly promotional language
- Anything that sounds templated

### CRITICAL - 100% Accuracy Requirement:
- NEVER fabricate, assume, or invent prior conversations, meetings, or interactions that are not verified in CRM data
- NEVER claim "we spoke" or "last time we talked" unless you have DOCUMENTED PROOF from HubSpot (notes, calls, meetings, emails)
- If you cannot find verified prior contact in HubSpot, treat as COLD OUTREACH regardless of letter type selected
- Every factual claim in the letter MUST be traceable to a specific research finding
- The Research Summary must contain evidence for every claim made in the letter
- If selecting "Follow Up" type but no prior interactions are found, SWITCH to cold outreach approach`;

// ============================================================================
// Schema
// ============================================================================

const LetterTypeSchema = new Schema<ILetterType>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  prompt: { type: String, required: true },
  icon: { type: String, default: 'FileText' },
  isCustom: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ToneConfigSchema = new Schema<IToneConfig>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  prompt: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const LetterPromptConfigSchema = new Schema<ILetterPromptConfig>({
  systemPrompt: { type: String, default: DEFAULT_SYSTEM_PROMPT },
  letterTypes: { type: [LetterTypeSchema], default: DEFAULT_LETTER_TYPES },
  tones: { type: [ToneConfigSchema], default: DEFAULT_TONES },
  defaults: {
    letterType: { type: String, default: 'cold_outreach' },
    tone: { type: String, default: 'professional' },
    maxWordCount: { type: Number, default: 150 },
    includeSubject: { type: Boolean, default: true },
  },
  researchInstructions: {
    atlasPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.atlasPrompt },
    hubspotPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.hubspotPrompt },
    firecrawlPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.firecrawlPrompt },
    customerVsProspectPrompt: { type: String, default: DEFAULT_RESEARCH_INSTRUCTIONS.customerVsProspectPrompt },
  },
  qualityStandards: { type: String, default: DEFAULT_QUALITY_STANDARDS },
  version: { type: Number, default: 1 },
  lastUpdatedBy: { type: String, default: 'system' },
}, {
  timestamps: true,
});

// ============================================================================
// Model
// ============================================================================

const LetterPromptConfig: Model<ILetterPromptConfig> = 
  mongoose.models.LetterPromptConfig || 
  mongoose.model<ILetterPromptConfig>('LetterPromptConfig', LetterPromptConfigSchema);

export default LetterPromptConfig;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current prompt configuration (creates default if none exists)
 */
export async function getPromptConfig(): Promise<ILetterPromptConfig> {
  let config = await LetterPromptConfig.findOne();
  
  if (!config) {
    config = await LetterPromptConfig.create({});
  }
  
  return config;
}

/**
 * Update the prompt configuration
 */
export async function updatePromptConfig(
  updates: Partial<ILetterPromptConfig>,
  updatedBy: string = 'system'
): Promise<ILetterPromptConfig> {
  const config = await getPromptConfig();
  
  // Save snapshot of previous config for history
  const previousConfig = {
    systemPrompt: config.systemPrompt,
    letterTypes: JSON.parse(JSON.stringify(config.letterTypes)),
    tones: JSON.parse(JSON.stringify(config.tones)),
    defaults: JSON.parse(JSON.stringify(config.defaults)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    version: config.version,
  };
  
  Object.assign(config, updates, {
    lastUpdatedBy: updatedBy,
    version: config.version + 1,
  });
  
  await config.save();
  
  // Save to history
  await saveConfigHistory(
    config,
    previousConfig,
    'update',
    updatedBy,
    `Updated configuration fields: ${Object.keys(updates).join(', ')}`
  );
  
  return config;
}

/**
 * Add a custom letter type
 */
export async function addCustomLetterType(
  letterType: Omit<ILetterType, 'isCustom' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<ILetterPromptConfig> {
  const config = await getPromptConfig();
  
  // Check for duplicate ID
  if (config.letterTypes.some(t => t.id === letterType.id)) {
    throw new Error(`Letter type with ID "${letterType.id}" already exists`);
  }
  
  // Save snapshot of previous config for history
  const previousConfig = {
    systemPrompt: config.systemPrompt,
    letterTypes: JSON.parse(JSON.stringify(config.letterTypes)),
    tones: JSON.parse(JSON.stringify(config.tones)),
    defaults: JSON.parse(JSON.stringify(config.defaults)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    version: config.version,
  };
  
  config.letterTypes.push({
    ...letterType,
    isCustom: true,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  config.version += 1;
  config.lastUpdatedBy = createdBy;
  
  await config.save();
  
  // Save to history
  await saveConfigHistory(
    config,
    previousConfig,
    'add_letter_type',
    createdBy,
    `Added custom letter type: ${letterType.name}`
  );
  
  return config;
}

/**
 * Update a letter type
 */
export async function updateLetterType(
  typeId: string,
  updates: Partial<ILetterType>,
  updatedBy: string
): Promise<ILetterPromptConfig> {
  const config = await getPromptConfig();
  
  const typeIndex = config.letterTypes.findIndex(t => t.id === typeId);
  if (typeIndex === -1) {
    throw new Error(`Letter type "${typeId}" not found`);
  }
  
  // Save snapshot of previous config for history
  const previousConfig = {
    systemPrompt: config.systemPrompt,
    letterTypes: JSON.parse(JSON.stringify(config.letterTypes)),
    tones: JSON.parse(JSON.stringify(config.tones)),
    defaults: JSON.parse(JSON.stringify(config.defaults)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    version: config.version,
  };
  
  const oldTypeName = config.letterTypes[typeIndex].name;
  
  config.letterTypes[typeIndex] = {
    ...config.letterTypes[typeIndex],
    ...updates,
    updatedAt: new Date(),
  };
  
  config.version += 1;
  config.lastUpdatedBy = updatedBy;
  
  await config.save();
  
  // Save to history
  await saveConfigHistory(
    config,
    previousConfig,
    'update_letter_type',
    updatedBy,
    `Updated letter type: ${oldTypeName}`
  );
  
  return config;
}

/**
 * Delete a custom letter type
 */
export async function deleteLetterType(
  typeId: string,
  deletedBy: string
): Promise<ILetterPromptConfig> {
  const config = await getPromptConfig();
  
  const typeIndex = config.letterTypes.findIndex(t => t.id === typeId);
  if (typeIndex === -1) {
    throw new Error(`Letter type "${typeId}" not found`);
  }
  
  if (!config.letterTypes[typeIndex].isCustom) {
    throw new Error('Cannot delete built-in letter types');
  }
  
  // Save snapshot of previous config for history
  const previousConfig = {
    systemPrompt: config.systemPrompt,
    letterTypes: JSON.parse(JSON.stringify(config.letterTypes)),
    tones: JSON.parse(JSON.stringify(config.tones)),
    defaults: JSON.parse(JSON.stringify(config.defaults)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    version: config.version,
  };
  
  const deletedTypeName = config.letterTypes[typeIndex].name;
  
  config.letterTypes.splice(typeIndex, 1);
  config.version += 1;
  config.lastUpdatedBy = deletedBy;
  
  await config.save();
  
  // Save to history
  await saveConfigHistory(
    config,
    previousConfig,
    'delete_letter_type',
    deletedBy,
    `Deleted letter type: ${deletedTypeName}`
  );
  
  return config;
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  targetVersion: number,
  rolledBackBy: string
): Promise<ILetterPromptConfig> {
  const { getConfigVersion } = await import('./LetterPromptConfigHistory');
  
  const historyEntry = await getConfigVersion(targetVersion);
  if (!historyEntry) {
    throw new Error(`Version ${targetVersion} not found in history`);
  }
  
  const config = await getPromptConfig();
  
  // Save snapshot of current config for history before rollback
  const previousConfig = {
    systemPrompt: config.systemPrompt,
    letterTypes: JSON.parse(JSON.stringify(config.letterTypes)),
    tones: JSON.parse(JSON.stringify(config.tones)),
    defaults: JSON.parse(JSON.stringify(config.defaults)),
    researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions)),
    qualityStandards: config.qualityStandards,
    version: config.version,
  };
  
  // Restore from snapshot
  config.systemPrompt = historyEntry.configSnapshot.systemPrompt;
  config.letterTypes = historyEntry.configSnapshot.letterTypes;
  config.tones = historyEntry.configSnapshot.tones;
  config.defaults = historyEntry.configSnapshot.defaults;
  config.researchInstructions = historyEntry.configSnapshot.researchInstructions;
  config.qualityStandards = historyEntry.configSnapshot.qualityStandards;
  config.version += 1;
  config.lastUpdatedBy = rolledBackBy;
  
  await config.save();
  
  // Save to history
  await saveConfigHistory(
    config,
    previousConfig,
    'rollback',
    rolledBackBy,
    `Rolled back to version ${targetVersion}`
  );
  
  return config;
}

