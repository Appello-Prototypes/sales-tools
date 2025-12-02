import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Intelligence Prompt Config History
 * 
 * Stores version history for intelligence prompt configurations,
 * enabling rollback and audit trail functionality.
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface IConfigChange {
  field: string;
  previousValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'deleted';
}

export interface IIntelligencePromptConfigHistory extends Document {
  version: number;
  configSnapshot: {
    agents: any;
    analysisTypes: any[];
    researchInstructions: any;
    qualityStandards: string;
    outputSchema: any;
  };
  changes: IConfigChange[];
  changeSummary: string;
  action: 'create' | 'update' | 'update_agent' | 'add_analysis_type' | 'delete_analysis_type' | 'rollback';
  actionDetails?: string;
  changedBy: string;
  createdAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const ConfigChangeSchema = new Schema<IConfigChange>({
  field: { type: String, required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  changeType: { type: String, enum: ['added', 'modified', 'deleted'], required: true },
});

const IntelligencePromptConfigHistorySchema = new Schema<IIntelligencePromptConfigHistory>({
  version: { type: Number, required: true, index: true },
  configSnapshot: {
    agents: { type: Schema.Types.Mixed, required: true },
    analysisTypes: [{ type: Schema.Types.Mixed }],
    researchInstructions: { type: Schema.Types.Mixed },
    qualityStandards: { type: String },
    outputSchema: { type: Schema.Types.Mixed },
  },
  changes: [ConfigChangeSchema],
  changeSummary: { type: String, required: true },
  action: {
    type: String,
    enum: ['create', 'update', 'update_agent', 'add_analysis_type', 'delete_analysis_type', 'rollback'],
    required: true,
  },
  actionDetails: { type: String },
  changedBy: { type: String, required: true },
}, {
  timestamps: true,
});

// Index for efficient queries
IntelligencePromptConfigHistorySchema.index({ createdAt: -1 });

// ============================================================================
// Model
// ============================================================================

const IntelligencePromptConfigHistory: Model<IIntelligencePromptConfigHistory> =
  mongoose.models.IntelligencePromptConfigHistory ||
  mongoose.model<IIntelligencePromptConfigHistory>('IntelligencePromptConfigHistory', IntelligencePromptConfigHistorySchema);

export default IntelligencePromptConfigHistory;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect changes between two config objects
 */
function detectChanges(current: any, previous: any, prefix: string = ''): IConfigChange[] {
  const changes: IConfigChange[] = [];
  
  const currentKeys = new Set(Object.keys(current || {}));
  const previousKeys = new Set(Object.keys(previous || {}));
  
  // Check for added and modified fields
  for (const key of currentKeys) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    
    if (!previousKeys.has(key)) {
      changes.push({
        field: fieldPath,
        previousValue: undefined,
        newValue: current[key],
        changeType: 'added',
      });
    } else {
      const currentVal = JSON.stringify(current[key]);
      const previousVal = JSON.stringify(previous[key]);
      
      if (currentVal !== previousVal) {
        changes.push({
          field: fieldPath,
          previousValue: previous[key],
          newValue: current[key],
          changeType: 'modified',
        });
      }
    }
  }
  
  // Check for deleted fields
  for (const key of previousKeys) {
    if (!currentKeys.has(key)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      changes.push({
        field: fieldPath,
        previousValue: previous[key],
        newValue: undefined,
        changeType: 'deleted',
      });
    }
  }
  
  return changes;
}

/**
 * Generate a summary of changes
 */
function generateChangeSummary(changes: IConfigChange[], action: string, actionDetails?: string): string {
  if (actionDetails) {
    return actionDetails;
  }
  
  const added = changes.filter(c => c.changeType === 'added').length;
  const modified = changes.filter(c => c.changeType === 'modified').length;
  const deleted = changes.filter(c => c.changeType === 'deleted').length;
  
  const parts: string[] = [];
  if (added > 0) parts.push(`${added} added`);
  if (modified > 0) parts.push(`${modified} modified`);
  if (deleted > 0) parts.push(`${deleted} deleted`);
  
  if (parts.length === 0) {
    return `Configuration ${action}`;
  }
  
  return `${parts.join(', ')} field${parts.reduce((a, b) => parseInt(a.toString()) + parseInt(b.split(' ')[0]), 0) > 1 ? 's' : ''}`;
}

/**
 * Save a configuration history entry
 */
export async function saveIntelligenceConfigHistory(
  currentConfig: any,
  previousConfig: any,
  action: IIntelligencePromptConfigHistory['action'],
  changedBy: string,
  actionDetails?: string
): Promise<IIntelligencePromptConfigHistory> {
  // Detect changes
  const changes = detectChanges(
    {
      agents: currentConfig.agents,
      analysisTypes: currentConfig.analysisTypes,
      researchInstructions: currentConfig.researchInstructions,
      qualityStandards: currentConfig.qualityStandards,
      outputSchema: currentConfig.outputSchema,
    },
    previousConfig
  );
  
  const history = await IntelligencePromptConfigHistory.create({
    version: currentConfig.version,
    configSnapshot: {
      agents: JSON.parse(JSON.stringify(currentConfig.agents)),
      analysisTypes: JSON.parse(JSON.stringify(currentConfig.analysisTypes)),
      researchInstructions: JSON.parse(JSON.stringify(currentConfig.researchInstructions)),
      qualityStandards: currentConfig.qualityStandards,
      outputSchema: JSON.parse(JSON.stringify(currentConfig.outputSchema)),
    },
    changes,
    changeSummary: generateChangeSummary(changes, action, actionDetails),
    action,
    actionDetails,
    changedBy,
  });
  
  return history;
}

/**
 * Get history entries (paginated)
 */
export async function getIntelligenceConfigHistory(
  limit: number = 50
): Promise<{ version: number; changeSummary: string; action: string; actionDetails?: string; changedBy: string; createdAt: Date; changeCount: number }[]> {
  const entries = await IntelligencePromptConfigHistory.find()
    .sort({ version: -1 })
    .limit(limit)
    .lean();
  
  return entries.map(e => ({
    version: e.version,
    changeSummary: e.changeSummary,
    action: e.action,
    actionDetails: e.actionDetails,
    changedBy: e.changedBy,
    createdAt: e.createdAt,
    changeCount: e.changes?.length || 0,
  }));
}

/**
 * Get a specific version's details
 */
export async function getIntelligenceConfigVersion(
  version: number
): Promise<IIntelligencePromptConfigHistory | null> {
  return IntelligencePromptConfigHistory.findOne({ version }).lean();
}


