'use client';

import { useState, useCallback, useMemo } from 'react';
import type { IntelligenceJob } from '../_lib/types';

interface UseJobSelectionReturn {
  selectedJobs: Set<string>;
  toggleJobSelection: (jobId: string) => void;
  toggleSelectAll: (errorJobs: IntelligenceJob[]) => void;
  clearSelection: () => void;
  isSelected: (jobId: string) => boolean;
  selectedCount: number;
}

export function useJobSelection(filteredJobs: IntelligenceJob[]): UseJobSelectionReturn {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  
  const errorJobs = useMemo(() => 
    filteredJobs.filter(j => j.status === 'error'),
    [filteredJobs]
  );
  
  const toggleJobSelection = useCallback((jobId: string) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }, []);
  
  const toggleSelectAll = useCallback(() => {
    if (selectedJobs.size === errorJobs.length && errorJobs.length > 0) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(errorJobs.map(j => j.id)));
    }
  }, [errorJobs, selectedJobs.size]);
  
  const clearSelection = useCallback(() => {
    setSelectedJobs(new Set());
  }, []);
  
  const isSelected = useCallback((jobId: string) => {
    return selectedJobs.has(jobId);
  }, [selectedJobs]);
  
  return {
    selectedJobs,
    toggleJobSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedJobs.size,
  };
}

