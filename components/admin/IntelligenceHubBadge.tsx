'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Brain, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useIntelligenceStore, useIntelligencePolling } from '@/lib/store/intelligenceStore';
import { useRouter } from 'next/navigation';

export function IntelligenceHubBadge() {
  const router = useRouter();
  // Get specific values from store to avoid re-renders on store reference changes
  const runningCount = useIntelligenceStore((state) => state.runningCount);
  const pendingCount = useIntelligenceStore((state) => state.pendingCount);
  const completedSinceLastView = useIntelligenceStore((state) => state.completedSinceLastView);
  const getRunningJobs = useIntelligenceStore((state) => state.getRunningJobs);
  const getCompletedJobs = useIntelligenceStore((state) => state.getCompletedJobs);
  const markAsViewed = useIntelligenceStore((state) => state.markAsViewed);
  
  const { startPolling, stopPolling, isPolling } = useIntelligencePolling();
  const [isOpen, setIsOpen] = useState(false);
  const initializedRef = useRef(false);

  // Fetch jobs on mount to initialize the badge - runs only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const fetchInitialJobs = async () => {
      try {
        // Fetch all recent jobs (running + recent completed)
        const response = await fetch('/api/admin/intelligence?limit=20');
        if (response.ok) {
          const data = await response.json();
          const jobs = (data.jobs || []).map((j: any) => ({
            id: j._id || j.id,
            entityType: j.entityType,
            entityId: j.entityId,
            entityName: j.entityName,
            status: j.status,
            result: j.result,
            error: j.error,
            startedAt: new Date(j.startedAt),
            completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
            stats: j.stats,
          }));
          // Use mergeJobs to avoid overwriting other jobs
          useIntelligenceStore.getState().mergeJobs(jobs);
        }
      } catch (error) {
        console.error('Error fetching initial jobs:', error);
      }
    };

    fetchInitialJobs();
  }, []); // Empty deps - runs once on mount

  // Start polling when there are running jobs
  useEffect(() => {
    if (runningCount > 0 && !isPolling) {
      startPolling();
    } else if (runningCount === 0 && isPolling) {
      stopPolling();
    }
  }, [runningCount, isPolling, startPolling, stopPolling]);

  // Refresh jobs when dropdown opens - fetch ALL jobs to get accurate counts
  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch all recent jobs (not just running) to get accurate counts
    fetch('/api/admin/intelligence?limit=50')
      .then(res => res.json())
      .then(data => {
        const jobs = (data.jobs || []).map((j: any) => ({
          id: j._id || j.id,
          entityType: j.entityType,
          entityId: j.entityId,
          entityName: j.entityName,
          status: j.status,
          result: j.result,
          error: j.error,
          startedAt: new Date(j.startedAt),
          completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
          stats: j.stats,
        }));
        // Use setJobs to completely refresh the store with accurate counts
        useIntelligenceStore.getState().setJobs(jobs);
      })
      .catch(err => console.error('Error fetching jobs:', err));
  }, [isOpen]); // Only depends on isOpen

  const totalActive = runningCount + pendingCount;
  const hasNewCompletions = completedSinceLastView > 0;

  const runningJobs = getRunningJobs().slice(0, 5);
  const recentCompleted = getCompletedJobs()
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 3);

  const handleViewHub = () => {
    markAsViewed();
    setIsOpen(false);
    router.push('/admin/intelligence');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 px-2 gap-2"
          title="Intelligence Hub"
        >
          <Brain className={`h-4 w-4 ${totalActive > 0 ? 'text-blue-500' : ''}`} />
          {totalActive > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs animate-pulse"
            >
              {totalActive}
            </Badge>
          )}
          {hasNewCompletions && totalActive === 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>AI Intelligence</span>
          {totalActive > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalActive} active
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {runningJobs.length > 0 ? (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Running Jobs
            </div>
            {runningJobs.map((job) => (
              <DropdownMenuItem
                key={job.id}
                className="flex items-start gap-2 py-2 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <Loader2 className="h-3 w-3 mt-0.5 animate-spin text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{job.entityName}</div>
                  <div className="text-xs text-muted-foreground">
                    {job.entityType} • {job.status}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : recentCompleted.length === 0 ? (
          <>
            <div className="px-2 py-3 text-sm text-center text-muted-foreground">
              No active AI jobs
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {recentCompleted.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Recent Completions
            </div>
            {recentCompleted.map((job) => (
              <DropdownMenuItem
                key={job.id}
                className="flex items-start gap-2 py-2 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                {job.error ? (
                  <AlertCircle className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{job.entityName}</div>
                  <div className="text-xs text-muted-foreground">
                    {job.entityType} • {job.completedAt?.toLocaleTimeString()}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={handleViewHub}
          className="cursor-pointer"
        >
          <Brain className="h-4 w-4 mr-2" />
          View Intelligence Hub
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

