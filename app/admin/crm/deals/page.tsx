'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Search, DollarSign, ExternalLink, Sparkles, FileText, AlertCircle, CheckCircle2, TrendingDown, Brain, Loader2, X, Clock, Target, Lightbulb, Shield, BarChart3, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDealLinkClient } from '@/lib/hubspot/hubspotLinks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useIntelligenceStore } from '@/lib/store/intelligenceStore';
import { AgentActivityLog, type ActivityLogEntry } from '@/components/ai/AgentActivityLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Deal {
  id: string;
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline: string;
  closedate?: string;
  dealtype?: string;
  ownerId?: string;
  isClosed: boolean;
  isWon: boolean;
  isLost: boolean;
}

interface ProgressLog {
  step: string;
  message: string;
  status: 'loading' | 'complete' | 'error' | 'warning' | 'info';
  data?: any;
  timestamp: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export default function DealsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pipelineLabels, setPipelineLabels] = useState<Record<string, string>>({});
  const [stageLabels, setStageLabels] = useState<Record<string, string>>({});
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [intelligenceJobs, setIntelligenceJobs] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedJobForView, setSelectedJobForView] = useState<any | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0, hasMore: false });
  const [totalValue, setTotalValue] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const intelligenceStore = useIntelligenceStore();

  // Initial load
  useEffect(() => {
    loadPipelines();
    loadDeals(1);
    loadIntelligenceJobs();
  }, []);

  // Load intelligence jobs for deals
  const loadIntelligenceJobs = async () => {
    try {
      const response = await fetch('/api/admin/intelligence?entityType=deal&limit=200');
      const data = await response.json();
      const jobsMap: Record<string, any> = {};
      (data.jobs || []).forEach((job: any) => {
        if (!jobsMap[job.entityId] || new Date(job.startedAt) > new Date(jobsMap[job.entityId].startedAt)) {
          jobsMap[job.entityId] = job;
        }
      });
      setIntelligenceJobs(jobsMap);
      
      // Update selected job if it's being viewed
      if (selectedJobForView) {
        const updatedJob = jobsMap[selectedJobForView.entityId];
        if (updatedJob && updatedJob._id === selectedJobForView._id) {
        }
      }
    } catch (error) {
      console.error('Error loading intelligence jobs:', error);
    }
  };

  // Open intelligence report page
  const openJobViewer = (dealId: string) => {
    const job = intelligenceJobs[dealId];
    if (job) {
      router.push(`/admin/intelligence/${job._id || job.id}`);
    }
  };

  // Auto-select pipeline when pipeline data loads (only on initial load)
  useEffect(() => {
    if (pipelineData.length > 0 && selectedPipeline === '') {
      setSelectedPipeline(pipelineData[0].id);
    }
  }, [pipelineData]);

  // Load pipelines separately (one-time)
  const loadPipelines = async () => {
    try {
      const pipelinesResponse = await fetch('/api/admin/hubspot/pipelines');
      if (pipelinesResponse.ok) {
        const pipelinesData = await pipelinesResponse.json();
        setPipelineLabels(pipelinesData.pipelines || {});
        setStageLabels(pipelinesData.stages || {});
        setPipelineData(pipelinesData.pipelineData || []);
      } else {
        console.error('Failed to load pipelines:', pipelinesResponse.status);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  // Load deals with pagination
  const loadDeals = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      params.append('useSync', 'true');
      
      if (appliedSearch) {
        params.append('search', appliedSearch);
      }
      if (selectedPipeline) {
        params.append('pipeline', selectedPipeline);
      }
      if (selectedStage) {
        params.append('dealstage', selectedStage);
      }
      
      let dealsResponse = await fetch(`/api/admin/hubspot/deals?${params.toString()}`);
      
      // If MongoDB sync fails, try HubSpot API directly
      if (!dealsResponse.ok) {
        console.log('MongoDB sync failed, trying HubSpot API directly...');
        params.set('useSync', 'false');
        dealsResponse = await fetch(`/api/admin/hubspot/deals?${params.toString()}`);
      }
      
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        const loadedDeals = dealsData.deals || [];
        setDeals(loadedDeals);
        setError(null);
        
        if (dealsData.pagination) {
          setPagination(dealsData.pagination);
        }
        
        // Calculate stats from current page (approximation for filtered views)
        const pageValue = loadedDeals.reduce((sum: number, d: Deal) => sum + parseFloat(d.amount || '0'), 0);
        const pageOpen = loadedDeals.filter((d: Deal) => !d.isClosed).length;
        setTotalValue(pageValue);
        setOpenCount(pageOpen);
      } else {
        const errorData = await dealsResponse.json().catch(() => ({}));
        console.error('Failed to load deals:', dealsResponse.status, errorData);
        const apiError = errorData.error || errorData.message || `Failed to load deals: HTTP ${dealsResponse.status}`;
        setError(apiError);
        setDeals([]);
      }
    } catch (error: any) {
      console.error('Error loading deals:', error);
      setError(error.message || 'Failed to load deals. Please check your HubSpot API configuration.');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, selectedPipeline, selectedStage]);

  // Legacy function for refresh button
  const loadPipelinesAndDeals = () => {
    loadPipelines();
    loadDeals(1);
  };

  const getPipelineLabel = (pipelineId: string): string => {
    return pipelineLabels[pipelineId] || pipelineId || 'Unassigned';
  };

  const getStageLabel = (pipelineId: string, stageId: string): string => {
    const key = `${pipelineId}:${stageId}`;
    return stageLabels[key] || stageId || 'Unassigned';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStageBadgeColor = (deal: Deal) => {
    if (deal.isWon) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (deal.isLost) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const getDealAmountColor = (amount: number) => {
    if (amount < 25000) return 'text-gray-600 dark:text-gray-400';
    if (amount < 75000) return 'text-blue-600 dark:text-blue-500';
    if (amount < 150000) return 'text-green-600 dark:text-green-500';
    return 'text-purple-600 dark:text-purple-500';
  };

  const getDealBorderColor = (deal: Deal) => {
    if (deal.isWon) return 'border-l-green-500';
    if (deal.isLost) return 'border-l-red-500';
    const amount = parseFloat(deal.amount || '0');
    if (amount < 25000) return 'border-l-gray-400';
    if (amount < 75000) return 'border-l-blue-500';
    if (amount < 150000) return 'border-l-green-500';
    return 'border-l-purple-500';
  };

  // Reload deals when filters change
  useEffect(() => {
    loadDeals(1);
  }, [selectedPipeline, selectedStage, loadDeals]);

  // Get available stages from pipeline data
  const availableStages = selectedPipeline 
    ? (pipelineData.find(p => p.id === selectedPipeline)?.stages || [])
    : [];

  // Search handler
  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    loadDeals(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      loadDeals(page);
    }
  };

  // Deals are already filtered server-side, just use them directly
  const filteredDeals = deals;

  // Run AI intelligence in background for a single deal
  const runDealIntelligence = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    try {
      const response = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'deal',
          entityId: dealId,
          entityName: deal.dealname,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start intelligence job');
      }

      const data = await response.json();
      setNotification({ type: 'success', message: `AI Intelligence started for ${deal.dealname}` });
      setTimeout(() => setNotification(null), 5000);
      
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start intelligence job' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Run intelligence on selected deals
  const runBatchIntelligence = async (dealIds: string[]) => {
    if (dealIds.length === 0) return;

    const jobs = dealIds.map(dealId => {
      const deal = deals.find(d => d.id === dealId);
      return {
        entityType: 'deal' as const,
        entityId: dealId,
        entityName: deal?.dealname || 'Unknown Deal',
      };
    });

    try {
      const response = await fetch('/api/admin/intelligence/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs }),
      });

      if (!response.ok) {
        throw new Error('Failed to start batch intelligence jobs');
      }

      const data = await response.json();
      setNotification({ 
        type: 'success', 
        message: `Started AI Intelligence for ${data.count} deal${data.count > 1 ? 's' : ''}` 
      });
      setTimeout(() => setNotification(null), 5000);
      
      setSelectedDeals(new Set());
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start batch jobs' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === filteredDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map(d => d.id)));
    }
  };

  const handleSelectDeal = (dealId: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-foreground">Deals</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-xs mt-0.5">View and manage your sales deals</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = '/admin/crm/deals/recommendations'}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            Recommendations Report
          </Button>
          <Button onClick={loadPipelinesAndDeals} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
        <div className="flex gap-2">
          <Card className="flex-1 p-2">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                <Input
                  placeholder="Search deals by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button onClick={handleSearch} size="sm" className="h-8">Search</Button>
            </div>
          </Card>
          {pipelineData.length > 0 && (
            <Card className="p-2">
              <select
                value={selectedPipeline}
                onChange={(e) => {
                  setSelectedPipeline(e.target.value);
                  setSelectedStage(''); // Reset stage when pipeline changes
                }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-8 bg-background text-foreground"
              >
                <option value="">All Pipelines</option>
                {pipelineData.map((pipeline: any) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.label || pipeline.id}
                  </option>
                ))}
              </select>
            </Card>
          )}
          {selectedPipeline && availableStages.length > 0 && (
            <Card className="p-2">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-8 bg-background text-foreground"
              >
                <option value="">All Stages</option>
                {availableStages.map((stage: any) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </Card>
          )}
        </div>

        {/* Notification Banner */}
        {notification && (
          <Card className={`p-4 ${notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                )}
                <span className={`font-medium ${notification.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {notification.message}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNotification(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Batch Actions */}
        {selectedDeals.size > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {selectedDeals.size} deal{selectedDeals.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runBatchIntelligence(Array.from(selectedDeals))}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Intelligence on Selected
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDeals(new Set())}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Card className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 dark:text-muted-foreground">
                  {appliedSearch || selectedPipeline || selectedStage ? 'Filtered Deals' : 'Total Deals'}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-foreground">{pagination.total.toLocaleString()}</p>
                {pagination.pages > 1 && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}
                  </p>
                )}
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 dark:text-muted-foreground">Page Value</p>
                <p className="text-lg font-bold text-gray-900 dark:text-foreground">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </Card>
          <Card className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-600 dark:text-muted-foreground">Open (this page)</p>
                <p className="text-lg font-bold text-gray-900 dark:text-foreground">
                  {openCount}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </Card>
        </div>

      {/* Table View */}
      <div className="mt-2">
          {loading ? (
            <Card className="p-3">
              <div className="text-center py-4 text-gray-500 dark:text-muted-foreground text-sm">Loading deals...</div>
            </Card>
          ) : error ? (
            <Card className="p-3">
              <div className="text-center py-4">
                <div className="text-red-600 dark:text-red-500 font-semibold mb-1 text-sm">Error Loading Deals</div>
                <div className="text-xs text-gray-600 dark:text-muted-foreground mb-2">{error}</div>
                <Button onClick={loadPipelinesAndDeals} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </Card>
          ) : filteredDeals.length === 0 ? (
            <Card className="p-3">
              <div className="text-center py-4 text-gray-500 dark:text-muted-foreground text-xs">
                {searchQuery ? 'No deals found matching your search.' : 'No deals found. Make sure your HubSpot integration is configured correctly.'}
                <div className="mt-1">
                  <Button onClick={loadPipelinesAndDeals} variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedDeals.size === filteredDeals.length && filteredDeals.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Deal Type</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">AI Intelligence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.map((deal) => {
                      const job = intelligenceJobs[deal.id];
                      const hasIntelligence = job && job.status === 'complete' && job.result;
                      const isRunning = job && (job.status === 'running' || job.status === 'pending');
                      const amount = parseFloat(deal.amount || '0');
                      const amountColor = getDealAmountColor(amount);
                      const formatDate = (dateStr?: string) => {
                        if (!dateStr) return '-';
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      };

                      return (
                        <TableRow key={deal.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDeals.has(deal.id)}
                              onCheckedChange={() => handleSelectDeal(deal.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{deal.dealname}</TableCell>
                          <TableCell>
                            <span className={amountColor}>
                              {formatCurrency(amount)}
                            </span>
                          </TableCell>
                          <TableCell>{getPipelineLabel(deal.pipeline)}</TableCell>
                          <TableCell>
                            <Badge className={getStageBadgeColor(deal)}>
                              {getStageLabel(deal.pipeline, deal.dealstage)}
                            </Badge>
                          </TableCell>
                          <TableCell>{deal.dealtype || '-'}</TableCell>
                          <TableCell>{formatDate(deal.closedate)}</TableCell>
                          <TableCell>
                            {deal.isWon ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Won</Badge>
                            ) : deal.isLost ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Lost</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Open</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasIntelligence && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                  onClick={() => openJobViewer(deal.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              )}
                              {isRunning && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                  onClick={() => openJobViewer(deal.id)}
                                >
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Running
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => runDealIntelligence(deal.id)}
                                disabled={isRunning}
                                className="h-7 text-xs"
                                title="Run AI Intelligence"
                              >
                                <Sparkles className={`h-3 w-3 ${hasIntelligence ? 'text-purple-600' : ''}`} />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <a
                              href={getDealLinkClient(deal.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                              title="View in HubSpot"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                      className="h-7 text-xs"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Prev
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            disabled={loading}
                            className="w-7 h-7 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={!pagination.hasMore || loading}
                      className="h-7 text-xs"
                    >
                      Next
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
      </div>

      {/* Link to Intelligence Hub for viewing results */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              View all intelligence results and activity logs in the Intelligence Hub
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/intelligence'}>
            <Sparkles className="h-4 w-4 mr-2" />
            View Intelligence Hub
          </Button>
        </div>
      </Card>

      {/* Intelligence Job Viewer Dialog */}
      <Dialog open={!!selectedJobForView} onOpenChange={(open) => !open && setSelectedJobForView(null)}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Intelligence: {selectedJobForView?.entityName}
            </DialogTitle>
            <DialogDescription>
              {selectedJobForView && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={
                    selectedJobForView.status === 'complete' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                    selectedJobForView.status === 'running' || selectedJobForView.status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                    selectedJobForView.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                    'bg-gray-50 dark:bg-gray-900/20'
                  }>
                    {selectedJobForView.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {selectedJobForView.status === 'complete' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {selectedJobForView.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {selectedJobForView.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {selectedJobForView.status.charAt(0).toUpperCase() + selectedJobForView.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Started: {new Date(selectedJobForView.startedAt).toLocaleString()}
                  </span>
                  {selectedJobForView.stats && (
                    <span className="text-xs text-gray-500">
                      • {selectedJobForView.stats.iterations || 0} iterations • {selectedJobForView.stats.toolCalls || 0} tool calls
                    </span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedJobForView && (
            <DealIntelligenceReportView job={selectedJobForView} isLoading={jobDetailLoading} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Deal Intelligence Report View Component
// ============================================================================

function DealIntelligenceReportView({ job, isLoading }: { job: any; isLoading: boolean }) {
  const intelligence = job.result?.intelligence;
  const hasReport = job.status === 'complete' && intelligence;
  const hasLogs = job.logs && job.logs.length > 0;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-500';
    if (score >= 6) return 'text-blue-600 dark:text-blue-500';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 6) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  // Error state
  if (job.status === 'error') {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mt-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
          <div>
            <div className="font-semibold text-red-700 dark:text-red-400">Analysis Failed</div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{job.error}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Running state
  if (job.status === 'running' || job.status === 'pending') {
    return (
      <div className="space-y-4 mt-4">
        <Card className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
          <div className="font-semibold">Analysis in Progress</div>
          <p className="text-sm text-muted-foreground mt-1">
            The AI agent is gathering intelligence...
          </p>
        </Card>
        {hasLogs && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              Live Activity
              <span className="text-xs text-blue-500 animate-pulse">● Live</span>
            </h3>
            <AgentActivityLog
              logs={job.logs.map((log: any) => ({
                step: log.step,
                message: log.message,
                status: log.status,
                data: log.data,
                timestamp: new Date(log.timestamp),
              }))}
              isLoading={true}
              maxHeight="400px"
            />
          </Card>
        )}
      </div>
    );
  }

  // Complete state with tabs
  return (
    <Tabs defaultValue="report" className="w-full mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="report" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Intelligence Report
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Activity Log
          {hasLogs && <Badge variant="secondary" className="ml-1 text-xs">{job.logs.length}</Badge>}
        </TabsTrigger>
      </TabsList>

      {/* Report Tab */}
      <TabsContent value="report" className="space-y-4 mt-4">
        {hasReport ? (
          <>
            {/* Score Card */}
            {(intelligence.healthScore || intelligence.engagementScore) && (
              <Card className={`p-5 border ${getScoreBgColor(intelligence.healthScore || intelligence.engagementScore)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Deal Health Score
                    </div>
                    <div className={`text-4xl font-bold ${getScoreColor(intelligence.healthScore || intelligence.engagementScore)}`}>
                      {intelligence.healthScore || intelligence.engagementScore}
                      <span className="text-lg text-muted-foreground font-normal">/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getScoreBgColor(intelligence.healthScore || intelligence.engagementScore)}>
                      {getScoreLabel(intelligence.healthScore || intelligence.engagementScore)}
                    </Badge>
                    {job.stats && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Based on {job.stats.toolCalls} data points
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Investigation Summary */}
            {intelligence.investigationSummary && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Executive Summary
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {intelligence.investigationSummary}
                </p>
              </Card>
            )}

            {/* Key Insights */}
            {intelligence.insights && intelligence.insights.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {intelligence.insights.map((insight: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                      <span className="text-purple-600 font-bold">{idx + 1}.</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Recommended Actions */}
            {intelligence.recommendedActions && intelligence.recommendedActions.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {intelligence.recommendedActions.map((action: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Risk Factors */}
            {intelligence.riskFactors && intelligence.riskFactors.length > 0 && (
              <Card className="p-4 border-red-200 dark:border-red-900">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  Risk Factors
                </h3>
                <ul className="space-y-2">
                  {intelligence.riskFactors.map((risk: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Opportunity Signals */}
            {intelligence.opportunitySignals && intelligence.opportunitySignals.length > 0 && (
              <Card className="p-4 border-emerald-200 dark:border-emerald-900">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Opportunity Signals
                </h3>
                <ul className="space-y-2">
                  {intelligence.opportunitySignals.map((signal: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                      <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Similar Deals Analysis */}
            {intelligence.similarDealsAnalysis && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-600" />
                  Similar Deals Analysis
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {intelligence.similarDealsAnalysis}
                </p>
              </Card>
            )}

            {/* Raw Analysis fallback */}
            {intelligence.rawAnalysis && !intelligence.insights && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Analysis</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {intelligence.rawAnalysis}
                </p>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No intelligence report available</p>
          </Card>
        )}
      </TabsContent>

      {/* Activity Log Tab */}
      <TabsContent value="activity" className="mt-4">
        {isLoading && !hasLogs ? (
          <Card className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading activity log...</p>
          </Card>
        ) : hasLogs ? (
          <Card className="p-4">
            <AgentActivityLog
              logs={job.logs.map((log: any) => ({
                step: log.step,
                message: log.message,
                status: log.status,
                data: log.data,
                timestamp: new Date(log.timestamp),
              }))}
              isLoading={false}
              maxHeight="500px"
              title="Agent Investigation Trail"
              subtitle="Complete audit of AI analysis"
            />
          </Card>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity logs available</p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
