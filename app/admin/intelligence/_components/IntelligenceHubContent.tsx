'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Brain,
  RotateCcw,
  Settings,
  Calendar,
  BarChart3,
  Layers,
  Lightbulb,
  Activity,
} from 'lucide-react';
import IntelligenceMap from '@/components/admin/IntelligenceMap';
import { IntelligenceConfigEditor } from '@/components/admin/IntelligenceConfigEditor';
import { useIntelligenceStore } from '@/lib/store/intelligenceStore';
import { useIntelligenceJobs } from '../_hooks/useIntelligenceJobs';
import { useIntelligenceAnalytics } from '../_hooks/useIntelligenceAnalytics';
import { OverviewTab } from './tabs/OverviewTab';
import { PipelineTab } from './tabs/PipelineTab';
import { InsightsTab } from './tabs/InsightsTab';
import { JobsTab } from './tabs/JobsTab';

export function IntelligenceHubContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Read filters from URL (with defaults)
  const timeRange = searchParams.get('timeRange') || '30d';
  const statusFilter = searchParams.get('status') || 'all';
  const entityTypeFilter = searchParams.get('entityType') || 'all';
  const activeTab = searchParams.get('tab') || 'overview';
  const showSettings = searchParams.get('settings') === 'true';
  
  // Simple URL update - native selects don't cause infinite loops
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const defaultValue = key === 'timeRange' ? '30d' : key === 'tab' ? 'overview' : key === 'settings' ? 'false' : 'all';
    
    if (value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);
  
  const setActiveTab = useCallback((tab: string) => {
    updateFilter('tab', tab);
  }, [updateFilter]);
  
  const toggleShowSettings = useCallback(() => {
    updateFilter('settings', (!showSettings).toString());
  }, [updateFilter, showSettings]);
  
  // Simple handler for native select
  const handleTimeRangeChange = useCallback((value: string) => {
    updateFilter('timeRange', value);
  }, [updateFilter]);
  
  // Use hooks with URL-based filters - load jobs first, analytics can load after
  const { jobs, loading: jobsLoading, refresh: refreshJobs, cancelJob, rerunJob, runningJobsCount } = useIntelligenceJobs({
    status: statusFilter,
    entityType: entityTypeFilter,
  });
  
  // Only load analytics when overview/pipeline/insights tabs are active (lazy load)
  const shouldLoadAnalytics = activeTab === 'overview' || activeTab === 'pipeline' || activeTab === 'insights';
  const { analytics, loading: analyticsLoading, refresh: refreshAnalytics } = useIntelligenceAnalytics(
    shouldLoadAnalytics ? timeRange : '30d' // Use default if not needed
  );
  
  // Mark as viewed in store - use useEffect to avoid calling during render
  useEffect(() => {
    useIntelligenceStore.getState().markAsViewed();
  }, []);
  
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshJobs(false),
      refreshAnalytics(true),
    ]);
  }, [refreshJobs, refreshAnalytics]);
  
  const stats = {
    total: jobs.length,
    running: runningJobsCount,
    complete: jobs.filter(j => j.status === 'complete').length,
    error: jobs.filter(j => j.status === 'error').length,
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              Intelligence Hub
            </h1>
            <p className="text-slate-400 mt-2">
              Strategic insights and analytics across your entire sales pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="h-9 w-[140px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${jobsLoading || analyticsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={toggleShowSettings}
              className={`gap-2 ${showSettings ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : ''}`}
            >
              <Settings className="h-4 w-4" />
              {showSettings ? 'Hide Settings' : 'AI Settings'}
            </Button>
          </div>
        </div>

        {/* AI Agent Settings Panel */}
        {showSettings && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                Intelligence Agent Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Customize the AI agent prompts, analysis types, research instructions, and output schemas.
                Changes will apply to future intelligence runs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntelligenceConfigEditor />
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4" />
              Strategic Overview
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-slate-700">
              <Layers className="h-4 w-4" />
              Pipeline Analysis
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2 data-[state=active]:bg-slate-700">
              <Lightbulb className="h-4 w-4" />
              Portfolio Insights
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-slate-700">
              <Activity className="h-4 w-4" />
              Analysis Jobs
              {stats.running > 0 && (
                <Badge className="ml-1 bg-blue-500/20 text-blue-400 border-0">
                  {stats.running}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {shouldLoadAnalytics ? (
              <OverviewTab analytics={analytics} loading={analyticsLoading} />
            ) : (
              <div className="text-center py-10 text-slate-400">Loading analytics...</div>
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6 mt-6">
            {shouldLoadAnalytics ? (
              <PipelineTab analytics={analytics} loading={analyticsLoading} />
            ) : (
              <div className="text-center py-10 text-slate-400">Loading analytics...</div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            {shouldLoadAnalytics ? (
              <InsightsTab analytics={analytics} loading={analyticsLoading} />
            ) : (
              <div className="text-center py-10 text-slate-400">Loading analytics...</div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-6">
            <JobsTab
              jobs={jobs}
              loading={jobsLoading}
              onCancelJob={cancelJob}
              onRerunJob={rerunJob}
              onRefresh={() => refreshJobs(false)}
              statusFilter={statusFilter}
              entityTypeFilter={entityTypeFilter}
              onStatusFilterChange={(value) => updateFilter('status', value)}
              onEntityTypeFilterChange={(value) => updateFilter('entityType', value)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

