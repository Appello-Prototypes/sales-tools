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
import { Building2, Search, ExternalLink, X, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Brain, Loader2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getCompanyLinkClient } from '@/lib/hubspot/hubspotLinks';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useIntelligenceStore } from '@/lib/store/intelligenceStore';

interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  employees?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export default function CompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [intelligenceJobs, setIntelligenceJobs] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0, hasMore: false });
  const intelligenceStore = useIntelligenceStore();

  // Initial load
  useEffect(() => {
    loadCompanies(1);
    loadIndustries();
    loadIntelligenceJobs();
  }, []);

  // Load intelligence jobs for companies
  const loadIntelligenceJobs = async () => {
    try {
      const response = await fetch('/api/admin/intelligence?entityType=company&limit=200');
      const data = await response.json();
      const jobsMap: Record<string, any> = {};
      (data.jobs || []).forEach((job: any) => {
        if (!jobsMap[job.entityId] || new Date(job.startedAt) > new Date(jobsMap[job.entityId].startedAt)) {
          jobsMap[job.entityId] = job;
        }
      });
      setIntelligenceJobs(jobsMap);
    } catch (error) {
      console.error('Error loading intelligence jobs:', error);
    }
  };

  const loadIndustries = async () => {
    try {
      setLoadingIndustries(true);
      // Use dedicated endpoint for industries
      const response = await fetch('/api/admin/hubspot/companies?industriesOnly=true');
      const data = await response.json();
      setIndustries(data.industries || []);
    } catch (error) {
      console.error('Error loading industries:', error);
    } finally {
      setLoadingIndustries(false);
    }
  };

  const loadCompanies = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (appliedSearch) {
        params.append('search', appliedSearch);
      }
      
      // Apply industry filter server-side
      if (selectedIndustry && selectedIndustry !== 'all') {
        params.append('industry', selectedIndustry);
      }
      
      const url = `/api/admin/hubspot/companies?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, selectedIndustry]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    loadCompanies(1);
  };

  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value);
  };

  const clearFilters = () => {
    setSelectedIndustry('all');
    setSearchQuery('');
    setAppliedSearch('');
  };

  // Reload when industry changes
  useEffect(() => {
    loadCompanies(1);
  }, [selectedIndustry, loadCompanies]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      loadCompanies(page);
    }
  };

  // Load AI intelligence for a company with streaming progress
  // Run AI intelligence in background for a single company
  const runCompanyIntelligence = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    try {
      const response = await fetch('/api/admin/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'company',
          entityId: companyId,
          entityName: company.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start intelligence job');
      }

      const data = await response.json();
      setNotification({ type: 'success', message: `AI Intelligence started for ${company.name}` });
      setTimeout(() => setNotification(null), 5000);
      
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start intelligence job' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Run intelligence on selected companies
  const runBatchIntelligence = async (companyIds: string[]) => {
    if (companyIds.length === 0) return;

    const jobs = companyIds.map(companyId => {
      const company = companies.find(c => c.id === companyId);
      return {
        entityType: 'company' as const,
        entityId: companyId,
        entityName: company?.name || 'Unknown Company',
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
        message: `Started AI Intelligence for ${data.count} compan${data.count > 1 ? 'ies' : 'y'}` 
      });
      setTimeout(() => setNotification(null), 5000);
      
      setSelectedCompanies(new Set());
      setTimeout(loadIntelligenceJobs, 1000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to start batch jobs' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === companies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(companies.map(c => c.id)));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Companies</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your HubSpot companies</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search companies by name, domain, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                value={selectedIndustry}
                onValueChange={handleIndustryChange}
                disabled={loadingIndustries}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}>Search</Button>
            {(selectedIndustry !== 'all' || searchQuery) && (
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {appliedSearch || selectedIndustry !== 'all' ? 'Filtered Results' : 'Total Companies'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {total.toLocaleString()}
              </p>
              {pagination.pages > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, total)} of {total}
                </p>
              )}
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
          <Link href="/admin/crm/companies/map">
            <Button variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </Button>
          </Link>
        </div>
      </Card>

      {/* Batch Actions */}
      {selectedCompanies.size > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {selectedCompanies.size} compan{selectedCompanies.size > 1 ? 'ies' : 'y'} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBatchIntelligence(Array.from(selectedCompanies))}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Intelligence on Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompanies(new Set())}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Companies Table */}
      <Card className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Loading companies...</span>
            </div>
          </div>
        ) : companies.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCompanies.size === companies.length && companies.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead className="text-right">AI Intelligence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const job = intelligenceJobs[company.id];
                    const hasIntelligence = job && job.status === 'complete' && job.result;
                    const isRunning = job && (job.status === 'running' || job.status === 'pending');
                    return (
                      <TableRow key={company.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCompanies.has(company.id)}
                            onCheckedChange={() => handleSelectCompany(company.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {company.name || 'N/A'}
                        </TableCell>
                      <TableCell>
                        {company.industry || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            {company.website}
                          </a>
                        ) : company.domain ? (
                          <a
                            href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            {company.domain}
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.phone ? (
                          <a
                            href={`tel:${company.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                          >
                            {company.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.address || company.city || company.state || company.zip ? (
                          <div>
                            {company.address && <div>{company.address}</div>}
                            {(company.city || company.state || company.zip) && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {[company.city, company.state, company.zip].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.employees || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasIntelligence && (
                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                          {isRunning && (
                            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Running
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runCompanyIntelligence(company.id)}
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
                          href={getCompanyLinkClient(company.id)}
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
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {appliedSearch ? 'No companies found matching your search.' : 'No companies found.'}
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
    </div>
  );
}
