'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, DollarSign, Gauge, Flame, Target, PieChart, Activity, Shield, BarChart3, AlertTriangle } from 'lucide-react';
import { MetricCard } from '../cards/MetricCard';
import { PriorityBar } from '../pipeline/PriorityBar';
import { ActivityChart } from '../cards/ActivityChart';
import { formatCurrency, getGradeColor } from '../../_lib/utils';
import { getPriorityConfig, getHealthConfig } from '../../_lib/constants';
import type { AnalyticsData } from '../../_lib/types';

interface OverviewTabProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export function OverviewTab({ analytics, loading }: OverviewTabProps) {
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-500 mb-4" />
          <p className="text-slate-400">Loading strategic analytics...</p>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
    return (
      <div className="text-center py-20 text-slate-500">
        <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p>No analytics data available. Run intelligence analyses to populate insights.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(analytics.overview.totalPipelineValue)}
          subtitle={`${analytics.overview.openDealsCount} active deals`}
          icon={DollarSign}
          color="green"
          large
        />
        <MetricCard
          title="Weighted Pipeline"
          value={formatCurrency(analytics.overview.weightedPipelineValue)}
          subtitle="Score-adjusted forecast"
          icon={Gauge}
          color="blue"
          large
        />
        <MetricCard
          title="Hot Deals Value"
          value={formatCurrency(analytics.overview.hotDealsValue)}
          subtitle={`${analytics.priorityDistribution.hot} high-priority deals`}
          icon={Flame}
          color="red"
          large
        />
        <MetricCard
          title="Average Deal Score"
          value={analytics.overview.avgDealScore}
          subtitle="Portfolio health indicator"
          icon={Target}
          color="purple"
          large
        />
      </div>

      {/* Priority Distribution & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-400" />
              Deal Priority Distribution
            </h3>
            <Badge variant="outline">
              {analytics.overview.totalAnalyzedDeals} deals analyzed
            </Badge>
          </div>
          <PriorityBar data={analytics.priorityDistribution} />
        </Card>

        {/* Analysis Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" />
              Analysis Activity
            </h3>
            <span className="text-xs text-slate-500">Last 30 days</span>
          </div>
          <ActivityChart data={analytics.activityTimeline} />
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </Card>
      </div>

      {/* Health & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-slate-400" />
            Pipeline Health Overview
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.healthDistribution).map(([health, data]) => {
              const config = getHealthConfig(health);
              const percentage = analytics.overview.openDealsCount > 0 
                ? (data.count / analytics.overview.openDealsCount) * 100 
                : 0;
              return (
                <div key={health} className="flex items-center gap-3">
                  <div className={`w-20 text-sm ${config.color}`}>{health}</div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <div className="w-16 text-right text-sm text-slate-400">
                    {data.count} ({percentage.toFixed(0)}%)
                  </div>
                  <div className="w-24 text-right text-sm text-slate-300">
                    {formatCurrency(data.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Grade Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            Deal Grade Distribution
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(grade => {
              const data = analytics.gradeDistribution[grade] || { count: 0, value: 0 };
              return (
                <div key={grade} className="text-center p-3 rounded-lg bg-slate-800/50">
                  <div className={`text-2xl font-bold ${getGradeColor(grade)}`}>
                    {data.count}
                  </div>
                  <div className="text-sm text-slate-400">{grade}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatCurrency(data.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Deals Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Value */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Top Deals by Value
          </h3>
          <div className="space-y-2">
            {analytics.topDealsByValue.slice(0, 5).map((deal, i) => {
              const priorityConfig = getPriorityConfig(deal.priority);
              return (
                <div 
                  key={`${deal.dealId}-${deal.jobId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/intelligence/${deal.jobId}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{deal.dealName}</div>
                      <div className="text-xs text-slate-500">
                        {deal.stageLabel}
                        {deal.dealtype && <span className="text-slate-600"> • {deal.dealtype}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0`}>
                      {deal.priority}
                    </Badge>
                    <span className="text-lg font-semibold text-emerald-400">
                      {deal.amountFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* At Risk Deals */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            At-Risk Deals
          </h3>
          {analytics.atRiskDeals.length > 0 ? (
            <div className="space-y-2">
              {analytics.atRiskDeals.slice(0, 5).map((deal) => (
                <div 
                  key={`${deal.dealId}-${deal.jobId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/intelligence/${deal.jobId}`)}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{deal.dealName}</div>
                      <div className="text-xs text-red-400">{deal.health}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getGradeColor(deal.grade)}`}>
                      {deal.grade}
                    </span>
                    <span className="text-sm text-slate-400">
                      {deal.amountFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No at-risk deals detected</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

