'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ChevronRight, ExternalLink } from 'lucide-react';
import { formatCurrency, getGradeColor } from '../../_lib/utils';
import { getPriorityConfig } from '../../_lib/constants';
import type { PipelineStageData } from '../../_lib/types';

interface CollapsibleStageDealsProps {
  stage: PipelineStageData;
  onDealClick: (dealId: string) => void;
}

export function CollapsibleStageDeals({ stage, onDealClick }: CollapsibleStageDealsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleDeals = isExpanded ? stage.deals : stage.deals.slice(0, 5);
  const hasMore = stage.deals.length > 5;

  return (
    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
      {/* Stage Header */}
      <div 
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => hasMore && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {hasMore && (
              isExpanded ? 
                <ChevronDown className="h-4 w-4 text-slate-500" /> : 
                <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
            <h4 className="font-medium text-slate-200">{stage.stageLabel}</h4>
          </div>
          <Badge variant="outline" className="text-xs">
            {stage.count} deal{stage.count !== 1 ? 's' : ''}
          </Badge>
          {stage.pipelineLabel && stage.pipelineLabel !== stage.pipeline && (
            <Badge variant="outline" className="text-xs bg-slate-700/30 text-slate-400 border-slate-600">
              {stage.pipelineLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Avg Score</div>
            <div className={`font-bold ${getGradeColor(stage.avgGrade)}`}>
              {stage.avgGrade} ({stage.avgScore})
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Total Value</div>
            <div className="text-lg font-semibold text-emerald-400">
              {formatCurrency(stage.totalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-2">
        {visibleDeals.map((deal, idx) => {
          const priorityConfig = getPriorityConfig(deal.priority);
          return (
            <div 
              key={deal.id}
              className={`flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 cursor-pointer transition-colors group ${
                idx >= 5 ? 'animate-in fade-in slide-in-from-top-2 duration-200' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onDealClick(deal.id);
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full ${priorityConfig.bgColor.replace('/10', '')}`} />
                <span className="text-sm text-slate-300 truncate">{deal.name}</span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className={`text-sm font-medium ${getGradeColor(deal.grade)}`}>
                  {deal.grade}
                </span>
                <span className="text-sm font-medium text-emerald-400 w-24 text-right">
                  {formatCurrency(deal.amount)}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 border-t border-slate-700/30"
        >
          {isExpanded ? (
            <span className="flex items-center justify-center gap-1">
              <ChevronUp className="h-3 w-3" /> Show less
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <ChevronDown className="h-3 w-3" /> Show {stage.deals.length - 5} more deals
            </span>
          )}
        </button>
      )}
    </div>
  );
}

