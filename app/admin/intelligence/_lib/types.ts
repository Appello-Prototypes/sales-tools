export interface JobLog {
  step: string;
  message: string;
  status: 'loading' | 'complete' | 'error' | 'warning' | 'info';
  data?: any;
  timestamp: Date;
}

export interface DealDetails {
  dealstage?: string;
  stageLabel?: string;
  amount?: string;
  amountFormatted?: string;
  pipeline?: string;
  closedate?: string;
  dealtype?: string;
  isClosed?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  dealScore?: {
    totalScore: number;
    percentage: number;
    grade: string;
    priority: string;
    healthIndicator: string;
    breakdown: {
      stageScore: number;
      valueScore: number;
      timelineScore: number;
      activityScore: number;
      associationScore: number;
    };
    recommendations: string[];
  };
}

export interface IntelligenceJob {
  _id: string;
  id: string;
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  result?: {
    intelligence?: any;
    insights?: string[];
    recommendedActions?: string[];
    riskFactors?: string[];
    opportunitySignals?: string[];
    [key: string]: any;
  };
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  stats?: {
    iterations: number;
    toolCalls: number;
    duration?: number;
  };
  logs?: JobLog[];
  dealDetails?: DealDetails;
  version?: number;
  historyCount?: number;
}

export interface EntityGroup {
  entityKey: string;
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
  latestJob: IntelligenceJob;
  revisions: IntelligenceJob[];
  totalRevisions: number;
}

export interface PipelineStageDeal {
  id: string;
  name: string;
  amount: number;
  score: number;
  grade: string;
  priority: string;
}

export interface PipelineStageData {
  stage: string;
  stageLabel: string;
  pipeline: string;
  pipelineLabel: string;
  displayOrder: number;
  count: number;
  totalValue: number;
  avgScore: number;
  avgGrade: string;
  deals: PipelineStageDeal[];
}

export interface PipelineData {
  id: string;
  label: string;
  stages: Array<{
    id: string;
    label: string;
    displayOrder: number;
  }>;
}

export interface AnalyticsData {
  overview: {
    totalAnalyzedDeals: number;
    totalAnalyzedCompanies: number;
    totalAnalyzedContacts: number;
    totalPipelineValue: number;
    weightedPipelineValue: number;
    avgDealScore: number;
    avgOpenDealScore: number;
    avgJobDuration: number;
    hotDealsValue: number;
    openDealsCount: number;
  };
  priorityDistribution: {
    hot: number;
    warm: number;
    cool: number;
    cold: number;
    hotValue: number;
    warmValue: number;
    coolValue: number;
    coldValue: number;
  };
  gradeDistribution: Record<string, { count: number; value: number }>;
  healthDistribution: Record<string, { count: number; value: number }>;
  pipelineStages: PipelineStageData[];
  pipelines: PipelineData[];
  topDealsByValue: any[];
  topDealsByScore: any[];
  atRiskDeals: any[];
  aggregatedInsights: {
    insights: Array<{ type: string; text: string; count: number; dealNames: string[]; priority: string }>;
    risks: Array<{ type: string; text: string; count: number; dealNames: string[]; priority: string }>;
    opportunities: Array<{ type: string; text: string; count: number; dealNames: string[]; priority: string }>;
    actions: Array<{ type: string; text: string; count: number; dealNames: string[]; priority: string }>;
  };
  companyIntelligence: any[];
  performanceMetrics: Array<{ label: string; value: number; trend?: string }>;
  activityTimeline: Array<{ date: string; count: number; value: number }>;
  dealScores: any[];
}

