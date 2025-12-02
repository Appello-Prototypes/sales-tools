import mongoose, { Schema, Document } from 'mongoose';

// Interface for stakeholder profile
export interface IStakeholder {
  name: string;
  title?: string;
  email?: string;
  role: 'Economic Buyer' | 'Technical Evaluator' | 'End User' | 'Champion' | 'Blocker' | 'Influencer' | 'Decision Maker' | string;
  influence: 'High' | 'Medium' | 'Low';
  interests?: string[];
  painPoints?: string[];
  engagement: 'High' | 'Medium' | 'Low';
  sentiment: 'Positive' | 'Neutral' | 'Concerned' | 'Unknown';
  keyNotes?: string;
}

// Interface for timeline event
export interface ITimelineEvent {
  date: string;
  event: string;
  type: 'deal_created' | 'stage_change' | 'meeting' | 'call' | 'email' | 'note' | 'milestone' | string;
  significance: 'High' | 'Medium' | 'Low';
}

// Interface for deal stage analysis
export interface IDealStageAnalysis {
  hubspotStage: string;
  inferredStage: string;
  stageMatch: boolean;
  stageConfidence: 'High' | 'Medium' | 'Low';
  stageNotes?: string;
}

// Interface for a single analysis snapshot (used in history)
export interface IAnalysisSnapshot {
  analysisId: string; // Unique ID for this analysis run
  result?: {
    intelligence?: any;
    engagementScore?: number;
    healthScore?: number;
    dealScore?: number;
    insights?: string[];
    recommendedActions?: string[];
    riskFactors?: string[];
    opportunitySignals?: string[];
    stakeholders?: IStakeholder[];
    timeline?: ITimelineEvent[];
    dealStageAnalysis?: IDealStageAnalysis;
    executiveSummary?: string;
    [key: string]: any;
  };
  stats?: {
    iterations: number;
    toolCalls: number;
    duration?: number;
  };
  completedAt: Date;
  userId?: string;
  // Change tracking
  changes?: {
    scoreChange?: number;
    newInsights?: string[];
    resolvedRisks?: string[];
    newRisks?: string[];
    summary?: string;
  };
}

export interface IIntelligenceJob extends Document {
  // Entity identification
  entityType: 'contact' | 'company' | 'deal';
  entityId: string; // HubSpot ID
  entityName: string; // Display name for the entity
  
  // Job status
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  
  // Results (current/latest)
  result?: {
    intelligence?: any; // The actual intelligence output (insights, scores, recommendations)
    engagementScore?: number; // For contacts
    healthScore?: number; // For companies
    dealScore?: number; // For deals
    insights?: string[];
    recommendedActions?: string[];
    riskFactors?: string[];
    opportunitySignals?: string[];
    // New enhanced fields for deals
    stakeholders?: IStakeholder[]; // Stakeholder profiles for deal
    timeline?: ITimelineEvent[]; // Deal timeline events
    dealStageAnalysis?: IDealStageAnalysis; // Stage validation
    executiveSummary?: string; // Brief executive summary
    [key: string]: any;
  };
  
  // Activity logs (full audit trail)
  logs: Array<{
    step: string;
    message: string;
    status: 'loading' | 'complete' | 'error' | 'warning' | 'info';
    data?: any;
    timestamp: Date;
  }>;
  
  // Error information
  error?: string;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  
  // Statistics
  stats?: {
    iterations: number;
    toolCalls: number;
    duration?: number; // milliseconds
  };
  
  // User who initiated the job
  userId?: string;
  
  // === NEW: History Tracking ===
  // Version number (increments with each re-run for the same entity)
  version: number;
  
  // Reference to previous job for this entity (for tracking re-runs)
  previousJobId?: mongoose.Types.ObjectId;
  
  // Analysis ID for this specific run (used for comparison)
  analysisId: string;
  
  // History of all previous analyses for quick access
  history: IAnalysisSnapshot[];
  
  // Change detection from previous run
  changeDetection?: {
    hasChanges: boolean;
    scoreChange?: number;
    previousScore?: number;
    currentScore?: number;
    changedFields: string[];
    newInsights?: string[];
    resolvedRisks?: string[];
    newRisks?: string[];
    newOpportunities?: string[];
    resolvedOpportunities?: string[];
    summary?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSnapshotSchema = new Schema({
  analysisId: { type: String, required: true },
  result: { type: Schema.Types.Mixed },
  stats: {
    iterations: Number,
    toolCalls: Number,
    duration: Number,
  },
  completedAt: { type: Date, required: true },
  userId: String,
  changes: {
    scoreChange: Number,
    newInsights: [String],
    resolvedRisks: [String],
    newRisks: [String],
    summary: String,
  },
}, { _id: false });

const IntelligenceJobSchema = new Schema<IIntelligenceJob>(
  {
    entityType: {
      type: String,
      enum: ['contact', 'company', 'deal'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'complete', 'error', 'cancelled'],
      default: 'pending',
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
      default: {},
    },
    logs: {
      type: [
        {
          step: String,
          message: String,
          status: {
            type: String,
            enum: ['loading', 'complete', 'error', 'warning', 'info'],
          },
          data: Schema.Types.Mixed,
          timestamp: Date,
        },
      ],
      default: [],
    },
    error: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      index: true,
    },
    stats: {
      type: {
        iterations: Number,
        toolCalls: Number,
        duration: Number,
      },
    },
    userId: {
      type: String,
      index: true,
    },
    // History tracking fields
    version: {
      type: Number,
      default: 1,
    },
    previousJobId: {
      type: Schema.Types.ObjectId,
      ref: 'IntelligenceJob',
      index: true,
    },
    analysisId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    history: {
      type: [AnalysisSnapshotSchema],
      default: [],
    },
    changeDetection: {
      hasChanges: Boolean,
      scoreChange: Number,
      previousScore: Number,
      currentScore: Number,
      changedFields: [String],
      newInsights: [String],
      resolvedRisks: [String],
      newRisks: [String],
      newOpportunities: [String],
      resolvedOpportunities: [String],
      summary: String,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
IntelligenceJobSchema.index({ startedAt: -1 }); // Default sort (most common query)
IntelligenceJobSchema.index({ entityType: 1, entityId: 1 }); // Find all jobs for an entity
IntelligenceJobSchema.index({ status: 1, startedAt: -1 }); // Find running/pending jobs
IntelligenceJobSchema.index({ entityType: 1, status: 1, startedAt: -1 }); // Filter by type and status
IntelligenceJobSchema.index({ completedAt: -1 }); // Sort by completion time
IntelligenceJobSchema.index({ userId: 1, startedAt: -1 }); // User's jobs
IntelligenceJobSchema.index({ entityType: 1, entityId: 1, completedAt: -1 }); // Entity history
IntelligenceJobSchema.index({ entityType: 1, entityId: 1, version: -1 }); // Latest version for entity

export default mongoose.models.IntelligenceJob || mongoose.model<IIntelligenceJob>('IntelligenceJob', IntelligenceJobSchema);
