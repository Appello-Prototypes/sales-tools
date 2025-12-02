'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Layers, Map as MapIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { PipelineFunnel } from '../pipeline/PipelineFunnel';
import { CollapsibleStageDeals } from '../pipeline/CollapsibleStageDeals';
import { formatCurrency } from '../../_lib/utils';
import type { AnalyticsData } from '../../_lib/types';
import IntelligenceMap from '@/components/admin/IntelligenceMap';

interface PipelineTabProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export function PipelineTab({ analytics, loading }: PipelineTabProps) {
  const router = useRouter();
  const [showMap, setShowMap] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  
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
    <div className="space-y-6">
      {/* Pipeline Funnel Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Pipeline Flow
          <Badge variant="outline" className="ml-auto text-slate-400">
            {analytics.pipelineStages.reduce((sum, s) => sum + s.count, 0)} deals • {formatCurrency(analytics.pipelineStages.reduce((sum, s) => sum + s.totalValue, 0))}
          </Badge>
        </h3>
        {analytics.pipelineStages.length > 0 ? (
          <PipelineFunnel 
            stages={analytics.pipelineStages} 
            pipelines={analytics.pipelines || []} 
          />
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No pipeline data available</p>
          </div>
        )}
      </Card>

      {/* Pipeline Stages - Detailed View with Collapsible Deals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
          <Layers className="h-5 w-5 text-slate-400" />
          Pipeline Stage Analysis
        </h3>
        <div className="space-y-4">
          {analytics.pipelineStages.length > 0 ? (
            analytics.pipelineStages.map(stage => (
              <CollapsibleStageDeals 
                key={`${stage.pipeline}-${stage.stage}`}
                stage={stage}
                onDealClick={(dealId) => router.push(`/admin/crm/deals/${dealId}`)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No stage data available. Run deal intelligence analyses to populate.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Deal Flow Map */}
      <div className="space-y-2">
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
        >
          <MapIcon className="h-4 w-4" />
          <span>Geographic Deal Map</span>
          {showMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showMap && (
          <IntelligenceMap isExpanded={mapExpanded} onToggleExpand={() => setMapExpanded(!mapExpanded)} />
        )}
      </div>
    </div>
  );
}

