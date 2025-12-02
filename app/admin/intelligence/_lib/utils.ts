import { User, Building2, TrendingUp, Brain } from 'lucide-react';
import type { JobLog, IntelligenceJob, EntityGroup } from './types';
import { getContactLinkClient, getCompanyLinkClient, getDealLinkClient } from '@/lib/hubspot/hubspotLinks';

export function getToolCallsFromLogs(logs: JobLog[] = []): string[] {
  const toolCalls: string[] = [];
  logs.forEach(log => {
    if (log.step?.toLowerCase().includes('tool') || log.message?.toLowerCase().includes('tool')) {
      toolCalls.push(log.message || log.step);
    }
    if (log.data?.tool) toolCalls.push(log.data.tool);
    if (log.data?.toolName) toolCalls.push(log.data.toolName);
  });
  return [...new Set(toolCalls)].slice(0, 10);
}

export function getIterationSteps(logs: JobLog[] = []): { step: string; status: string }[] {
  const steps: { step: string; status: string }[] = [];
  logs.forEach(log => {
    if (log.step && !log.step.toLowerCase().includes('tool')) {
      steps.push({ step: log.step, status: log.status });
    }
  });
  return steps.slice(0, 15);
}

export function getKeyFindings(result?: IntelligenceJob['result']): { type: string; items: string[] }[] {
  if (!result) return [];
  const findings: { type: string; items: string[] }[] = [];
  if (result.insights?.length) findings.push({ type: 'Insights', items: result.insights.slice(0, 3) });
  if (result.riskFactors?.length) findings.push({ type: 'Risks', items: result.riskFactors.slice(0, 3) });
  if (result.opportunitySignals?.length) findings.push({ type: 'Opportunities', items: result.opportunitySignals.slice(0, 3) });
  if (result.recommendedActions?.length) findings.push({ type: 'Actions', items: result.recommendedActions.slice(0, 3) });
  return findings;
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+': case 'A': return 'text-emerald-500';
    case 'B+': case 'B': return 'text-blue-500';
    case 'C+': case 'C': return 'text-amber-500';
    case 'D': return 'text-orange-500';
    case 'F': return 'text-red-500';
    default: return 'text-slate-500';
  }
}

export function groupJobsByEntity(jobs: IntelligenceJob[]): EntityGroup[] {
  const groupMap = new Map<string, IntelligenceJob[]>();
  
  // Group all jobs by entity key (entityType:entityId)
  jobs.forEach(job => {
    const key = `${job.entityType}:${job.entityId}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(job);
  });
  
  // Convert to EntityGroup array
  const groups: EntityGroup[] = [];
  
  groupMap.forEach((entityJobs, key) => {
    // Sort jobs by startedAt descending (newest first)
    const sortedJobs = [...entityJobs].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    
    const latestJob = sortedJobs[0];
    const revisions = sortedJobs.slice(1);
    
    groups.push({
      entityKey: key,
      entityType: latestJob.entityType,
      entityId: latestJob.entityId,
      entityName: latestJob.entityName,
      latestJob,
      revisions,
      totalRevisions: revisions.length,
    });
  });
  
  // Sort groups by latest job's startedAt (newest first)
  groups.sort((a, b) => 
    new Date(b.latestJob.startedAt).getTime() - new Date(a.latestJob.startedAt).getTime()
  );
  
  return groups;
}

export function getEntityIcon(entityType: string) {
  switch (entityType) {
    case 'contact': return User;
    case 'company': return Building2;
    case 'deal': return TrendingUp;
    default: return Brain;
  }
}

export function getEntityLink(job: IntelligenceJob): string {
  switch (job.entityType) {
    case 'contact': return getContactLinkClient(job.entityId);
    case 'company': return getCompanyLinkClient(job.entityId);
    case 'deal': return getDealLinkClient(job.entityId);
    default: return '#';
  }
}

export function formatDuration(start: Date, end?: Date): string {
  const endTime = end || new Date();
  const diff = endTime.getTime() - start.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

