'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Sparkles, Rocket, Lightbulb } from 'lucide-react';
import { InsightCard } from '../cards/InsightCard';
import type { AnalyticsData } from '../../_lib/types';

interface InsightsTabProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export function InsightsTab({ analytics, loading }: InsightsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }
  
  if (!analytics) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risks */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Common Risk Factors
          <Badge variant="outline" className="ml-auto">
            {analytics.aggregatedInsights.risks.length} identified
          </Badge>
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {analytics.aggregatedInsights.risks.length > 0 ? (
            analytics.aggregatedInsights.risks.map((risk, i) => (
              <InsightCard key={i} insight={risk} type="risk" />
            ))
          ) : (
            <p className="text-center py-8 text-slate-500">No common risks identified</p>
          )}
        </div>
      </Card>

      {/* Opportunities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          Opportunity Signals
          <Badge variant="outline" className="ml-auto">
            {analytics.aggregatedInsights.opportunities.length} identified
          </Badge>
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {analytics.aggregatedInsights.opportunities.length > 0 ? (
            analytics.aggregatedInsights.opportunities.map((opp, i) => (
              <InsightCard key={i} insight={opp} type="opportunity" />
            ))
          ) : (
            <p className="text-center py-8 text-slate-500">No opportunity signals identified</p>
          )}
        </div>
      </Card>

      {/* Recommended Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <Rocket className="h-5 w-5 text-purple-400" />
          Recommended Actions
          <Badge variant="outline" className="ml-auto">
            {analytics.aggregatedInsights.actions.length} actions
          </Badge>
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {analytics.aggregatedInsights.actions.length > 0 ? (
            analytics.aggregatedInsights.actions.map((action, i) => (
              <InsightCard key={i} insight={action} type="action" />
            ))
          ) : (
            <p className="text-center py-8 text-slate-500">No recommended actions yet</p>
          )}
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-blue-400" />
          Key Insights
          <Badge variant="outline" className="ml-auto">
            {analytics.aggregatedInsights.insights.length} insights
          </Badge>
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {analytics.aggregatedInsights.insights.length > 0 ? (
            analytics.aggregatedInsights.insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} type="insight" />
            ))
          ) : (
            <p className="text-center py-8 text-slate-500">No key insights yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}

