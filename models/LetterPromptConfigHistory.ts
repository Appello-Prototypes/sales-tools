import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Letter Prompt Configuration History
 * 
 * Stores version history of prompt configurations with:
 * - Full snapshot of the configuration at each version
 * - Diff/changes from previous version
 * - Metadata about who made the change and when
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

export interface ILetterPromptConfigHistory extends Document {
  // Version number (matches the config version at time of save)
  version: number;
  
  // Full config snapshot at this version
  configSnapshot: {
    systemPrompt: string;
    letterTypes: any[];
    tones: any[];
    defaults: any;
    researchInstructions: any;
    qualityStandards: string;
  };
  
  // Summary of changes from previous version
  changes: IConfigChange[];
  
  // Human-readable summary of what changed
  changeSummary: string;
  
  // Action that triggered this version
  action: 'create' | 'update' | 'add_letter_type' | 'update_letter_type' | 'delete_letter_type' | 'rollback';
  
  // Additional action details
  actionDetails?: string;
  
  // Who made the change
  changedBy: string;
  
  // When the change was made
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
}, { _id: false });

const LetterPromptConfigHistorySchema = new Schema<ILetterPromptConfigHistory>({
  version: { type: Number, required: true, index: true },
  configSnapshot: {
    systemPrompt: { type: String },
    letterTypes: { type: [Schema.Types.Mixed] },
    tones: { type: [Schema.Types.Mixed] },
    defaults: { type: Schema.Types.Mixed },
    researchInstructions: { type: Schema.Types.Mixed },
    qualityStandards: { type: String },
  },
  changes: { type: [ConfigChangeSchema], default: [] },
  changeSummary: { type: String, default: '' },
  action: { 
    type: String, 
    enum: ['create', 'update', 'add_letter_type', 'update_letter_type', 'delete_letter_type', 'rollback'],
    required: true 
  },
  actionDetails: { type: String },
  changedBy: { type: String, required: true },
}, {
  timestamps: true,
});

// Index for efficient queries
LetterPromptConfigHistorySchema.index({ createdAt: -1 });

// ============================================================================
// Model
// ============================================================================

const LetterPromptConfigHistory: Model<ILetterPromptConfigHistory> = 
  mongoose.models.LetterPromptConfigHistory || 
  mongoose.model<ILetterPromptConfigHistory>('LetterPromptConfigHistory', LetterPromptConfigHistorySchema);

export default LetterPromptConfigHistory;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the diff between two config objects
 */
export function calculateConfigDiff(
  oldConfig: any,
  newConfig: any,
  prefix: string = ''
): IConfigChange[] {
  const changes: IConfigChange[] = [];
  
  // Compare simple fields
  const simpleFields = ['systemPrompt', 'qualityStandards'];
  for (const field of simpleFields) {
    if (oldConfig[field] !== newConfig[field]) {
      changes.push({
        field: prefix + field,
        previousValue: truncateForDisplay(oldConfig[field]),
        newValue: truncateForDisplay(newConfig[field]),
        changeType: 'modified',
      });
    }
  }
  
  // Compare nested objects
  if (JSON.stringify(oldConfig.defaults) !== JSON.stringify(newConfig.defaults)) {
    changes.push({
      field: prefix + 'defaults',
      previousValue: oldConfig.defaults,
      newValue: newConfig.defaults,
      changeType: 'modified',
    });
  }
  
  if (JSON.stringify(oldConfig.researchInstructions) !== JSON.stringify(newConfig.researchInstructions)) {
    // Find specific research instruction changes
    const researchFields = ['atlasPrompt', 'hubspotPrompt', 'firecrawlPrompt', 'customerVsProspectPrompt'];
    for (const field of researchFields) {
      if (oldConfig.researchInstructions?.[field] !== newConfig.researchInstructions?.[field]) {
        changes.push({
          field: `researchInstructions.${field}`,
          previousValue: truncateForDisplay(oldConfig.researchInstructions?.[field]),
          newValue: truncateForDisplay(newConfig.researchInstructions?.[field]),
          changeType: 'modified',
        });
      }
    }
  }
  
  // Compare letter types
  const oldTypes = oldConfig.letterTypes || [];
  const newTypes = newConfig.letterTypes || [];
  
  // Find added types
  for (const newType of newTypes) {
    if (!oldTypes.find((t: any) => t.id === newType.id)) {
      changes.push({
        field: `letterTypes.${newType.id}`,
        previousValue: null,
        newValue: { name: newType.name, description: newType.description },
        changeType: 'added',
      });
    }
  }
  
  // Find deleted types
  for (const oldType of oldTypes) {
    if (!newTypes.find((t: any) => t.id === oldType.id)) {
      changes.push({
        field: `letterTypes.${oldType.id}`,
        previousValue: { name: oldType.name, description: oldType.description },
        newValue: null,
        changeType: 'deleted',
      });
    }
  }
  
  // Find modified types
  for (const newType of newTypes) {
    const oldType = oldTypes.find((t: any) => t.id === newType.id);
    if (oldType) {
      const typeChanges: string[] = [];
      if (oldType.prompt !== newType.prompt) typeChanges.push('prompt');
      if (oldType.name !== newType.name) typeChanges.push('name');
      if (oldType.description !== newType.description) typeChanges.push('description');
      if (oldType.isActive !== newType.isActive) typeChanges.push('isActive');
      
      if (typeChanges.length > 0) {
        changes.push({
          field: `letterTypes.${newType.id}`,
          previousValue: { modified: typeChanges, oldValues: { prompt: truncateForDisplay(oldType.prompt) } },
          newValue: { modified: typeChanges, newValues: { prompt: truncateForDisplay(newType.prompt) } },
          changeType: 'modified',
        });
      }
    }
  }
  
  // Compare tones
  const oldTones = oldConfig.tones || [];
  const newTones = newConfig.tones || [];
  
  for (const newTone of newTones) {
    const oldTone = oldTones.find((t: any) => t.id === newTone.id);
    if (oldTone && oldTone.prompt !== newTone.prompt) {
      changes.push({
        field: `tones.${newTone.id}`,
        previousValue: truncateForDisplay(oldTone.prompt),
        newValue: truncateForDisplay(newTone.prompt),
        changeType: 'modified',
      });
    }
  }
  
  return changes;
}

/**
 * Generate a human-readable summary of changes
 */
export function generateChangeSummary(changes: IConfigChange[], action: string, actionDetails?: string): string {
  if (changes.length === 0) {
    return actionDetails || 'No significant changes';
  }
  
  const summaryParts: string[] = [];
  
  // Group changes by type
  const added = changes.filter(c => c.changeType === 'added');
  const modified = changes.filter(c => c.changeType === 'modified');
  const deleted = changes.filter(c => c.changeType === 'deleted');
  
  if (added.length > 0) {
    const addedItems = added.map(c => c.field.split('.').pop()).join(', ');
    summaryParts.push(`Added: ${addedItems}`);
  }
  
  if (modified.length > 0) {
    const modifiedFields = modified.map(c => {
      const parts = c.field.split('.');
      if (parts.length > 1) {
        return `${parts[0]}(${parts.slice(1).join('.')})`;
      }
      return c.field;
    });
    summaryParts.push(`Modified: ${modifiedFields.join(', ')}`);
  }
  
  if (deleted.length > 0) {
    const deletedItems = deleted.map(c => c.field.split('.').pop()).join(', ');
    summaryParts.push(`Deleted: ${deletedItems}`);
  }
  
  return summaryParts.join(' | ') || actionDetails || 'Configuration updated';
}

/**
 * Truncate long text for display in diffs
 */
function truncateForDisplay(text: any, maxLength: number = 100): any {
  if (typeof text !== 'string') return text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Save a version to history
 */
export async function saveConfigHistory(
  config: any,
  previousConfig: any | null,
  action: ILetterPromptConfigHistory['action'],
  changedBy: string,
  actionDetails?: string
): Promise<ILetterPromptConfigHistory> {
  const changes = previousConfig 
    ? calculateConfigDiff(previousConfig, config) 
    : [];
  
  const changeSummary = generateChangeSummary(changes, action, actionDetails);
  
  const history = await LetterPromptConfigHistory.create({
    version: config.version,
    configSnapshot: {
      systemPrompt: config.systemPrompt,
      letterTypes: JSON.parse(JSON.stringify(config.letterTypes || [])),
      tones: JSON.parse(JSON.stringify(config.tones || [])),
      defaults: JSON.parse(JSON.stringify(config.defaults || {})),
      researchInstructions: JSON.parse(JSON.stringify(config.researchInstructions || {})),
      qualityStandards: config.qualityStandards,
    },
    changes,
    changeSummary,
    action,
    actionDetails,
    changedBy,
  });
  
  return history;
}

/**
 * Get version history (most recent first)
 */
export async function getConfigHistory(limit: number = 50): Promise<ILetterPromptConfigHistory[]> {
  return LetterPromptConfigHistory.find()
    .sort({ version: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get a specific version from history
 */
export async function getConfigVersion(version: number): Promise<ILetterPromptConfigHistory | null> {
  return LetterPromptConfigHistory.findOne({ version }).lean();
}

/**
 * Compare two versions
 */
export async function compareVersions(
  version1: number,
  version2: number
): Promise<{ v1: ILetterPromptConfigHistory | null; v2: ILetterPromptConfigHistory | null; changes: IConfigChange[] }> {
  const [v1, v2] = await Promise.all([
    getConfigVersion(version1),
    getConfigVersion(version2),
  ]);
  
  const changes = v1 && v2 
    ? calculateConfigDiff(v1.configSnapshot, v2.configSnapshot)
    : [];
  
  return { v1, v2, changes };
}


