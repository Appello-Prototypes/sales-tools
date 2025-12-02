'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, ExternalLink, X, Sparkles, AlertCircle, CheckCircle2, TrendingUp, CheckSquare, Square, Loader2, Brain, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getContactLinkClient } from '@/lib/hubspot/hubspotLinks';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIntelligenceStore } from '@/lib/store/intelligenceStore';
import { AgentActivityLog, type ActivityLogEntry } from '@/components/ai/AgentActivityLog';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  phone?: string;
  company?: string;
  fullName: string;
}

interface Company {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  dealname: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export default function ContactsPage() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedDealId, setSelectedDealId] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [intelligenceJobs, setIntelligenceJobs] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedJobForView, setSelectedJobForView] = useState<any | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0, hasMore: false });
  const intelligenceStore = useIntelligenceStore();

  // Initial load
  useEffect(() => {
    loadContacts(1);
    loadCompanies();
    loadDeals();
    loadIntelligenceJobs();
  }, []);

  // Load intelligence jobs for contacts
  const loadIntelligenceJobs = async () => {
    try {
      const response = await fetch('/api/admin/intelligence?entityType=contact&limit=200');
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
          if (updatedJob.status !== selectedJobForView.status) {
            loadJobDetails(updatedJob._id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading intelligence jobs:', error);
    }
  };

  // Load full job details including logs
  const loadJobDetails = async (jobId: string) => {
    try {
      setJobDetailLoading(true);
      const response = await fetch(`/api/admin/intelligence/${jobId}`);
      const data = await response.json();
      if (data.job) {
        setSelectedJobForView(data.job);
      }
    } catch (error) {
      console.error('Error loading job details:', error);
    } finally {
      setJobDetailLoading(false);
    }
  };

  // Open job viewer dialog
  const openJobViewer = (contactId: string) => {
    const job = intelligenceJobs[contactId];
    if (job) {
      setSelectedJobForView(job);
      loadJobDetails(job._id || job.id);
    }
  };

  // Poll for updates when viewing a running job
  useEffect(() => {
    if (!selectedJobForView) return;
    if (selectedJobForView.status !== 'running' && selectedJobForView.status !== 'pending') return;

    const interval = setInterval(() => {
      loadJobDetails(selectedJobForView._id || selectedJobForView.id);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedJobForView?.status, selectedJobForView?._id]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      // Fetch limited companies for dropdown (200 most recent)
      const response = await fetch('/api/admin/hubspot/companies?limit=200');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadDeals = async () => {
    try {
      setLoadingDeals(true);
      // Fetch limited deals for dropdown (200 most recent)
      const response = await fetch('/api/admin/hubspot/deals?limit=200');
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoadingDeals(false);
    }
  };

  const loadContacts = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (appliedSearch) {
        params.append('search', appliedSearch);
      }
      if (selectedCompanyId && selectedCompanyId !== 'all') {
        params.append('companyId', selectedCompanyId);
      }
      if (selectedDealId && selectedDealId !== 'all') {
        params.append('dealId', selectedDealId);
      }
      
      const url = `/api/admin/hubspot/contacts?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, selectedCompanyId, selectedDealId]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    loadContacts(1);
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
  };

  const handleDealChange = (value: string) => {
    setSelectedDealId(value);
  };

  const clearFilters = () => {
    setSelectedCompanyId('all');
    setSelectedDealId('all');
    setSearchQuery('');
    setAppliedSearch('');
  };

  // Reload when filters change
  useEffect(() => {
    loadContacts(1);
  }, [selectedCompanyId, selectedDealId, loadContacts]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      loadContacts(page);
    }
  };

  // Run AI intelligence in background for a single contact
  const runContactIntelligence = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    try {
      const response = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'contact',
          entityId: contactId,
          entityName: contact.fullName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start intelligence job');
      }

      const data = await response.json();
      setNotification({ type: 'success', message: `AI Intelligence started for ${contact.fullName}` });
      setTimeout(() => setNotification(null), 5000);
      
      // Refresh jobs after a short delay
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start intelligence job' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Run intelligence on selected contacts
  const runBatchIntelligence = async (contactIds: string[]) => {
    if (contactIds.length === 0) return;

    const jobs = contactIds.map(contactId => {
      const contact = contacts.find(c => c.id === contactId);
      return {
        entityType: 'contact' as const,
        entityId: contactId,
        entityName: contact?.fullName || 'Unknown Contact',
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
        message: `Started AI Intelligence for ${data.count} contact${data.count > 1 ? 's' : ''}` 
      });
      setTimeout(() => setNotification(null), 5000);
      
      // Clear selection
      setSelectedContacts(new Set());
      
      // Refresh jobs
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start batch jobs' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your HubSpot contacts</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search contacts by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                value={selectedCompanyId}
                onValueChange={handleCompanyChange}
                disabled={loadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <Select
                value={selectedDealId}
                onValueChange={handleDealChange}
                disabled={loadingDeals}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deals</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.dealname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}>Search</Button>
            {(selectedCompanyId !== 'all' || selectedDealId !== 'all' || searchQuery) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

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

      {/* Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {appliedSearch || selectedCompanyId !== 'all' || selectedDealId !== 'all' ? 'Filtered Contacts' : 'Total Contacts'}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total.toLocaleString()}</p>
            {pagination.pages > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, total)} of {total}
              </p>
            )}
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      {/* Batch Actions */}
      {selectedContacts.size > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBatchIntelligence(Array.from(selectedContacts))}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Intelligence on Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContacts(new Set())}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contacts Table */}
      <Card className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Loading contacts...</span>
            </div>
          </div>
        ) : contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContacts.size === contacts.length && contacts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">AI Intelligence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const job = intelligenceJobs[contact.id];
                  const hasIntelligence = job && job.status === 'complete' && job.result;
                  const isRunning = job && (job.status === 'running' || job.status === 'pending');
                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => handleSelectContact(contact.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {contact.fullName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.jobTitle || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {contact.company || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasIntelligence && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                              onClick={() => openJobViewer(contact.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                          {isRunning && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              onClick={() => openJobViewer(contact.id)}
                            >
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Running
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runContactIntelligence(contact.id)}
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
                          href={getContactLinkClient(contact.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          title="View in HubSpot"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {appliedSearch ? 'No contacts found matching your search.' : 'No contacts found.'}
          </div>
        )}
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
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
                      className="w-8 h-8 p-0"
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
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

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
            <div className="space-y-4 mt-4">
              {/* Results Summary - Show when complete */}
              {selectedJobForView.status === 'complete' && selectedJobForView.result?.intelligence && (
                <div className="space-y-3">
                  {/* Engagement Score */}
                  {selectedJobForView.result.intelligence.engagementScore && (
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                        <span className="font-semibold">Engagement Score</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                        {selectedJobForView.result.intelligence.engagementScore}
                        <span className="text-lg text-gray-600 dark:text-gray-400">/ 10</span>
                      </div>
                    </Card>
                  )}

                  {/* Key Insights */}
                  {selectedJobForView.result.intelligence.insights?.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        Key Insights
                      </h3>
                      <ul className="space-y-1">
                        {selectedJobForView.result.intelligence.insights.map((insight: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Recommended Actions */}
                  {selectedJobForView.result.intelligence.recommendedActions?.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Recommended Actions
                      </h3>
                      <ul className="space-y-1">
                        {selectedJobForView.result.intelligence.recommendedActions.map((action: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {/* Error Display */}
              {selectedJobForView.status === 'error' && selectedJobForView.error && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400">Error</div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{selectedJobForView.error}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Activity Log */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Agent Activity Log
                  {(selectedJobForView.status === 'running' || selectedJobForView.status === 'pending') && (
                    <span className="text-xs text-blue-500 animate-pulse ml-2">Live</span>
                  )}
                </h3>
                {jobDetailLoading && !selectedJobForView.logs?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading activity log...
                  </div>
                ) : selectedJobForView.logs?.length > 0 ? (
                  <AgentActivityLog
                    logs={selectedJobForView.logs.map((log: any) => ({
                      step: log.step,
                      message: log.message,
                      status: log.status,
                      data: log.data,
                      timestamp: new Date(log.timestamp),
                    }))}
                    isLoading={selectedJobForView.status === 'running' || selectedJobForView.status === 'pending'}
                    maxHeight="400px"
                    title="Agent Activity"
                    subtitle={selectedJobForView.status === 'running' ? 'Processing...' : 'Complete'}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {selectedJobForView.status === 'pending' ? 'Waiting to start...' : 'No activity logs available'}
                  </div>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
