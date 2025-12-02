'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
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
import { Loader2, Search, Eye, Mail, Plus, Settings } from 'lucide-react';

interface GeneratedLetter {
  _id: string;
  companyId: string;
  companyName: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyLocation?: string;
  recipientName?: string;
  recipientTitle?: string;
  status: 'draft' | 'approved' | 'sent' | 'archived';
  aiModel: string;
  createdAt: string;
  updatedAt: string;
}

export default function AllLettersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<GeneratedLetter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchLetters();
    }
  }, [page, statusFilter, searchQuery, loading]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchLetters = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/letters?${params}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch letters');
      }
      const data = await response.json();
      setLetters(data.letters || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error: any) {
      setError(error.message || 'Failed to load letters');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      approved: 'default',
      sent: 'secondary',
      archived: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading letters...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Letters</h1>
                <p className="text-muted-foreground">View and manage all generated letters</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/letter-settings">
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/letters/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Letter
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Letters</CardTitle>
                  <CardDescription>{letters.length} letters found</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by company name, recipient, or content..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="sent">Sent</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {letters.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No letters found</p>
                  <Link href="/admin/letters/create">
                    <Button className="mt-4">Create Your First Letter</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {letters.map((letter) => (
                        <TableRow key={letter._id}>
                          <TableCell className="font-medium">{letter.companyName}</TableCell>
                          <TableCell>
                            {letter.recipientName ? (
                              <div>
                                <div>{letter.recipientName}</div>
                                {letter.recipientTitle && (
                                  <div className="text-sm text-muted-foreground">
                                    {letter.recipientTitle}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{letter.companyLocation || '—'}</TableCell>
                          <TableCell>{getStatusBadge(letter.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {letter.aiModel.split('-')[1] || letter.aiModel}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(letter.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/letters/${letter._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
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



