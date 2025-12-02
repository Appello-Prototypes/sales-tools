'use client';

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, getGradeColor } from '../../_lib/utils';
import type { PipelineStageData, PipelineData } from '../../_lib/types';

interface PipelineFunnelProps {
  stages: PipelineStageData[];
  pipelines: PipelineData[];
}

export function PipelineFunnel({ stages, pipelines }: PipelineFunnelProps) {
  // Group stages by pipeline
  const stagesByPipeline = useMemo(() => {
    const grouped: Record<string, PipelineStageData[]> = {};
    stages.forEach(stage => {
      const pipelineId = stage.pipeline || 'unknown';
      if (!grouped[pipelineId]) {
        grouped[pipelineId] = [];
      }
      grouped[pipelineId].push(stage);
    });
    
    // Sort stages within each pipeline by displayOrder
    Object.keys(grouped).forEach(pipelineId => {
      grouped[pipelineId].sort((a, b) => a.displayOrder - b.displayOrder);
    });
    
    return grouped;
  }, [stages]);

  // Get max value for scaling
  const maxValue = Math.max(...stages.map(s => s.totalValue), 1);

  // Get pipeline label
  const getPipelineLabel = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline?.label || pipelineId;
  };

  // Stage colors based on position (gradient from early to late stages)
  const getStageColor = (index: number, total: number) => {
    const colors = [
      'from-slate-600 to-slate-500',     // Early
      'from-blue-600 to-blue-500',       // Discovery  
      'from-cyan-600 to-cyan-500',       // Qualified
      'from-teal-600 to-teal-500',       // Proposal
      'from-emerald-600 to-emerald-500', // Contract
      'from-green-600 to-green-500',     // Closing
    ];
    const colorIndex = Math.min(Math.floor((index / Math.max(total - 1, 1)) * (colors.length - 1)), colors.length - 1);
    return colors[colorIndex];
  };

  return (
    <div className="space-y-8">
      {Object.entries(stagesByPipeline).map(([pipelineId, pipelineStages]) => (
        <div key={pipelineId} className="space-y-4">
          {/* Pipeline Header */}
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              {getPipelineLabel(pipelineId)}
            </h4>
            <div className="text-xs text-slate-500">
              {pipelineStages.reduce((sum, s) => sum + s.count, 0)} deals • {formatCurrency(pipelineStages.reduce((sum, s) => sum + s.totalValue, 0))}
            </div>
          </div>
          
          {/* Funnel Visualization */}
          <div className="relative">
            {/* Stage Bars */}
            <div className="flex flex-col gap-2">
              {pipelineStages.map((stage, index) => {
                const widthPercent = Math.max((stage.totalValue / maxValue) * 100, 15);
                const stageColor = getStageColor(index, pipelineStages.length);
                
                return (
                  <div key={`${pipelineId}-${stage.stage}`} className="flex items-center gap-3">
                    {/* Stage Label */}
                    <div className="w-40 flex-shrink-0 text-right">
                      <span className="text-sm font-medium text-slate-300">{stage.stageLabel}</span>
                    </div>
                    
                    {/* Bar Container */}
                    <div className="flex-1 flex items-center gap-4">
                      {/* Value Bar */}
                      <div className="flex-1 h-8 bg-slate-800/50 rounded-lg overflow-hidden relative">
                        <div 
                          className={`h-full bg-gradient-to-r ${stageColor} transition-all duration-500 ease-out flex items-center justify-end pr-3`}
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="text-xs font-semibold text-white drop-shadow-sm">
                            {formatCurrency(stage.totalValue)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Deal Count Indicator */}
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-700/50 border border-slate-600/50">
                              <span className="text-xs font-bold text-slate-200">{stage.count}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${getGradeColor(stage.avgGrade)}`}>
                                {stage.avgGrade}
                              </span>
                              <span className="text-[10px] text-slate-500">avg</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{stage.count} deals in {stage.stageLabel}</p>
                            <p className="text-xs text-slate-400">
                              Average Score: {stage.avgScore} ({stage.avgGrade})
                            </p>
                            <p className="text-xs text-slate-400">
                              Total Value: {formatCurrency(stage.totalValue)}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Flow Arrows */}
            <div className="absolute left-40 top-0 bottom-0 w-px bg-gradient-to-b from-slate-600 via-cyan-500/50 to-emerald-500/50 opacity-30" />
          </div>
        </div>
      ))}
    </div>
  );
}

