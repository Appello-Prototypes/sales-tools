'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { IntelligenceJob } from '../_lib/types';
import { useIntelligenceStore } from '@/lib/store/intelligenceStore';

interface UseIntelligenceJobsFilters {
  status: string;
  entityType: string;
}

interface UseIntelligenceJobsReturn {
  jobs: IntelligenceJob[];
  loading: boolean;
  refresh: (silent?: boolean) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  rerunJob: (job: IntelligenceJob) => Promise<void>;
  runningJobsCount: number;
}

export function useIntelligenceJobs(filters: UseIntelligenceJobsFilters): UseIntelligenceJobsReturn {
  const [jobs, setJobs] = useState<IntelligenceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef(filters);
  
  // Keep filters ref in sync
  filtersRef.current = filters;
  
  // Transform API response to IntelligenceJob[]
  const transformJobs = useCallback((apiJobs: any[]): IntelligenceJob[] => {
    if (!apiJobs || !Array.isArray(apiJobs)) {
      return [];
    }
    return apiJobs.map((j: any) => ({
      _id: j._id || j.id,
      id: j._id || j.id,
      entityType: j.entityType,
      entityId: j.entityId,
      entityName: j.entityName,
      status: j.status,
      result: j.result,
      error: j.error,
      startedAt: j.startedAt ? new Date(j.startedAt) : new Date(),
      completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
      stats: j.stats,
      logs: j.logs || [],
      dealDetails: j.dealDetails,
    }));
  }, []);
  
  // Track running jobs count
  const runningJobsCount = useMemo(() => 
    jobs.filter(j => j.status === 'running' || j.status === 'pending').length,
    [jobs]
  );
  
  const runningJobsCountRef = useRef(0);
  
  // Update ref when count changes
  useEffect(() => {
    runningJobsCountRef.current = runningJobsCount;
  }, [runningJobsCount]);
  
  // Load jobs function - defined after refs to use them
  const loadJobs = useCallback(async (silent = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      const { status, entityType } = filtersRef.current;
      
      if (status !== 'all') params.append('status', status);
      if (entityType !== 'all') params.append('entityType', entityType);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/intelligence?${params.toString()}`, {
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      const loadedJobs = transformJobs(data.jobs || []);

      setJobs(loadedJobs);
      
      // Update global store
      useIntelligenceStore.getState().setJobs(loadedJobs.map(j => ({
        id: j.id,
        entityType: j.entityType,
        entityId: j.entityId,
        entityName: j.entityName,
        status: j.status,
        result: j.result,
        error: j.error,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
        stats: j.stats,
      })));
    } catch (error: any) {
      // Ignore abort errors - they're expected when cancelling
      if (error?.name === 'AbortError') return;
      console.error('Error loading jobs:', error);
      // Set loading to false even on error
      if (!silent) setLoading(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [transformJobs]);
  
  // Initial load and when filters change - inline the fetch logic to avoid dependency issues
  useEffect(() => {
    let mounted = true;
    
    const fetchJobs = async () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      try {
        setLoading(true);
        const params = new URLSearchParams();
        const { status, entityType } = filtersRef.current;
        
        if (status !== 'all') params.append('status', status);
        if (entityType !== 'all') params.append('entityType', entityType);
        params.append('limit', '100');

        const response = await fetch(`/api/admin/intelligence?${params.toString()}`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          
          console.error(`[useIntelligenceJobs] ❌ API Error ${response.status}:`, errorData);
          
          // Show user-friendly error for database issues
          if (response.status === 503 || errorData.error?.includes('Database') || errorData.error?.includes('timeout') || errorText.includes('timeout')) {
            console.error('[useIntelligenceJobs] 🔴 MongoDB Connection Timeout - Database server is unreachable');
            throw new Error(`Database connection failed: ${errorData.message || errorData.error || 'Unable to connect to MongoDB database'}`);
          }
          
          throw new Error(`Failed to fetch jobs: ${response.status} - ${errorData.error || errorText.substring(0, 100)}`);
        }
        
        const data = await response.json();
        if (!mounted) return;
        
        if (!data || typeof data !== 'object') {
          console.error('Invalid response data:', data);
          setJobs([]);
          setLoading(false);
          return;
        }
        
        console.log(`Loaded ${data.jobs?.length || 0} jobs from API`);
        
        const loadedJobs = transformJobs(data.jobs || []);
        setJobs(loadedJobs);
        
        // Update global store with ALL jobs to get accurate counts
        // This ensures the badge shows correct running/pending counts
        useIntelligenceStore.getState().setJobs(loadedJobs.map(j => ({
          id: j.id,
          entityType: j.entityType,
          entityId: j.entityId,
          entityName: j.entityName,
          status: j.status,
          result: j.result,
          error: j.error,
          startedAt: j.startedAt,
          completedAt: j.completedAt,
          stats: j.stats,
        })));
      } catch (error: any) {
        if (!mounted) return;
        // Ignore abort errors - they're expected when cancelling
        if (error?.name !== 'AbortError') {
          console.error('[useIntelligenceJobs] ❌ Error loading jobs:', error.message);
          console.error('[useIntelligenceJobs] Full error:', error);
          // Set empty array on error to show something
          setJobs([]);
          // Store error for display
          if (mounted) {
            // Could add error state here if needed
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchJobs();
    
    return () => {
      mounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.entityType]); // Only depend on filter values
  
  // Polling is handled by the interval effect below - no need for global polling store
  
  // Polling interval for refreshing jobs list
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (runningJobsCount === 0) return;
    
    pollingIntervalRef.current = setInterval(() => {
      if (runningJobsCountRef.current > 0) {
        // Use filtersRef to get current filter values
        const { status, entityType } = filtersRef.current;
        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (entityType !== 'all') params.append('entityType', entityType);
        params.append('limit', '100');
        
        // Fetch and update jobs
        fetch(`/api/admin/intelligence?${params.toString()}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            return res.json();
          })
          .then(data => {
            const loadedJobs = transformJobs(data.jobs || []);
            setJobs(loadedJobs);
            useIntelligenceStore.getState().setJobs(loadedJobs.map(j => ({
              id: j.id,
              entityType: j.entityType,
              entityId: j.entityId,
              entityName: j.entityName,
              status: j.status,
              result: j.result,
              error: j.error,
              startedAt: j.startedAt,
              completedAt: j.completedAt,
              stats: j.stats,
            })));
          })
          .catch(() => {
            // Silently fail for polling - don't spam console
          });
      }
    }, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningJobsCount, transformJobs]); // Include transformJobs in deps
  
  // Cancel job
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/intelligence/${jobId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadJobs(false);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  }, [loadJobs]);
  
  // Rerun job
  const rerunJob = useCallback(async (job: IntelligenceJob) => {
    try {
      const response = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: job.entityType,
          entityId: job.entityId,
          entityName: job.entityName,
          isRerun: true,
        }),
      });

      if (response.ok) {
        await loadJobs(true);
      } else {
        const error = await response.json();
        console.error('Failed to re-run job:', error);
      }
    } catch (error) {
      console.error('Error re-running job:', error);
    }
  }, [loadJobs]);
  
  return {
    jobs,
    loading,
    refresh: loadJobs,
    cancelJob,
    rerunJob,
    runningJobsCount,
  };
}

