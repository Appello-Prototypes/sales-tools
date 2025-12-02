/**
 * Intelligence Store - Manages background AI intelligence jobs
 * 
 * Tracks all intelligence jobs running across the app, provides polling
 * for status updates, and manages notification state.
 */

import * as React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type IntelligenceJobStatus = 'pending' | 'running' | 'complete' | 'error' | 'cancelled';

export type EntityType = 'contact' | 'company' | 'deal';

export interface IntelligenceJob {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  status: IntelligenceJobStatus;
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  stats?: {
    iterations: number;
    toolCalls: number;
    duration?: number;
  };
}

export interface IntelligenceStore {
  // State
  jobs: Map<string, IntelligenceJob>;
  pendingCount: number;
  runningCount: number;
  completedSinceLastView: number; // New completions since user last viewed hub
  lastViewedAt: Date | null;
  isPolling: boolean;
  
  // Actions
  setJobs: (jobs: IntelligenceJob[]) => void;
  mergeJobs: (jobs: IntelligenceJob[]) => void; // Merge/update jobs without replacing all
  updateJob: (id: string, updates: Partial<IntelligenceJob>) => void;
  addJob: (job: IntelligenceJob) => void;
  removeJob: (id: string) => void;
  markAsViewed: () => void;
  setPolling: (isPolling: boolean) => void;
  
  // Selectors
  getJob: (id: string) => IntelligenceJob | undefined;
  getJobsByEntity: (entityType: EntityType, entityId: string) => IntelligenceJob[];
  getRunningJobs: () => IntelligenceJob[];
  getCompletedJobs: () => IntelligenceJob[];
  getAllJobs: () => IntelligenceJob[];
}

// ============================================================================
// Store
// ============================================================================

export const useIntelligenceStore = create<IntelligenceStore>()(
  persist(
    (set, get) => ({
      jobs: new Map(),
      pendingCount: 0,
      runningCount: 0,
      completedSinceLastView: 0,
      lastViewedAt: null,
      isPolling: false,
      
      setJobs: (jobs: IntelligenceJob[]) => {
        const jobsMap = new Map(jobs.map(job => [job.id, job]));
        const pendingCount = jobs.filter(j => j.status === 'pending').length;
        const runningCount = jobs.filter(j => j.status === 'running').length;
        
        // Calculate new completions since last view
        const lastViewedAt = get().lastViewedAt;
        let completedSinceLastView = 0;
        if (lastViewedAt) {
          completedSinceLastView = jobs.filter(
            j => j.status === 'complete' && 
            j.completedAt && 
            new Date(j.completedAt) > lastViewedAt
          ).length;
        } else {
          // If never viewed, count all completed jobs as "new"
          completedSinceLastView = jobs.filter(j => j.status === 'complete').length;
        }
        
        set({
          jobs: jobsMap,
          pendingCount,
          runningCount,
          completedSinceLastView,
        });
      },
      
      // Merge/update jobs without replacing existing ones - used by polling
      mergeJobs: (newJobs: IntelligenceJob[]) => {
        set((state) => {
          const mergedJobs = new Map(state.jobs);
          
          // Update or add new jobs
          newJobs.forEach(job => {
            mergedJobs.set(job.id, job);
          });
          
          // Recalculate counts from merged map
          const allJobs = Array.from(mergedJobs.values());
          const pendingCount = allJobs.filter(j => j.status === 'pending').length;
          const runningCount = allJobs.filter(j => j.status === 'running').length;
          
          // Calculate new completions since last view
          const lastViewedAt = state.lastViewedAt;
          let completedSinceLastView = state.completedSinceLastView;
          
          // Check if any of the new jobs are newly completed
          newJobs.forEach(job => {
            const existingJob = state.jobs.get(job.id);
            if (
              job.status === 'complete' && 
              existingJob?.status !== 'complete' &&
              job.completedAt
            ) {
              if (!lastViewedAt || new Date(job.completedAt) > lastViewedAt) {
                completedSinceLastView++;
              }
            }
          });
          
          return {
            jobs: mergedJobs,
            pendingCount,
            runningCount,
            completedSinceLastView,
          };
        });
      },
      
      updateJob: (id: string, updates: Partial<IntelligenceJob>) => {
        set((state) => {
          const job = state.jobs.get(id);
          if (!job) return state;
          
          const updatedJob = { ...job, ...updates };
          const newJobs = new Map(state.jobs);
          newJobs.set(id, updatedJob);
          
          // Recalculate counts
          const allJobs = Array.from(newJobs.values());
          const pendingCount = allJobs.filter(j => j.status === 'pending').length;
          const runningCount = allJobs.filter(j => j.status === 'running').length;
          
          // Check if this completion is new
          let completedSinceLastView = state.completedSinceLastView;
          if (updates.status === 'complete' && updates.completedAt) {
            const lastViewedAt = state.lastViewedAt;
            if (!lastViewedAt || new Date(updates.completedAt) > lastViewedAt) {
              completedSinceLastView = state.completedSinceLastView + 1;
            }
          }
          
          return {
            jobs: newJobs,
            pendingCount,
            runningCount,
            completedSinceLastView,
          };
        });
      },
      
      addJob: (job: IntelligenceJob) => {
        set((state) => {
          const newJobs = new Map(state.jobs);
          newJobs.set(job.id, job);
          
          const allJobs = Array.from(newJobs.values());
          const pendingCount = allJobs.filter(j => j.status === 'pending').length;
          const runningCount = allJobs.filter(j => j.status === 'running').length;
          
          return {
            jobs: newJobs,
            pendingCount,
            runningCount,
          };
        });
      },
      
      removeJob: (id: string) => {
        set((state) => {
          const newJobs = new Map(state.jobs);
          newJobs.delete(id);
          
          const allJobs = Array.from(newJobs.values());
          const pendingCount = allJobs.filter(j => j.status === 'pending').length;
          const runningCount = allJobs.filter(j => j.status === 'running').length;
          
          return {
            jobs: newJobs,
            pendingCount,
            runningCount,
          };
        });
      },
      
      markAsViewed: () => {
        set({
          lastViewedAt: new Date(),
          completedSinceLastView: 0,
        });
      },
      
      setPolling: (isPolling: boolean) => {
        set({ isPolling });
      },
      
      // Selectors
      getJob: (id: string) => get().jobs.get(id),
      
      getJobsByEntity: (entityType: EntityType, entityId: string) => {
        const allJobs = Array.from(get().jobs.values());
        return allJobs.filter(
          j => j.entityType === entityType && j.entityId === entityId
        );
      },
      
      getRunningJobs: () => {
        const allJobs = Array.from(get().jobs.values());
        return allJobs.filter(j => j.status === 'running' || j.status === 'pending');
      },
      
      getCompletedJobs: () => {
        const allJobs = Array.from(get().jobs.values());
        return allJobs.filter(j => j.status === 'complete');
      },
      
      getAllJobs: () => Array.from(get().jobs.values()),
    }),
    {
      name: 'intelligence-storage',
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert jobs array back to Map and restore Date objects
          if (parsed?.state?.jobs) {
            const jobEntries = parsed.state.jobs.map(([id, job]: [string, any]) => [
              id,
              {
                ...job,
                startedAt: job.startedAt ? new Date(job.startedAt) : new Date(),
                completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
              },
            ]);
            parsed.state.jobs = new Map(jobEntries);
          }
          // Convert dates
          if (parsed?.state?.lastViewedAt) {
            parsed.state.lastViewedAt = new Date(parsed.state.lastViewedAt);
          }
          return parsed;
        },
        setItem: (name, value: any) => {
          // Convert Map to array for serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              jobs: Array.from(value.state.jobs.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// ============================================================================
// Polling Hook
// ============================================================================

export function useIntelligencePolling() {
  const isPolling = useIntelligenceStore((state) => state.isPolling);
  
  // Use useRef to hold the polling timeout and abort controller so we can clean them up
  const pollingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  
  const startPolling = React.useCallback(() => {
    const state = useIntelligenceStore.getState();
    if (state.isPolling) return;
    
    state.setPolling(true);
    
    const poll = async () => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        // Fetch running/pending jobs to check status updates
        const response = await fetch('/api/admin/intelligence?status=running&limit=100', {
          signal: abortControllerRef.current.signal,
        });
        
        if (response.ok) {
          const data = await response.json();
          const jobs: IntelligenceJob[] = (data.jobs || []).map((j: any) => ({
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
          
          // Use mergeJobs to update without replacing all jobs
          useIntelligenceStore.getState().mergeJobs(jobs);
          
          // Continue polling if there are running jobs
          const hasRunningJobs = jobs.some(j => j.status === 'running' || j.status === 'pending');
          const currentIsPolling = useIntelligenceStore.getState().isPolling;
          if (hasRunningJobs && currentIsPolling) {
            pollingTimeoutRef.current = setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            useIntelligenceStore.getState().setPolling(false);
          }
        } else {
          useIntelligenceStore.getState().setPolling(false);
        }
      } catch (error: any) {
        // Ignore abort errors - they're expected when cancelling
        if (error?.name === 'AbortError') return;
        console.error('Error polling intelligence jobs:', error);
        useIntelligenceStore.getState().setPolling(false);
      }
    };
    
    poll();
  }, []); // No dependencies - uses getState() for all store access
  
  const stopPolling = React.useCallback(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    useIntelligenceStore.getState().setPolling(false);
  }, []); // No dependencies - uses getState() for all store access
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    startPolling,
    stopPolling,
    isPolling,
  };
}

