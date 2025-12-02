import { IIntelligenceJob, IAnalysisSnapshot } from '@/models/IntelligenceJob';

export interface ChangeDetectionResult {
  hasChanges: boolean;
  scoreChange?: number;
  previousScore?: number;
  currentScore?: number;
  changedFields: string[];
  newInsights: string[];
  resolvedRisks: string[];
  newRisks: string[];
  newOpportunities: string[];
  resolvedOpportunities: string[];
  summary: string;
}

/**
 * Extract the primary score from a result object
 */
function extractScore(result?: any): number | undefined {
  if (!result) return undefined;
  
  // Try different score fields
  if (result.dealScore !== undefined) return result.dealScore;
  if (result.healthScore !== undefined) return result.healthScore;
  if (result.engagementScore !== undefined) return result.engagementScore;
  if (result.intelligence?.dealScore !== undefined) return result.intelligence.dealScore;
  if (result.intelligence?.healthScore !== undefined) return result.intelligence.healthScore;
  if (result.intelligence?.engagementScore !== undefined) return result.intelligence.engagementScore;
  
  // Check for dealScoreData
  if (result.dealScoreData?.totalScore !== undefined) return result.dealScoreData.totalScore;
  
  return undefined;
}

/**
 * Find items in array A that are not in array B (approximately)
 */
function findNewItems(current: string[] = [], previous: string[] = []): string[] {
  const prevSet = new Set(previous.map(p => p.toLowerCase().trim()));
  return current.filter(item => {
    const normalized = item.toLowerCase().trim();
    // Check for exact match or significant similarity
    return !prevSet.has(normalized) && 
           !previous.some(p => isSimilar(p, item));
  });
}

/**
 * Check if two strings are similar (basic similarity check)
 */
function isSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const normA = normalize(a);
  const normB = normalize(b);
  
  // Exact match
  if (normA === normB) return true;
  
  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) return true;
  
  // Simple word overlap check (if >60% words match)
  const wordsA = new Set(normA.split(/\s+/));
  const wordsB = new Set(normB.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const overlap = intersection.length / Math.min(wordsA.size, wordsB.size);
  
  return overlap > 0.6;
}

/**
 * Detect changes between current analysis and previous analysis
 */
export function detectChanges(
  currentResult: any,
  previousResult: any
): ChangeDetectionResult {
  const changes: ChangeDetectionResult = {
    hasChanges: false,
    changedFields: [],
    newInsights: [],
    resolvedRisks: [],
    newRisks: [],
    newOpportunities: [],
    resolvedOpportunities: [],
    summary: '',
  };

  if (!previousResult) {
    changes.summary = 'Initial analysis - no previous data to compare.';
    return changes;
  }

  // Compare scores
  const currentScore = extractScore(currentResult);
  const previousScore = extractScore(previousResult);
  
  if (currentScore !== undefined && previousScore !== undefined) {
    const scoreDiff = currentScore - previousScore;
    if (scoreDiff !== 0) {
      changes.hasChanges = true;
      changes.scoreChange = scoreDiff;
      changes.previousScore = previousScore;
      changes.currentScore = currentScore;
      changes.changedFields.push('score');
    }
  }

  // Get intelligence data
  const currentIntel = currentResult?.intelligence || currentResult;
  const prevIntel = previousResult?.intelligence || previousResult;

  // Compare insights
  const currentInsights = currentIntel?.insights || currentResult?.insights || [];
  const prevInsights = prevIntel?.insights || previousResult?.insights || [];
  changes.newInsights = findNewItems(currentInsights, prevInsights);
  if (changes.newInsights.length > 0) {
    changes.hasChanges = true;
    changes.changedFields.push('insights');
  }

  // Compare risk factors
  const currentRisks = currentIntel?.riskFactors || currentResult?.riskFactors || [];
  const prevRisks = prevIntel?.riskFactors || previousResult?.riskFactors || [];
  changes.newRisks = findNewItems(currentRisks, prevRisks);
  changes.resolvedRisks = findNewItems(prevRisks, currentRisks);
  if (changes.newRisks.length > 0 || changes.resolvedRisks.length > 0) {
    changes.hasChanges = true;
    changes.changedFields.push('riskFactors');
  }

  // Compare opportunities
  const currentOpps = currentIntel?.opportunitySignals || currentResult?.opportunitySignals || [];
  const prevOpps = prevIntel?.opportunitySignals || previousResult?.opportunitySignals || [];
  changes.newOpportunities = findNewItems(currentOpps, prevOpps);
  changes.resolvedOpportunities = findNewItems(prevOpps, currentOpps);
  if (changes.newOpportunities.length > 0 || changes.resolvedOpportunities.length > 0) {
    changes.hasChanges = true;
    changes.changedFields.push('opportunitySignals');
  }

  // Compare recommended actions
  const currentActions = currentIntel?.recommendedActions || currentResult?.recommendedActions || [];
  const prevActions = prevIntel?.recommendedActions || previousResult?.recommendedActions || [];
  if (findNewItems(currentActions, prevActions).length > 0 || findNewItems(prevActions, currentActions).length > 0) {
    changes.hasChanges = true;
    changes.changedFields.push('recommendedActions');
  }

  // Generate summary
  changes.summary = generateChangeSummary(changes);

  return changes;
}

/**
 * Generate a human-readable summary of changes
 */
function generateChangeSummary(changes: ChangeDetectionResult): string {
  if (!changes.hasChanges) {
    return 'No significant changes detected since the last analysis.';
  }

  const parts: string[] = [];

  // Score change
  if (changes.scoreChange !== undefined && changes.scoreChange !== 0) {
    const direction = changes.scoreChange > 0 ? 'improved' : 'declined';
    const absChange = Math.abs(changes.scoreChange);
    parts.push(`Score ${direction} by ${absChange} points (${changes.previousScore} → ${changes.currentScore})`);
  }

  // New insights
  if (changes.newInsights.length > 0) {
    parts.push(`${changes.newInsights.length} new insight${changes.newInsights.length > 1 ? 's' : ''} discovered`);
  }

  // Risk changes
  if (changes.newRisks.length > 0) {
    parts.push(`${changes.newRisks.length} new risk${changes.newRisks.length > 1 ? 's' : ''} identified`);
  }
  if (changes.resolvedRisks.length > 0) {
    parts.push(`${changes.resolvedRisks.length} risk${changes.resolvedRisks.length > 1 ? 's' : ''} resolved`);
  }

  // Opportunity changes
  if (changes.newOpportunities.length > 0) {
    parts.push(`${changes.newOpportunities.length} new opportunit${changes.newOpportunities.length > 1 ? 'ies' : 'y'} found`);
  }
  if (changes.resolvedOpportunities.length > 0) {
    parts.push(`${changes.resolvedOpportunities.length} opportunit${changes.resolvedOpportunities.length > 1 ? 'ies' : 'y'} addressed`);
  }

  return parts.join('. ') + '.';
}

/**
 * Create a history snapshot from a completed job
 */
export function createHistorySnapshot(job: IIntelligenceJob, changes?: ChangeDetectionResult): IAnalysisSnapshot {
  return {
    analysisId: job.analysisId,
    result: job.result,
    stats: job.stats,
    completedAt: job.completedAt || new Date(),
    userId: job.userId,
    changes: changes ? {
      scoreChange: changes.scoreChange,
      newInsights: changes.newInsights,
      resolvedRisks: changes.resolvedRisks,
      newRisks: changes.newRisks,
      summary: changes.summary,
    } : undefined,
  };
}

/**
 * Get the latest completed job for an entity
 */
export async function getLatestCompletedJob(
  IntelligenceJob: any,
  entityType: string,
  entityId: string
): Promise<IIntelligenceJob | null> {
  return await IntelligenceJob.findOne({
    entityType,
    entityId,
    status: 'complete',
  })
    .sort({ completedAt: -1 })
    .lean();
}

/**
 * Get all completed jobs for an entity (for timeline)
 */
export async function getEntityJobHistory(
  IntelligenceJob: any,
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<IIntelligenceJob[]> {
  return await IntelligenceJob.find({
    entityType,
    entityId,
    status: 'complete',
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}


