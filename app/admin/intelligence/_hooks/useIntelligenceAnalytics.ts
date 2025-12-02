'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnalyticsData } from '../_lib/types';

interface UseIntelligenceAnalyticsReturn {
  analytics: AnalyticsData | null;
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

export function useIntelligenceAnalytics(timeRange: string): UseIntelligenceAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analyticsCache = useRef<{ data: AnalyticsData | null; timeRange: string; timestamp: number }>({ 
    data: null, 
    timeRange: '', 
    timestamp: 0 
  });
  
  const loadAnalytics = useCallback(async (forceRefresh = false) => {
    // Check cache first (cache valid for 60 seconds)
    const now = Date.now();
    const cacheValid = analyticsCache.current.data 
      && analyticsCache.current.timeRange === timeRange 
      && (now - analyticsCache.current.timestamp) < 60000
      && !forceRefresh;
    
    if (cacheValid) {
      setAnalytics(analyticsCache.current.data);
      setLoading(false);
      return;
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/intelligence/analytics?timeRange=${timeRange}`, {
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        console.error('Invalid analytics data:', data);
        setAnalytics(null);
        setLoading(false);
        return;
      }
      
      // Update cache
      analyticsCache.current = { data, timeRange, timestamp: now };
      
      setAnalytics(data);
    } catch (error: any) {
      // Ignore abort errors - they're expected when cancelling
      if (error?.name !== 'AbortError') {
        console.error('Error loading analytics:', error);
        // Set null on error to show empty state
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);
  
  // Initial load - always load analytics when hook is active
  useEffect(() => {
    loadAnalytics();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAnalytics, timeRange]);
  
  return {
    analytics,
    loading,
    refresh: loadAnalytics,
  };
}

