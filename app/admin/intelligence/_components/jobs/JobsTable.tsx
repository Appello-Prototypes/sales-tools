'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
  DollarSign,
  History,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import { STATUS_CONFIG } from '../../_lib/constants';
import { getPriorityConfig, getHealthConfig } from '../../_lib/constants';
import { formatDuration, getGradeColor, getEntityIcon, getEntityLink } from '../../_lib/utils';
import { groupJobsByEntity } from '../../_lib/utils';
import type { IntelligenceJob, EntityGroup } from '../../_lib/types';
import { useJobSelection } from '../../_hooks/useJobSelection';

interface JobsTableProps {
  jobs: IntelligenceJob[];
  loading: boolean;
  onCancelJob: (jobId: string) => Promise<void>;
  onRerunJob: (job: IntelligenceJob) => Promise<void>;
  errorJobsCount: number;
}

export function JobsTable({ jobs, loading, onCancelJob, onRerunJob, errorJobsCount }: JobsTableProps) {
  const router = useRouter();
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [rerunningJobIds, setRerunningJobIds] = useState<Set<string>>(new Set());
  
  // Log when jobs change for debugging
  React.useEffect(() => {
    console.log('[JobsTable] Jobs updated:', {
      count: jobs.length,
      statuses: jobs.reduce((acc, j) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      loading,
    });
  }, [jobs.length, loading]);
  
  const { selectedJobs, toggleJobSelection, toggleSelectAll, clearSelection, isSelected } = useJobSelection(jobs);
  
  const entityGroups = groupJobsByEntity(jobs);
  const errorJobs = jobs.filter(j => j.status === 'error');
  
  const toggleEntityExpansion = (entityKey: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityKey)) {
        next.delete(entityKey);
      } else {
        next.add(entityKey);
      }
      return next;
    });
  };
  
  const handleRerunJob = async (job: IntelligenceJob) => {
    setRerunningJobIds(prev => new Set([...prev, job.id]));
    try {
      await onRerunJob(job);
    } finally {
      setRerunningJobIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };
  
  const handleBatchRerun = async () => {
    if (selectedJobs.size === 0) return;
    
    const selectedJobsList = jobs.filter(j => selectedJobs.has(j.id) && j.status === 'error');
    const delayBetweenJobs = 2000;
    
    for (let i = 0; i < selectedJobsList.length; i++) {
      const job = selectedJobsList[i];
      setRerunningJobIds(prev => new Set([...prev, job.id]));
      
      try {
        const response = await fetch('/api/admin/intelligence/batch-rerun', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobs: [{
              entityType: job.entityType,
              entityId: job.entityId,
              entityName: job.entityName,
            }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to re-run job ${job.id}:`, error);
        }
      } catch (error) {
        console.error(`Error re-running job ${job.id}:`, error);
      }
      
      setRerunningJobIds(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
      
      if (i < selectedJobsList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenJobs));
      }
    }
    
    clearSelection();
  };
  
  const EntityIcon = ({ entityType }: { entityType: string }) => {
    const Icon = getEntityIcon(entityType);
    return <Icon className="h-4 w-4" />;
  };
  
  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-slate-400 mt-2">Loading jobs...</p>
          <p className="text-xs text-slate-500 mt-1">Check browser console (F12) for detailed logs</p>
        </div>
      </Card>
    );
  }
  
  if (entityGroups.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-slate-500">
          No jobs found matching your filters.
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      {selectedJobs.size > 0 && (
        <div className="mb-4 flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <span className="text-sm text-slate-300">
            {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button
              onClick={handleBatchRerun}
              disabled={rerunningJobIds.size > 0}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {rerunningJobIds.size > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-run Selected ({selectedJobs.size})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedJobs.size > 0 && selectedJobs.size === errorJobs.length && errorJobs.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all failed jobs"
                  className="border-slate-600"
                />
              </TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Deal Stage</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Deal Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entityGroups.map((group) => {
              const job = group.latestJob;
              const statusConfig = STATUS_CONFIG[job.status];
              const StatusIcon = statusConfig.icon;
              const dealScore = job.dealDetails?.dealScore;
              const priorityConfig = dealScore ? getPriorityConfig(dealScore.priority) : null;
              const healthConfig = dealScore ? getHealthConfig(dealScore.healthIndicator) : null;
              const isExpanded = expandedEntities.has(group.entityKey);
              const hasRevisions = group.totalRevisions > 0;
              
              return (
                <React.Fragment key={group.entityKey}>
                  {/* Main row for latest job */}
                  <TableRow className={hasRevisions ? 'cursor-pointer hover:bg-slate-800/50' : ''}>
                    {/* Selection checkbox */}
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      {job.status === 'error' && (
                        <Checkbox
                          checked={isSelected(job.id)}
                          onCheckedChange={() => toggleJobSelection(job.id)}
                          aria-label={`Select job for ${job.entityName}`}
                          className="border-slate-600"
                          disabled={rerunningJobIds.has(job.id)}
                        />
                      )}
                    </TableCell>
                    {/* Expand/Collapse button */}
                    <TableCell className="w-8 pr-0">
                      {hasRevisions ? (
                        <button
                          onClick={() => toggleEntityExpansion(group.entityKey)}
                          className="p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <EntityIcon entityType={job.entityType} />
                        <span>{job.entityName}</span>
                        {hasRevisions && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="text-xs gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEntityExpansion(group.entityKey);
                                }}
                              >
                                <History className="h-3 w-3" />
                                {group.totalRevisions}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {group.totalRevisions} previous run{group.totalRevisions > 1 ? 's' : ''} - click to {isExpanded ? 'hide' : 'show'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {job.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.entityType === 'deal' && job.dealDetails ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {job.dealDetails.stageLabel || job.dealDetails.dealstage || '—'}
                          </span>
                          {job.dealDetails.isClosed && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs w-fit ${job.dealDetails.isWon ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}
                            >
                              {job.dealDetails.isWon ? 'Won' : 'Lost'}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.entityType === 'deal' && job.dealDetails ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-green-500" />
                          <span className="font-medium text-green-400">
                            {job.dealDetails.amountFormatted || '$0'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.entityType === 'deal' && dealScore ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-lg font-bold ${getGradeColor(dealScore.grade)}`}>
                                  {dealScore.grade}
                                </span>
                                <span className="text-sm text-slate-500">
                                  ({dealScore.totalScore})
                                </span>
                              </div>
                              {priorityConfig && (
                                <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0 text-xs`}>
                                  {dealScore.priority}
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs p-0 bg-slate-900 border border-slate-700">
                            <div className="p-3 space-y-3">
                              <div className="font-semibold text-slate-100 border-b border-slate-700 pb-2">
                                Deal Score Breakdown
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                <span className="text-slate-400">Stage Progress:</span>
                                <span className="text-slate-200 font-medium">{dealScore.breakdown.stageScore}/25</span>
                                <span className="text-slate-400">Deal Value:</span>
                                <span className="text-slate-200 font-medium">{dealScore.breakdown.valueScore}/25</span>
                                <span className="text-slate-400">Timeline:</span>
                                <span className="text-slate-200 font-medium">{dealScore.breakdown.timelineScore}/20</span>
                                <span className="text-slate-400">Activity:</span>
                                <span className="text-slate-200 font-medium">{dealScore.breakdown.activityScore}/15</span>
                                <span className="text-slate-400">Associations:</span>
                                <span className="text-slate-200 font-medium">{dealScore.breakdown.associationScore}/15</span>
                              </div>
                              {healthConfig && (
                                <div className="pt-2 border-t border-slate-700">
                                  <Badge className={`${healthConfig.bgColor} ${healthConfig.color} border-0 text-xs`}>
                                    Health: {dealScore.healthIndicator}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 gap-1`}>
                        <StatusIcon className={`h-3 w-3 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {job.startedAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {formatDuration(job.startedAt, job.completedAt)}
                    </TableCell>
                    <TableCell>
                      {job.stats && (
                        <span className="text-sm text-slate-500">
                          {job.stats.iterations} iter • {job.stats.toolCalls} tools
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === 'running' || job.status === 'pending') && (
                          <Button variant="outline" size="sm" onClick={() => onCancelJob(job.id)}>
                            Cancel
                          </Button>
                        )}
                        {job.status === 'error' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRerunJob(job)}
                            disabled={rerunningJobIds.has(job.id)}
                            className="gap-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                          >
                            {rerunningJobIds.has(job.id) ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3" />
                                Retry
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/intelligence/${job.id}`)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Report
                        </Button>
                        <a
                          href={getEntityLink(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Nested revision rows (when expanded) */}
                  {isExpanded && group.revisions.map((revJob) => {
                    const revStatusConfig = STATUS_CONFIG[revJob.status];
                    const RevStatusIcon = revStatusConfig.icon;
                    
                    return (
                      <TableRow 
                        key={revJob.id} 
                        className="bg-slate-800/30 border-l-2 border-l-purple-500/50"
                      >
                        <TableCell className="w-10"></TableCell>
                        <TableCell className="w-8 pr-0">
                          <div className="flex items-center justify-center">
                            <GitBranch className="h-3 w-3 text-purple-400 rotate-180" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 pl-2">
                            <span className="text-slate-500 text-sm">
                              Run #{group.totalRevisions - group.revisions.indexOf(revJob)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-xs">—</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-xs">—</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-xs">—</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-xs">—</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${revStatusConfig.bgColor} ${revStatusConfig.color} border-0 gap-1 text-xs`}>
                            <RevStatusIcon className={`h-3 w-3 ${revJob.status === 'running' ? 'animate-spin' : ''}`} />
                            {revStatusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {revJob.startedAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDuration(revJob.startedAt, revJob.completedAt)}
                        </TableCell>
                        <TableCell>
                          {revJob.stats && (
                            <span className="text-xs text-slate-600">
                              {revJob.stats.iterations} iter • {revJob.stats.toolCalls} tools
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/intelligence/${revJob.id}`)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

