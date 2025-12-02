import mongoose, { Schema, Document } from 'mongoose';

// Agent progress log entry
export interface AgentProgressLog {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'error' | 'complete';
  timestamp: Date;
  step?: string;
  message?: string;
  status?: 'loading' | 'complete' | 'error' | 'warning' | 'info';
  data?: {
    tool?: string;
    input?: any;
    result?: any;
    duration?: string;
    [key: string]: any;
  };
}

// Research summary from agent
export interface ResearchSummary {
  companyInsights?: string[];
  industryContext?: string[];
  similarCustomers?: string[];
  painPoints?: string[];
  opportunities?: string[];
  customerStatus?: 'existing_customer' | 'prospect' | 'unknown';
  priorInteractions?: {
    found: boolean;
    interactions: Array<{
      date: string;
      type: 'call' | 'meeting' | 'email' | 'note' | 'other';
      summary: string;
      participants?: string[];
    }>;
    summary: string;
  };
}

// Letter draft/revision
export interface LetterDraft {
  version: number;
  generatedText: string;
  subject?: string;
  createdAt: Date;
  createdBy: string;
  editedBy?: string;
  editedAt?: Date;
  notes?: string;
}

export interface IGeneratedLetter extends Document {
  companyId?: string;
  contactId?: string;
  companyName: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyLocation?: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientEmail?: string;
  letterType: string; // Reference to LetterType name
  tone?: string;
  customInstructions?: string;
  
  // Current letter content
  generatedText: string;
  subject?: string;
  
  // Agent session data
  agentSession?: {
    progressLogs: AgentProgressLog[];
    researchSummary: ResearchSummary;
    personalizationPoints?: string[];
    suggestedFollowUp?: string;
    confidence?: number;
    stats: {
      iterations: number;
      toolCalls: number;
    };
    promptConfig?: {
      letterType: string;
      tone: string;
      version: number;
    };
  };
  
  // Historical drafts/revisions
  drafts?: LetterDraft[];
  currentDraftVersion?: number;
  
  // Legacy fields (kept for backward compatibility)
  originalPrompt: string;
  feedback?: string;
  aiModel: string;
  status: 'draft' | 'approved' | 'sent' | 'archived';
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const AgentProgressLogSchema = new Schema<AgentProgressLog>({
  type: { type: String, required: true },
  timestamp: { type: Date, required: true },
  step: { type: String },
  message: { type: String },
  status: { type: String },
  data: { type: Schema.Types.Mixed },
}, { _id: false });

const ResearchSummarySchema = new Schema<ResearchSummary>({
  companyInsights: { type: [String] },
  industryContext: { type: [String] },
  similarCustomers: { type: [String] },
  painPoints: { type: [String] },
  opportunities: { type: [String] },
  customerStatus: { type: String },
  priorInteractions: {
    found: { type: Boolean },
    interactions: [{
      date: { type: String },
      type: { type: String },
      summary: { type: String },
      participants: { type: [String] },
    }],
    summary: { type: String },
  },
}, { _id: false });

const LetterDraftSchema = new Schema<LetterDraft>({
  version: { type: Number, required: true },
  generatedText: { type: String, required: true },
  subject: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: String, required: true },
  editedBy: { type: String },
  editedAt: { type: Date },
  notes: { type: String },
}, { _id: false });

const GeneratedLetterSchema = new Schema<IGeneratedLetter>(
  {
    companyId: { type: String, index: true },
    contactId: { type: String, index: true },
    companyName: { type: String, required: true },
    companyDomain: { type: String },
    companyIndustry: { type: String },
    companyLocation: { type: String },
    recipientName: { type: String },
    recipientTitle: { type: String },
    recipientEmail: { type: String },
    letterType: { type: String, required: true, default: 'Cold Call', index: true },
    tone: { type: String },
    customInstructions: { type: String },
    
    // Current letter content
    generatedText: { type: String, required: true },
    subject: { type: String },
    
    // Agent session data
    agentSession: {
      progressLogs: { type: [AgentProgressLogSchema], default: [] },
      researchSummary: { type: ResearchSummarySchema },
      personalizationPoints: { type: [String] },
      suggestedFollowUp: { type: String },
      confidence: { type: Number },
      stats: {
        iterations: { type: Number, default: 0 },
        toolCalls: { type: Number, default: 0 },
      },
      promptConfig: {
        letterType: { type: String },
        tone: { type: String },
        version: { type: Number },
      },
    },
    
    // Historical drafts/revisions
    drafts: { type: [LetterDraftSchema], default: [] },
    currentDraftVersion: { type: Number, default: 1 },
    
    // Legacy fields (kept for backward compatibility)
    originalPrompt: { type: String, required: true },
    feedback: { type: String },
    aiModel: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'approved', 'sent', 'archived'],
      default: 'draft',
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

GeneratedLetterSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.GeneratedLetter || mongoose.model<IGeneratedLetter>('GeneratedLetter', GeneratedLetterSchema);



