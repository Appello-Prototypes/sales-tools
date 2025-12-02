'use client';

import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { JobsTable } from '../jobs/JobsTable';
import type { IntelligenceJob } from '../../_lib/types';

interface JobsTabProps {
  jobs: IntelligenceJob[];
  loading: boolean;
  onCancelJob: (jobId: string) => Promise<void>;
  onRerunJob: (job: IntelligenceJob) => Promise<void>;
  onRefresh: () => Promise<void>;
  statusFilter: string;
  entityTypeFilter: string;
  onStatusFilterChange: (value: string) => void;
  onEntityTypeFilterChange: (value: string) => void;
}

export function JobsTab({ 
  jobs, 
  loading, 
  onCancelJob, 
  onRerunJob, 
  onRefresh,
  statusFilter,
  entityTypeFilter,
  onStatusFilterChange,
  onEntityTypeFilterChange,
}: JobsTabProps) {
  // Simple handlers for native selects
  const handleStatusChange = useCallback((value: string) => {
    onStatusFilterChange(value);
  }, [onStatusFilterChange]);
  
  const handleEntityTypeChange = useCallback((value: string) => {
    onEntityTypeFilterChange(value);
  }, [onEntityTypeFilterChange]);
  
  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running' || j.status === 'pending').length,
    complete: jobs.filter(j => j.status === 'complete').length,
    error: jobs.filter(j => j.status === 'error').length,
  };
  
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Jobs</p>
              <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            </div>
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Running</p>
              <p className="text-2xl font-bold text-blue-500">{stats.running}</p>
            </div>
            <Loader2 className={`h-8 w-8 text-blue-500 ${stats.running > 0 ? 'animate-spin' : ''}`} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Complete</p>
              <p className="text-2xl font-bold text-green-500">{stats.complete}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Errors</p>
              <p className="text-2xl font-bold text-red-500">{stats.error}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[200px]">
            <label className="text-sm font-medium mb-2 block text-slate-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="complete">Complete</option>
              <option value="error">Error</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-sm font-medium mb-2 block text-slate-300">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => handleEntityTypeChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="contact">Contacts</option>
              <option value="company">Companies</option>
              <option value="deal">Deals</option>
            </select>
          </div>
          <Button onClick={onRefresh} variant="outline">
            Refresh
          </Button>
          <Button 
            onClick={async () => {
              const count = stats.running || 'all';
              if (confirm(`Cancel all running/pending jobs? This will stop ${count} job(s) immediately.`)) {
                try {
                  // Add timeout to prevent hanging
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                  
                  const response = await fetch('/api/admin/intelligence', {
                    method: 'DELETE',
                    signal: controller.signal,
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                  }
                  
                  const data = await response.json();
                  if (data.success) {
                    alert(`✅ Cancelled ${data.cancelled} job(s). They will stop on their next progress check.`);
                    onRefresh();
                  } else {
                    alert('❌ Failed to cancel jobs: ' + (data.error || 'Unknown error'));
                  }
                } catch (error: any) {
                  if (error.name === 'AbortError') {
                    alert('❌ Request timed out. Jobs may still be cancelled. Please refresh the page.');
                  } else {
                    alert('❌ Error cancelling jobs: ' + (error.message || 'Unknown error'));
                  }
                }
              }
            }}
            variant="destructive"
            className="ml-auto"
          >
            Cancel All Running Jobs
          </Button>
        </div>
      </Card>

      {/* Debug Info Panel */}
      <Card className="p-3 bg-slate-900/50 border-slate-700">
        <div className="text-xs text-slate-400 space-y-1 font-mono">
          <div className="flex gap-4">
            <span>📊 Jobs: <strong className="text-slate-300">{jobs.length}</strong></span>
            <span>⏳ Loading: <strong className={loading ? 'text-yellow-400' : 'text-green-400'}>{loading ? 'YES' : 'NO'}</strong></span>
            <span>🔍 Status: <strong className="text-slate-300">{statusFilter}</strong></span>
            <span>🏷️ Entity: <strong className="text-slate-300">{entityTypeFilter}</strong></span>
          </div>
          <div className="text-slate-500">💡 Check browser console (F12 → Console) for detailed API logs</div>
        </div>
      </Card>

      {/* Jobs Table */}
      <JobsTable
        jobs={jobs}
        loading={loading}
        onCancelJob={onCancelJob}
        onRerunJob={onRerunJob}
        errorJobsCount={stats.error}
      />
    </div>
  );
}

