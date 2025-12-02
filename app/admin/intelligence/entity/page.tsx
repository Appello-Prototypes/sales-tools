'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  FileText,
  ArrowLeft,
  Calendar,
  Timer,
  Hash,
  RefreshCw,
  History,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Sparkles,
  Shield,
  Target,
  Lightbulb,
  PlayCircle,
  GitCommit,
  BarChart3,
} from 'lucide-react';
import { getContactLinkClient, getCompanyLinkClient, getDealLinkClient } from '@/lib/hubspot/hubspotLinks';

interface EntityDetails {
  id: string;
  name: string;
  type: string;
  // Deal specific
  dealstage?: string;
  stageLabel?: string;
  amount?: number;
  amountFormatted?: string;
  pipeline?: string;
  closedate?: string;
  isClosed?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  currentScore?: any;
  // Company specific
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
  // Contact specific
  email?: string;
  company?: string;
  jobtitle?: string;
}

interface TimelineEntry {
  id: string;
  analysisId: string;
  version: number;
  status: 'complete' | 'error';
  completedAt: string;
  startedAt: string;
  duration?: number;
  toolCalls?: number;
  iterations?: number;
  userId?: string;
  error?: string;
  result?: {
    hasIntelligence: boolean;
    insightsCount: number;
    risksCount: number;
    opportunitiesCount: number;
    actionsCount: number;
    score?: number;
    full?: any;
  };
  changeDetection?: {
    hasChanges: boolean;
    scoreChange?: number;
    previousScore?: number;
    currentScore?: number;
    changedFields: string[];
    newInsights?: string[];
    resolvedRisks?: string[];
    newRisks?: string[];
    summary?: string;
  };
  previousJobId?: string;
}

interface Stats {
  totalAnalyses: number;
  completedAnalyses: number;
  erroredAnalyses: number;
  firstAnalysis: string | null;
  latestAnalysis: string | null;
  averageDuration: number | null;
}

interface ScoreTrendEntry {
  date: string;
  score: number;
  version: number;
}

const ENTITY_ICONS = {
  contact: User,
  company: Building2,
  deal: TrendingUp,
};

function EntityTimelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const entityType = searchParams.get('type') as 'contact' | 'company' | 'deal';
  const entityId = searchParams.get('id');

  const [entity, setEntity] = useState<EntityDetails | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scoreTrend, setScoreTrend] = useState<ScoreTrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (entityType && entityId) {
      loadEntityData();
    }
  }, [entityType, entityId]);

  const loadEntityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/admin/intelligence/entity?entityType=${entityType}&entityId=${entityId}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load entity data');
      }
      
      const data = await response.json();
      setEntity(data.entity);
      setTimeline(data.timeline);
      setStats(data.stats);
      setScoreTrend(data.scoreTrend || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRerunAnalysis = async () => {
    if (!entity) return;
    
    setIsRerunning(true);
    try {
      const response = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          entityName: entity.name,
          isRerun: true,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Navigate to the new job
        router.push(`/admin/intelligence/${data.job.id}`);
      }
    } catch (err) {
      console.error('Error re-running analysis:', err);
    } finally {
      setIsRerunning(false);
    }
  };

  const getEntityLink = () => {
    if (!entityType || !entityId) return null;
    switch (entityType) {
      case 'contact':
        return getContactLinkClient(entityId);
      case 'company':
        return getCompanyLinkClient(entityId);
      case 'deal':
        return getDealLinkClient(entityId);
      default:
        return null;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getScoreChangeIcon = (change?: number) => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    if (change > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const getScoreChangeColor = (change?: number) => {
    if (change === undefined || change === 0) return 'text-gray-400';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  if (!entityType || !entityId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Missing Parameters</h2>
          <p className="text-muted-foreground mb-6">
            Entity type and ID are required.
          </p>
          <Button onClick={() => router.push('/admin/intelligence')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Intelligence Hub
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500 mt-2">Loading entity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/admin/intelligence')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Intelligence Hub
          </Button>
        </Card>
      </div>
    );
  }

  const EntityIcon = ENTITY_ICONS[entityType] || Brain;
  const entityLink = getEntityLink();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="px-6 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/intelligence')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hub
            </Button>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRerunAnalysis}
                disabled={isRerunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRerunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Run New Analysis
                  </>
                )}
              </Button>
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

        {/* Content */}
        <div className="px-6 py-8">
          {/* Entity Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <EntityIcon className="h-4 w-4" />
                <span className="text-sm font-medium capitalize">{entityType}</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <History className="h-4 w-4" />
                <span>Intelligence Timeline</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              {entity?.name || 'Unknown Entity'}
            </h1>

            {/* Entity Details */}
            {entity && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {entity.type === 'deal' && (
                  <>
                    {entity.stageLabel && (
                      <span className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        {entity.stageLabel}
                      </span>
                    )}
                    {entity.amountFormatted && (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                        ${entity.amountFormatted}
                      </span>
                    )}
                    {entity.isClosed && (
                      <Badge className={entity.isWon ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {entity.isWon ? 'Won' : 'Lost'}
                      </Badge>
                    )}
                  </>
                )}
                {entity.type === 'contact' && (
                  <>
                    {entity.email && <span>{entity.email}</span>}
                    {entity.jobtitle && <span>{entity.jobtitle}</span>}
                    {entity.company && <span>@ {entity.company}</span>}
                  </>
                )}
                {entity.type === 'company' && (
                  <>
                    {entity.domain && <span>{entity.domain}</span>}
                    {entity.industry && <span>{entity.industry}</span>}
                    {entity.city && entity.state && <span>{entity.city}, {entity.state}</span>}
                  </>
                )}
              </div>
            )}
          </header>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Analyses</div>
                <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Successful</div>
                <div className="text-2xl font-bold text-green-600">{stats.completedAnalyses}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Failed</div>
                <div className="text-2xl font-bold text-red-600">{stats.erroredAnalyses}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Avg. Duration</div>
                <div className="text-2xl font-bold">{formatDuration(stats.averageDuration || undefined)}</div>
              </Card>
            </div>
          )}

          {/* Score Trend Mini Chart */}
          {scoreTrend.length > 1 && (
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Score Trend
              </h3>
              <div className="flex items-end gap-2 h-24">
                {scoreTrend.map((point, idx) => {
                  const maxScore = Math.max(...scoreTrend.map(s => s.score || 0));
                  const height = maxScore > 0 ? ((point.score || 0) / maxScore) * 100 : 0;
                  const prevScore = idx > 0 ? scoreTrend[idx - 1].score : point.score;
                  const isUp = point.score >= prevScore;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isUp ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-muted-foreground">v{point.version}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Separator className="mb-8" />

          {/* Timeline */}
          <div className="space-y-0">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Analysis Timeline
            </h2>

            {timeline.length === 0 ? (
              <Card className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Analyses Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Run your first analysis to start tracking changes over time.
                </p>
                <Button onClick={handleRerunAnalysis} disabled={isRerunning}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                {timeline.map((entry, idx) => {
                  const isExpanded = expandedEntry === entry.id;
                  const isFirst = idx === 0;
                  const scoreChange = entry.changeDetection?.scoreChange;
                  
                  return (
                    <div key={entry.id} className="relative pl-16 pb-8">
                      {/* Timeline dot */}
                      <div className={`absolute left-5 w-5 h-5 rounded-full border-2 ${
                        entry.status === 'complete' 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-red-500 border-red-500'
                      }`}>
                        {entry.status === 'complete' ? (
                          <CheckCircle2 className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                        ) : (
                          <XCircle className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>

                      {/* Entry content */}
                      <Card className={`p-4 ${isFirst ? 'border-blue-500 border-2' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={isFirst ? 'default' : 'outline'}>
                                Version {entry.version}
                              </Badge>
                              {isFirst && (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  Latest
                                </Badge>
                              )}
                              {entry.status === 'error' && (
                                <Badge variant="destructive">Error</Badge>
                              )}
                              {entry.changeDetection?.hasChanges && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Changes Detected
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-muted-foreground mb-2">
                              {formatDate(entry.completedAt)}
                            </div>

                            {/* Result summary */}
                            {entry.result && entry.status === 'complete' && (
                              <div className="flex flex-wrap gap-3 text-sm mb-3">
                                {entry.result.score !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold">Score: {entry.result.score}</span>
                                    {scoreChange !== undefined && scoreChange !== 0 && (
                                      <span className={`flex items-center ${getScoreChangeColor(scoreChange)}`}>
                                        {getScoreChangeIcon(scoreChange)}
                                        {Math.abs(scoreChange)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {entry.result.insightsCount > 0 && (
                                  <span className="flex items-center gap-1 text-purple-600">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    {entry.result.insightsCount} insights
                                  </span>
                                )}
                                {entry.result.risksCount > 0 && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <Shield className="h-3.5 w-3.5" />
                                    {entry.result.risksCount} risks
                                  </span>
                                )}
                                {entry.result.opportunitiesCount > 0 && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {entry.result.opportunitiesCount} opportunities
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Change summary */}
                            {entry.changeDetection?.summary && (
                              <p className="text-sm text-muted-foreground italic">
                                {entry.changeDetection.summary}
                              </p>
                            )}

                            {/* Error message */}
                            {entry.error && (
                              <p className="text-sm text-red-600">{entry.error}</p>
                            )}

                            {/* Expandable details */}
                            {isExpanded && entry.result?.full && (
                              <div className="mt-4 pt-4 border-t space-y-4">
                                {/* Insights */}
                                {entry.result.full.intelligence?.insights?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                      <Lightbulb className="h-4 w-4 text-purple-500" />
                                      Insights
                                    </h4>
                                    <ul className="space-y-1">
                                      {entry.result.full.intelligence.insights.slice(0, 3).map((insight: string, i: number) => (
                                        <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-purple-200">
                                          {insight}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Risks */}
                                {entry.result.full.intelligence?.riskFactors?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                      <Shield className="h-4 w-4 text-red-500" />
                                      Risk Factors
                                    </h4>
                                    <ul className="space-y-1">
                                      {entry.result.full.intelligence.riskFactors.slice(0, 3).map((risk: string, i: number) => (
                                        <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-red-200">
                                          {risk}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* New items in this analysis */}
                                {entry.changeDetection?.newInsights && entry.changeDetection.newInsights.length > 0 && (
                                  <div className="bg-green-50 dark:bg-green-950/20 rounded p-3">
                                    <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">
                                      New in this Analysis
                                    </h4>
                                    <ul className="space-y-1">
                                      {entry.changeDetection.newInsights.map((item, i) => (
                                        <li key={i} className="text-sm text-green-600 dark:text-green-400">
                                          + {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(entry.duration)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/intelligence/${entry.id}`)}
                            >
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Sales Intelligence Timeline</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function EntityTimelinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    }>
      <EntityTimelineContent />
    </Suspense>
  );
}


