'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText, Plus, Search, Download, Eye, Trash2, 
  MoreHorizontal, Filter, Calendar, DollarSign, Building2, Edit2, Loader2
} from 'lucide-react';

interface Estimate {
  _id: string;
  estimateNumber: string;
  preparedFor: {
    companyName: string;
    contactName: string;
    email?: string;
  };
  numberOfUsers: number;
  moduleTier: number;
  totals: {
    total: number;
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-border',
    sent: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
    expired: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  };
  
  return (
    <Badge className={colors[status] || colors.draft}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function EstimatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchEstimates();
    }
  }, [page, statusFilter, searchQuery, loading]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchEstimates = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '25');
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/estimates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setEstimates(data.estimates || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    }
  };

  const deleteEstimate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;
    
    try {
      const response = await fetch(`/api/admin/estimates/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEstimates();
      }
    } catch (error) {
      console.error('Error deleting estimate:', error);
    }
  };

  const downloadPdf = async (id: string, estimateNumber?: string) => {
    try {
      const response = await fetch(`/api/admin/estimates/${id}/pdf`);
      if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
        a.download = `${estimateNumber || 'estimate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      } else {
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  // Stats
  const stats = {
    total: total,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent').length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-violet-500" />
          <p className="text-muted-foreground">Loading estimates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
                <p className="text-muted-foreground mt-1">Create and manage software license quotes</p>
              </div>
            </div>
            <Link href="/admin/estimates/create">
              <Button className="bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Estimate
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Estimates</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </CardContent>
            </Card>
            <Card className="bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/30">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-300">{stats.sent}</div>
                <div className="text-sm text-violet-600 dark:text-violet-300">Sent</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{stats.accepted}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-300">Accepted</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by estimate number, company, or contact..."
                  className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:ring-violet-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-foreground focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {estimates.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No estimates yet</h3>
                <p className="text-muted-foreground mb-6">Create your first estimate to get started</p>
                <Link href="/admin/estimates/create">
                  <Button className="bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Estimate
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-muted-foreground">Estimate</TableHead>
                      <TableHead className="text-muted-foreground">Company</TableHead>
                      <TableHead className="text-muted-foreground">Contact</TableHead>
                      <TableHead className="text-right text-muted-foreground">Users</TableHead>
                      <TableHead className="text-right text-muted-foreground">Monthly Total</TableHead>
                      <TableHead className="text-center text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Created</TableHead>
                      <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((estimate) => (
                      <TableRow key={estimate._id} className="border-border hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/admin/estimates/${estimate._id}`} className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300">
                            {estimate.estimateNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{estimate.preparedFor?.companyName || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-foreground">{estimate.preparedFor?.contactName || 'N/A'}</div>
                            {estimate.preparedFor?.email && (
                              <div className="text-xs text-muted-foreground">{estimate.preparedFor.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-foreground">{estimate.numberOfUsers}</span>
                          <span className="text-muted-foreground text-sm ml-1">(T{estimate.moduleTier})</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(estimate.totals?.total || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(estimate.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(estimate.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/estimates/${estimate._id}`}>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/estimates/${estimate._id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/20">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPdf(estimate._id, estimate.estimateNumber)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEstimate(estimate._id)}
                              className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-border flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages} ({total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="border-input text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="border-input text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
