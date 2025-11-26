/**
 * Configurable Scoring System
 * 
 * Allows admin to adjust scoring weights and algorithms
 */

export interface ScoringWeights {
  urgency: number;
  painSeverity: number;
  companySize: number;
  timeline: number;
  likelihood: number;
  currentState: number;
  budgetIndicators: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  gradeThresholds: {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D': number;
  };
  priorityThresholds: {
    High: number;
    Medium: number;
    Low: number;
  };
  customPrompts?: {
    industryBenchmarks?: string;
    peerComparison?: string;
    successStories?: string;
    personalizedInsights?: string;
    nextSteps?: string;
  };
}

// Default configuration (matches current hardcoded values)
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    urgency: 20,
    painSeverity: 20,
    companySize: 15,
    timeline: 15,
    likelihood: 15,
    currentState: 10,
    budgetIndicators: 5,
  },
  gradeThresholds: {
    'A+': 90,
    'A': 85,
    'B+': 75,
    'B': 65,
    'C+': 55,
    'C': 45,
    'D': 0,
  },
  priorityThresholds: {
    High: 75,
    Medium: 55,
    Low: 0,
  },
};

// Load configuration from database or use defaults
export async function getScoringConfig(): Promise<ScoringConfig> {
  try {
    const { default: connectDB } = await import('../mongodb');
    const { default: AssessmentConfig } = await import('../../models/AssessmentConfig');
    
    await connectDB();
    const dbConfig: any = await (AssessmentConfig as any).findOne({ type: 'scoring' }).lean();
    
    if (dbConfig && dbConfig.config) {
      return {
        ...DEFAULT_SCORING_CONFIG,
        ...dbConfig.config,
        customPrompts: (dbConfig as any).customPrompts || {},
      };
    }
  } catch (error) {
    console.warn('Failed to load scoring config from database, using defaults:', error);
  }
  
  return DEFAULT_SCORING_CONFIG;
}

// Save configuration
export async function saveScoringConfig(config: ScoringConfig): Promise<void> {
  const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
  if (totalWeight !== 100) {
    throw new Error(`Total weights must equal 100, got ${totalWeight}`);
  }
  
  try {
    const { default: connectDB } = await import('../mongodb');
    const { default: AssessmentConfig } = await import('../../models/AssessmentConfig');
    
    await connectDB();
    await (AssessmentConfig as any).findOneAndUpdate(
      { type: 'scoring' },
      {
        type: 'scoring',
        config: {
          weights: config.weights,
          gradeThresholds: config.gradeThresholds,
          priorityThresholds: config.priorityThresholds,
        },
        customPrompts: config.customPrompts || {},
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Failed to save scoring config to database:', error);
    throw error;
  }
}

