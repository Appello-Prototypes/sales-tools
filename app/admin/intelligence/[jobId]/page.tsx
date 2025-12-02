'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Sparkles,
  FileText,
  Target,
  Lightbulb,
  Shield,
  BarChart3,
  ArrowLeft,
  Calendar,
  Timer,
  Hash,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Database,
  Gauge,
  DollarSign,
  Activity,
  Link2,
  Flame,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Mail,
  Phone,
  AlertTriangle,
  MessageCircle,
  Video,
  Circle,
  MapPin,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  Meh,
  HelpCircle,
  GitBranch,
  Milestone,
  PenTool,
} from 'lucide-react';
import { AgentActivityLog } from '@/components/ai/AgentActivityLog';
import { getContactLinkClient, getCompanyLinkClient, getDealLinkClient } from '@/lib/hubspot/hubspotLinks';

interface DealScoreData {
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
}

interface Stakeholder {
  name: string;
  title?: string;
  email?: string;
  role: string;
  influence: string;
  interests?: string[];
  painPoints?: string[];
  engagement: string;
  sentiment: string;
  keyNotes?: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  type: string;
  significance: string;
}

interface DealStageAnalysis {
  hubspotStage: string;
  inferredStage: string;
  stageMatch: boolean;
  stageConfidence: string;
  stageNotes?: string;
}

interface ChangeDetection {
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
}

interface HistoryEntry {
  analysisId: string;
  result?: any;
  stats?: {
    iterations: number;
    toolCalls: number;
    duration?: number;
  };
  completedAt: string;
  userId?: string;
  changes?: {
    scoreChange?: number;
    newInsights?: string[];
    resolvedRisks?: string[];
    newRisks?: string[];
    summary?: string;
  };
}

interface IntelligenceJob {
  _id: string;
  id: string;
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  entityName: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: {
    intelligence?: any;
    dealScoreData?: DealScoreData;
  };
  stats?: {
    toolCalls: number;
    duration: number;
  };
  logs?: Array<{
    step: number;
    message: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    data?: any;
    timestamp: string;
  }>;
  // History tracking
  version?: number;
  analysisId?: string;
  previousJobId?: string;
  history?: HistoryEntry[];
  historyCount?: number;
  changeDetection?: ChangeDetection;
  previousJobSummary?: {
    id: string;
    version: number;
    completedAt: string;
    analysisId: string;
  };
}

const ENTITY_ICONS = {
  contact: User,
  company: Building2,
  deal: TrendingUp,
};

// Helper functions for stakeholder display
const getRoleColor = (role: string) => {
  switch (role) {
    case 'Economic Buyer': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Decision Maker': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'Champion': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Technical Evaluator': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Influencer': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Blocker': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-2 border-red-300';
    case 'End User': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'Positive': return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
    case 'Concerned': return <ThumbsDown className="h-4 w-4 text-red-500" />;
    case 'Neutral': return <Meh className="h-4 w-4 text-amber-500" />;
    default: return <HelpCircle className="h-4 w-4 text-slate-400" />;
  }
};

const getInfluenceBadge = (influence: string) => {
  switch (influence) {
    case 'High': return 'bg-red-500 text-white';
    case 'Medium': return 'bg-amber-500 text-white';
    case 'Low': return 'bg-slate-400 text-white';
    default: return 'bg-slate-400 text-white';
  }
};

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'deal_created': return <Circle className="h-4 w-4 text-emerald-500" />;
    case 'stage_change': return <GitBranch className="h-4 w-4 text-blue-500" />;
    case 'meeting': return <Video className="h-4 w-4 text-purple-500" />;
    case 'call': return <Phone className="h-4 w-4 text-cyan-500" />;
    case 'email': return <Mail className="h-4 w-4 text-amber-500" />;
    case 'note': return <PenTool className="h-4 w-4 text-slate-500" />;
    case 'milestone': return <Milestone className="h-4 w-4 text-red-500" />;
    default: return <Calendar className="h-4 w-4 text-slate-400" />;
  }
};

const getSignificanceColor = (significance: string) => {
  switch (significance) {
    case 'High': return 'border-l-red-500';
    case 'Medium': return 'border-l-amber-500';
    case 'Low': return 'border-l-slate-400';
    default: return 'border-l-slate-400';
  }
};

export default function IntelligenceReportPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<IntelligenceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [auditLogExpanded, setAuditLogExpanded] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [dataPointsExpanded, setDataPointsExpanded] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/admin/intelligence/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch intelligence report');
        const data = await res.json();
        setJob(data.job);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();

    // Poll if running
    const interval = setInterval(async () => {
      if (job?.status === 'running' || job?.status === 'pending') {
        try {
          const res = await fetch(`/api/admin/intelligence/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            setJob(data.job);
          }
        } catch {}
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  const handleRerunReport = async () => {
    if (!job) return;
    
    setRerunning(true);
    try {
      const res = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: job.entityType,
          entityId: job.entityId,
          entityName: job.entityName,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create new report');
      
      const data = await res.json();
      // Navigate to the new job
      router.push(`/admin/intelligence/${data.job.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRerunning(false);
    }
  };

  const getEntityLink = () => {
    if (!job) return null;
    switch (job.entityType) {
      case 'contact':
        return getContactLinkClient(job.entityId);
      case 'company':
        return getCompanyLinkClient(job.entityId);
      case 'deal':
        return getDealLinkClient(job.entityId);
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 6) return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    if (score >= 4) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The requested intelligence report could not be found.'}</p>
            <Button onClick={() => router.push('/admin/intelligence')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Intelligence Hub
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const EntityIcon = ENTITY_ICONS[job.entityType];
  const intelligence = job.result?.intelligence;
  const dealScoreData = job.result?.dealScoreData;
  const hasReport = job.status === 'complete' && (intelligence || dealScoreData);
  const entityLink = getEntityLink();
  // For deals, prefer the dealScoreData; for others use the existing scores
  const score = job.entityType === 'deal' && dealScoreData 
    ? dealScoreData.totalScore 
    : (intelligence?.healthScore || intelligence?.engagementScore);
  const isDealWithScore = job.entityType === 'deal' && dealScoreData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Document Container - Google Doc style */}
      <div className="max-w-4xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="px-6 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              {job.status === 'running' && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Analyzing...
                </Badge>
              )}
              {job.status === 'complete' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRerunReport}
                  disabled={rerunning}
                >
                  {rerunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-run
                    </>
                  )}
                </Button>
              )}
              {entityLink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={entityLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in HubSpot
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="px-6 py-10 md:px-12 md:py-16">
          {/* Document Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <EntityIcon className="h-3.5 w-3.5" />
                <span className="capitalize">{job.entityType}</span>
              </div>
              <span>•</span>
              <span>Intelligence Report</span>
              <span>•</span>
              <Badge variant="outline" className="font-normal">
                Version {job.version || 1}
              </Badge>
              {(job.historyCount || 0) > 0 && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => router.push(`/admin/intelligence/entity?type=${job.entityType}&id=${job.entityId}`)}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>{job.historyCount} previous</span>
                  </button>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              {job.entityName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {job.completedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(job.completedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}</span>
                </div>
              )}
              {job.stats?.duration && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-4 w-4" />
                  <span>Analyzed in {formatDuration(job.stats.duration)}</span>
                </div>
              )}
              {job.stats?.toolCalls && (
                <div className="flex items-center gap-1.5">
                  <Hash className="h-4 w-4" />
                  <span>{job.stats.toolCalls} data points examined</span>
                </div>
              )}
            </div>
          </header>

          <Separator className="mb-10" />

          {/* Change Detection Summary */}
          {job.changeDetection?.hasChanges && job.status === 'complete' && (
            <Card className="p-6 mb-10 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    Changes Since Last Analysis
                    {job.changeDetection.scoreChange !== undefined && job.changeDetection.scoreChange !== 0 && (
                      <span className={`flex items-center text-sm ${
                        job.changeDetection.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {job.changeDetection.scoreChange > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(job.changeDetection.scoreChange)} points
                      </span>
                    )}
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
                    {job.changeDetection.summary}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    {job.changeDetection.newInsights && job.changeDetection.newInsights.length > 0 && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Lightbulb className="h-3.5 w-3.5" />
                        {job.changeDetection.newInsights.length} new insights
                      </span>
                    )}
                    {job.changeDetection.newRisks && job.changeDetection.newRisks.length > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Shield className="h-3.5 w-3.5" />
                        {job.changeDetection.newRisks.length} new risks
                      </span>
                    )}
                    {job.changeDetection.resolvedRisks && job.changeDetection.resolvedRisks.length > 0 && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {job.changeDetection.resolvedRisks.length} risks resolved
                      </span>
                    )}
                    {job.changeDetection.newOpportunities && job.changeDetection.newOpportunities.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        {job.changeDetection.newOpportunities.length} new opportunities
                      </span>
                    )}
                  </div>
                  {job.previousJobSummary && (
                    <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <button
                        onClick={() => router.push(`/admin/intelligence/${job.previousJobSummary?.id}`)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Compare with v{job.previousJobSummary.version}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Running State */}
          {(job.status === 'running' || job.status === 'pending') && (
            <div className="space-y-8">
              <Card className="p-8 text-center border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <Brain className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
                <h2 className="text-xl font-semibold mb-2">Analysis in Progress</h2>
                <p className="text-muted-foreground">
                  Our AI agent is investigating this {job.entityType} and gathering intelligence...
                </p>
              </Card>

              {job.logs && job.logs.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    Live Activity
                    <span className="text-xs text-blue-500 animate-pulse ml-2">● Live</span>
                  </h2>
                  <Card className="p-4">
                    <AgentActivityLog
                      logs={job.logs.map(log => ({
                        step: log.step,
                        message: log.message,
                        status: log.status,
                        data: log.data,
                        timestamp: new Date(log.timestamp),
                      }))}
                      isLoading={true}
                      maxHeight="400px"
                    />
                  </Card>
                </section>
              )}
            </div>
          )}

          {/* Error State */}
          {job.status === 'error' && (
            <Card className="p-8 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-start gap-4">
                <XCircle className="h-8 w-8 text-red-500 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                    Analysis Failed
                  </h2>
                  <p className="text-red-600 dark:text-red-400">{job.error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Complete State - The Report */}
          {hasReport && (
            <div className="space-y-8">
              {/* DEAL STAGE HEADER - Clear and Prominent */}
              {job.entityType === 'deal' && (intelligence?.dealStageAnalysis || dealScoreData) && (
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 border border-slate-700/50">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                  </div>
                  
                  <div className="relative">
                    {/* Deal Name & Core Info */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                      <div>
                        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Deal Intelligence</div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{job.entityName}</h2>
                        {intelligence?.executiveSummary && (
                          <p className="text-slate-300 max-w-2xl leading-relaxed">{intelligence.executiveSummary}</p>
                        )}
                      </div>
                      
                      {/* Score Badge */}
                      {dealScoreData && (
                        <div className="flex flex-col items-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <div className="text-sm text-slate-400 mb-1">Deal Score</div>
                          <div className={`text-5xl font-bold ${
                            dealScoreData.grade.startsWith('A') ? 'text-emerald-400' :
                            dealScoreData.grade.startsWith('B') ? 'text-blue-400' :
                            dealScoreData.grade.startsWith('C') ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {dealScoreData.grade}
                          </div>
                          <div className="text-lg text-slate-300">{dealScoreData.totalScore}/100</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Stage Information - CRITICAL */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* HubSpot Stage */}
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <Database className="h-4 w-4" />
                          HubSpot Stage
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {intelligence?.dealStageAnalysis?.hubspotStage || dealScoreData?.healthIndicator || 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Inferred/Validated Stage */}
                      {intelligence?.dealStageAnalysis && (
                        <div className={`p-4 rounded-xl border ${
                          intelligence.dealStageAnalysis.stageMatch 
                            ? 'bg-emerald-900/20 border-emerald-700/30' 
                            : 'bg-amber-900/20 border-amber-700/30'
                        }`}>
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Brain className="h-4 w-4" />
                            Inferred Stage
                            {!intelligence.dealStageAnalysis.stageMatch && (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <div className={`text-lg font-semibold ${
                            intelligence.dealStageAnalysis.stageMatch ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {intelligence.dealStageAnalysis.inferredStage}
                          </div>
                          {intelligence.dealStageAnalysis.stageNotes && (
                            <p className="text-sm text-slate-400 mt-1">{intelligence.dealStageAnalysis.stageNotes}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Priority & Health */}
                      {dealScoreData && (
                        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Flame className="h-4 w-4" />
                            Priority
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`text-sm px-3 py-1 ${
                              dealScoreData.priority === 'Hot' ? 'bg-red-600 text-white' :
                              dealScoreData.priority === 'Warm' ? 'bg-orange-600 text-white' :
                              dealScoreData.priority === 'Cool' ? 'bg-blue-600 text-white' :
                              'bg-slate-600 text-white'
                            }`}>
                              {dealScoreData.priority}
                            </Badge>
                            <span className="text-slate-400">•</span>
                            <span className={`font-medium ${
                              dealScoreData.healthIndicator === 'Excellent' ? 'text-emerald-400' :
                              dealScoreData.healthIndicator === 'Good' ? 'text-green-400' :
                              dealScoreData.healthIndicator === 'Fair' ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {dealScoreData.healthIndicator}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Non-deal entities: simpler header */}
              {job.entityType !== 'deal' && (
                <section className="p-6 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                  <h2 className="text-2xl font-bold mb-2">{job.entityName}</h2>
                  <p className="text-muted-foreground capitalize">{job.entityType} Intelligence Report</p>
                </section>
              )}

              {/* STAKEHOLDER ANALYSIS - Critical Section */}
              {intelligence?.stakeholders && intelligence.stakeholders.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Internal Stakeholder Analysis
                    <Badge variant="outline" className="ml-2">{intelligence.stakeholders.length} contacts</Badge>
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {intelligence.stakeholders.map((stakeholder: Stakeholder, idx: number) => (
                      <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{stakeholder.name}</h4>
                              {stakeholder.title && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">{stakeholder.title}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSentimentIcon(stakeholder.sentiment)}
                            <Badge className={`text-xs ${getInfluenceBadge(stakeholder.influence)}`}>
                              {stakeholder.influence}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {/* Role */}
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getRoleColor(stakeholder.role)}`}>
                              {stakeholder.role}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {stakeholder.engagement} Engagement
                            </Badge>
                          </div>
                          
                          {/* Contact Info */}
                          {stakeholder.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Mail className="h-3 w-3" />
                              <span>{stakeholder.email}</span>
                            </div>
                          )}
                          
                          {/* Interests */}
                          {stakeholder.interests && stakeholder.interests.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Cares About
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {stakeholder.interests.map((interest: string, i: number) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Pain Points */}
                          {stakeholder.painPoints && stakeholder.painPoints.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                Pain Points
                              </div>
                              <div className="space-y-1">
                                {stakeholder.painPoints.map((pain: string, i: number) => (
                                  <div key={i} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                    {pain}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Key Notes */}
                          {stakeholder.keyNotes && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                "{stakeholder.keyNotes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* DEAL TIMELINE */}
              {intelligence?.timeline && intelligence.timeline.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Deal Timeline
                    <Badge variant="outline" className="ml-2">{intelligence.timeline.length} events</Badge>
                  </h2>
                  <Card className="p-6">
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                      
                      {/* Events */}
                      <div className="space-y-4">
                        {intelligence.timeline.map((event: TimelineEvent, idx: number) => (
                          <div key={idx} className={`relative pl-14 pr-4 py-3 rounded-lg border-l-4 bg-slate-50/50 dark:bg-slate-800/30 ${getSignificanceColor(event.significance)}`}>
                            {/* Icon */}
                            <div className="absolute left-3 top-4 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                              {getTimelineIcon(event.type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{event.event}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {event.type.replace(/_/g, ' ')}
                                  </Badge>
                                  {event.significance === 'High' && (
                                    <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                      Key Event
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </section>
              )}

              {/* Compact Score Breakdown - Only show breakdown details */}
              {isDealWithScore ? (
                <section>
                  {/* Compact Deal Score Breakdown */}
                  <Card className="p-5">
                    <button
                      onClick={() => setDataPointsExpanded(!dataPointsExpanded)}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-blue-600" />
                        Score Breakdown
                      </h3>
                      {dataPointsExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    {dataPointsExpanded && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {/* Stage Progress */}
                        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-xs text-muted-foreground mb-1">Stage</div>
                          <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                            {dealScoreData.breakdown.stageScore}<span className="text-xs font-normal text-muted-foreground">/25</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(dealScoreData.breakdown.stageScore / 25) * 100}%` }} />
                          </div>
                        </div>

                        {/* Deal Value */}
                        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-xs text-muted-foreground mb-1">Value</div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {dealScoreData.breakdown.valueScore}<span className="text-xs font-normal text-muted-foreground">/25</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(dealScoreData.breakdown.valueScore / 25) * 100}%` }} />
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {dealScoreData.breakdown.timelineScore}<span className="text-xs font-normal text-muted-foreground">/20</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(dealScoreData.breakdown.timelineScore / 20) * 100}%` }} />
                          </div>
                        </div>

                        {/* Activity */}
                        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-xs text-muted-foreground mb-1">Activity</div>
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {dealScoreData.breakdown.activityScore}<span className="text-xs font-normal text-muted-foreground">/15</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(dealScoreData.breakdown.activityScore / 15) * 100}%` }} />
                          </div>
                        </div>

                        {/* Associations */}
                        <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-xs text-muted-foreground mb-1">Links</div>
                          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                            {dealScoreData.breakdown.associationScore}<span className="text-xs font-normal text-muted-foreground">/15</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${(dealScoreData.breakdown.associationScore / 15) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </section>
              ) : score && (
                <section className={`p-8 rounded-xl border-2 ${getScoreBgColor(score)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {job.entityType === 'deal' ? 'Deal Health Score' : 'Engagement Score'}
                      </div>
                      <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
                        {score}
                        <span className="text-2xl text-muted-foreground font-normal ml-1">/10</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-lg px-4 py-1.5 ${getScoreBgColor(score)}`}>
                        {getScoreLabel(score)}
                      </Badge>
                    </div>
                  </div>
                </section>
              )}

              {/* Investigation Summary - Collapsible */}
              {intelligence.investigationSummary && (
                <section>
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">Investigation Summary</span>
                    </div>
                    {summaryExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {summaryExpanded && (
                    <Card className="p-5 mt-2">
                      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300">
                        {(() => {
                          const lines = intelligence.investigationSummary.split('\n');
                          const elements: React.ReactNode[] = [];
                          let currentList: string[] = [];
                          let listType: 'bullet' | 'number' | null = null;
                          
                          const renderBoldText = (text: string) => {
                            return text.split(/(\*\*[^*]+\*\*)/).map((part: string, idx: number) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={idx} className="font-semibold text-slate-800 dark:text-slate-200">{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            });
                          };
                          
                          const flushList = () => {
                            if (currentList.length > 0) {
                              if (listType === 'number') {
                                elements.push(
                                  <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 mb-3 ml-2 text-sm">
                                    {currentList.map((item, idx) => (
                                      <li key={idx} className="text-slate-600 dark:text-slate-400">{renderBoldText(item)}</li>
                                    ))}
                                  </ol>
                                );
                              } else {
                                elements.push(
                                  <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-3 ml-2 text-sm">
                                    {currentList.map((item, idx) => (
                                      <li key={idx} className="text-slate-600 dark:text-slate-400">{renderBoldText(item)}</li>
                                    ))}
                                  </ul>
                                );
                              }
                              currentList = [];
                              listType = null;
                            }
                          };
                          
                          lines.forEach((line: string, idx: number) => {
                            const trimmed = line.trim();
                            if (!trimmed) {
                              flushList();
                              return;
                            }
                            
                            if (trimmed.startsWith('- ')) {
                              if (listType !== 'bullet') flushList();
                              listType = 'bullet';
                              currentList.push(trimmed.substring(2));
                              return;
                            }
                            
                            const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
                            if (numberMatch) {
                              if (listType !== 'number') flushList();
                              listType = 'number';
                              currentList.push(numberMatch[2]);
                              return;
                            }
                            
                            flushList();
                            elements.push(
                              <p key={`p-${idx}`} className="mb-3 text-sm">{renderBoldText(trimmed)}</p>
                            );
                          });
                          
                          flushList();
                          return elements;
                        })()}
                      </div>
                    </Card>
                  )}
                </section>
              )}

              {/* Quick Action Items - Combined Actions & Risks */}
              {((intelligence.recommendedActions && intelligence.recommendedActions.length > 0) || 
                (intelligence.riskFactors && intelligence.riskFactors.length > 0)) && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recommended Actions */}
                  {intelligence.recommendedActions && intelligence.recommendedActions.length > 0 && (
                    <Card className="p-5">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-600" />
                        Next Actions
                        <Badge variant="outline" className="ml-2">{intelligence.recommendedActions.length}</Badge>
                      </h3>
                      <ul className="space-y-2">
                        {intelligence.recommendedActions.slice(0, 5).map((action: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">{action}</span>
                          </li>
                        ))}
                        {intelligence.recommendedActions.length > 5 && (
                          <li className="text-xs text-muted-foreground pl-6">
                            +{intelligence.recommendedActions.length - 5} more actions
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}

                  {/* Risk Factors */}
                  {intelligence.riskFactors && intelligence.riskFactors.length > 0 && (
                    <Card className="p-5 border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        Risk Factors
                        <Badge variant="outline" className="ml-2 border-red-300 text-red-700 dark:text-red-400">{intelligence.riskFactors.length}</Badge>
                      </h3>
                      <ul className="space-y-2">
                        {intelligence.riskFactors.slice(0, 5).map((risk: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">{risk}</span>
                          </li>
                        ))}
                        {intelligence.riskFactors.length > 5 && (
                          <li className="text-xs text-muted-foreground pl-6">
                            +{intelligence.riskFactors.length - 5} more risks
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}
                </section>
              )}

              {/* Insights & Opportunities - Combined Grid */}
              {((intelligence.insights && intelligence.insights.length > 0) || 
                (intelligence.opportunitySignals && intelligence.opportunitySignals.length > 0)) && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Insights */}
                  {intelligence.insights && intelligence.insights.length > 0 && (
                    <Card className="p-5">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-purple-600" />
                        Key Insights
                        <Badge variant="outline" className="ml-2">{intelligence.insights.length}</Badge>
                      </h3>
                      <ul className="space-y-2">
                        {intelligence.insights.slice(0, 5).map((insight: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">{insight}</span>
                          </li>
                        ))}
                        {intelligence.insights.length > 5 && (
                          <li className="text-xs text-muted-foreground pl-7">
                            +{intelligence.insights.length - 5} more insights
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}

                  {/* Opportunity Signals */}
                  {intelligence.opportunitySignals && intelligence.opportunitySignals.length > 0 && (
                    <Card className="p-5 border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                        Opportunities
                        <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700 dark:text-amber-400">{intelligence.opportunitySignals.length}</Badge>
                      </h3>
                      <ul className="space-y-2">
                        {intelligence.opportunitySignals.slice(0, 5).map((signal: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">{signal}</span>
                          </li>
                        ))}
                        {intelligence.opportunitySignals.length > 5 && (
                          <li className="text-xs text-muted-foreground pl-6">
                            +{intelligence.opportunitySignals.length - 5} more opportunities
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}
                </section>
              )}

              {/* Similar Analysis */}
              {(intelligence.similarDealsAnalysis || intelligence.similarContactsAnalysis) && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-600" />
                    Comparative Analysis
                  </h2>
                  <Card className="p-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {intelligence.similarDealsAnalysis || intelligence.similarContactsAnalysis}
                      </p>
                    </div>
                  </Card>
                </section>
              )}

              {/* Raw Analysis Fallback */}
              {intelligence.rawAnalysis && !intelligence.insights && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Analysis</h2>
                  <Card className="p-6">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="leading-relaxed whitespace-pre-wrap">{intelligence.rawAnalysis}</p>
                    </div>
                  </Card>
                </section>
              )}

              <Separator className="my-10" />

              {/* Activity Log (Collapsible) */}
              {job.logs && job.logs.length > 0 && (
                <section>
                  <button
                    onClick={() => setAuditLogExpanded(!auditLogExpanded)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">Agent Investigation Trail</span>
                      <Badge variant="secondary" className="ml-2">{job.logs.length} steps</Badge>
                    </div>
                    {auditLogExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {auditLogExpanded && (
                    <Card className="p-4 mt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete audit trail showing how the AI analyzed this {job.entityType}.
                      </p>
                      <AgentActivityLog
                        logs={job.logs.map(log => ({
                          step: log.step,
                          message: log.message,
                          status: log.status,
                          data: log.data,
                          timestamp: new Date(log.timestamp),
                        }))}
                        isLoading={false}
                        maxHeight="600px"
                      />
                    </Card>
                  )}
                </section>
              )}
            </div>
          )}

          {/* No Report Available */}
          {job.status === 'complete' && !intelligence && (
            <div className="space-y-8">
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">No Report Data</h2>
                <p className="text-muted-foreground mb-6">
                  The analysis completed but no intelligence data was generated.
                </p>
                <Button 
                  onClick={handleRerunReport}
                  disabled={rerunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {rerunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting New Analysis...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-run Report
                    </>
                  )}
                </Button>
              </Card>

              {/* Data Points Examined */}
              {job.logs && job.logs.length > 0 && (
                <section>
                  <button
                    onClick={() => setDataPointsExpanded(!dataPointsExpanded)}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">Data Points Examined</span>
                      <Badge variant="secondary" className="ml-2">{job.stats?.toolCalls || job.logs.length} points</Badge>
                    </div>
                    {dataPointsExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {dataPointsExpanded && (
                    <Card className="p-4 mt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        These are all the data points the AI examined during the analysis.
                      </p>
                      <AgentActivityLog
                        logs={job.logs.map(log => ({
                          step: log.step,
                          message: log.message,
                          status: log.status,
                          data: log.data,
                          timestamp: new Date(log.timestamp),
                        }))}
                        isLoading={false}
                        maxHeight="600px"
                      />
                    </Card>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Generated by AI Intelligence Agent</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

