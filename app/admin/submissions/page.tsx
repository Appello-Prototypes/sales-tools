'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Filter,
  Search,
  Eye,
  Trash2,
  Flag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Briefcase,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Assessment {
  _id: string;
  submissionId: string;
  name?: string;
  email?: string;
  companyName?: string;
  status: string;
  opportunityScore?: number;
  opportunityGrade?: string;
  opportunityPriority?: string;
  flagged?: boolean;
  auditTrail?: any;
  section1?: {
    trade?: string;
    fieldWorkers?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    flagged: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'createdAt', direction: 'desc' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<{ submissionId: string; name?: string } | null>(null);
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState<any>(null);
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.flagged, filters.search, loading]);

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

  const fetchAssessments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.flagged && filters.flagged !== 'all') {
        params.append('flagged', filters.flagged === 'flagged' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/assessments?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        return;
      }
      
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleDeleteClick = (submissionId: string, name?: string) => {
    setAssessmentToDelete({ submissionId, name });
    setShowDeleteDialog(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedAssessments.size === 0) return;
    setShowDeleteDialog(true);
    setAssessmentToDelete({ submissionId: 'bulk', name: `${selectedAssessments.size} assessment(s)` });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssessments(new Set(sortedAndFilteredAssessments.map(a => a.submissionId)));
    } else {
      setSelectedAssessments(new Set());
    }
  };

  const handleSelectAssessment = (submissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedAssessments);
    if (checked) {
      newSelected.add(submissionId);
    } else {
      newSelected.delete(submissionId);
    }
    setSelectedAssessments(newSelected);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    if (assessmentToDelete.submissionId === 'bulk') {
      setIsBulkDeleting(true);
      try {
        const submissionIds = Array.from(selectedAssessments);
        const response = await fetch('/api/admin/assessments/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionIds }),
        });

        if (response.ok) {
          await fetchAssessments();
          setSelectedAssessments(new Set());
          setShowDeleteDialog(false);
          setAssessmentToDelete(null);
        }
      } catch (error) {
        console.error('Error bulk deleting assessments:', error);
      } finally {
        setIsBulkDeleting(false);
      }
    } else {
      setDeletingId(assessmentToDelete.submissionId);
      try {
        const response = await fetch(`/api/admin/assessments/${assessmentToDelete.submissionId}/delete`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchAssessments();
          setSelectedAssessments(prev => {
            const newSet = new Set(prev);
            newSet.delete(assessmentToDelete.submissionId);
            return newSet;
          });
          setShowDeleteDialog(false);
          setAssessmentToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting assessment:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFlag = async (submissionId: string, flagged: boolean) => {
    try {
      const response = await fetch(`/api/admin/assessments/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged }),
      });

      if (response.ok) {
        await fetchAssessments();
      }
    } catch (error) {
      console.error('Error flagging assessment:', error);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 dark:text-green-500';
      case 'B+':
      case 'B':
        return 'text-blue-600 dark:text-blue-500';
      case 'C+':
      case 'C':
        return 'text-yellow-600 dark:text-yellow-500';
      default:
        return 'text-gray-600 dark:text-muted-foreground';
    }
  };

  const sortedAndFilteredAssessments = [...assessments]
    .filter((assessment) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          assessment.companyName?.toLowerCase().includes(searchLower) ||
          assessment.name?.toLowerCase().includes(searchLower) ||
          assessment.email?.toLowerCase().includes(searchLower) ||
          assessment.submissionId.toLowerCase().includes(searchLower) ||
          assessment.section1?.trade?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;

      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'companyName':
          aValue = a.companyName || '';
          bValue = b.companyName || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'score':
          aValue = a.opportunityScore ?? -1;
          bValue = b.opportunityScore ?? -1;
          break;
        case 'priority':
          aValue = a.opportunityPriority || '';
          bValue = b.opportunityPriority || '';
          break;
        case 'createdAt':
          aValue = new Date(a.completedAt || a.createdAt).getTime();
          bValue = new Date(b.completedAt || b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const isAllSelected = sortedAndFilteredAssessments.length > 0 && 
    sortedAndFilteredAssessments.every(a => selectedAssessments.has(a.submissionId));
  const isSomeSelected = selectedAssessments.size > 0 && !isAllSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      (selectAllCheckboxRef.current as HTMLInputElement).indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">All Submissions</h1>
            <p className="text-muted-foreground">
              View and manage all assessment submissions
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Company name, ID, trade..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) => setFilters({ ...filters, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flagged</label>
                  <Select
                    value={filters.flagged}
                    onValueChange={(value) => setFilters({ ...filters, flagged: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="unflagged">Not Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>
                    {sortedAndFilteredAssessments.length} assessment{sortedAndFilteredAssessments.length !== 1 ? 's' : ''} found
                    {selectedAssessments.size > 0 && (
                      <span className="ml-2 font-semibold text-foreground">
                        • {selectedAssessments.size} selected
                      </span>
                    )}
                  </CardDescription>
                </div>
                {selectedAssessments.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDeleteClick}
                    disabled={isBulkDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedAssessments.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          ref={selectAllCheckboxRef}
                          checked={isAllSelected}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-foreground"
                        >
                          Name {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center hover:text-foreground"
                        >
                          Email {getSortIcon('email')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('companyName')}
                          className="flex items-center hover:text-foreground"
                        >
                          Company {getSortIcon('companyName')}
                        </button>
                      </TableHead>
                      <TableHead>Trade</TableHead>
                      <TableHead>Field Workers</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-foreground"
                        >
                          Status {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('score')}
                          className="flex items-center hover:text-foreground"
                        >
                          Score {getSortIcon('score')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('priority')}
                          className="flex items-center hover:text-foreground"
                        >
                          Priority {getSortIcon('priority')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center hover:text-foreground"
                        >
                          Submitted {getSortIcon('createdAt')}
                        </button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                          No assessments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAndFilteredAssessments.map((assessment: any) => (
                        <TableRow 
                          key={assessment._id} 
                          className={assessment.flagged ? 'bg-yellow-50' : selectedAssessments.has(assessment.submissionId) ? 'bg-blue-50' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedAssessments.has(assessment.submissionId)}
                              onCheckedChange={(checked) => handleSelectAssessment(assessment.submissionId, checked === true)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select ${assessment.name || assessment.submissionId}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {assessment.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {assessment.email ? (
                              <a href={`mailto:${assessment.email}`} className="text-blue-600 hover:underline">
                                {assessment.email}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {assessment.companyName || 'N/A'}
                          </TableCell>
                          <TableCell>{assessment.section1?.trade || 'N/A'}</TableCell>
                          <TableCell>{assessment.section1?.fieldWorkers || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                              {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assessment.opportunityScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{assessment.opportunityScore}/100</span>
                                <span className={`text-sm font-medium ${getGradeColor(assessment.opportunityGrade)}`}>
                                  {assessment.opportunityGrade}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assessment.opportunityPriority && (
                              <Badge className={getPriorityColor(assessment.opportunityPriority)}>
                                {assessment.opportunityPriority}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {assessment.completedAt
                              ? new Date(assessment.completedAt).toLocaleString()
                              : new Date(assessment.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/assessments/${assessment.submissionId}`}>
                                <Button variant="ghost" size="sm" title="View Assessment Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {(assessment as any).adminReport && (
                                <Link href={`/admin/reports/${assessment.submissionId}`}>
                                  <Button variant="ghost" size="sm" title="View Internal Report" className="text-green-600 hover:text-green-700">
                                    <Briefcase className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {assessment.auditTrail && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAuditTrail(assessment.auditTrail);
                                    setShowAuditTrail(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="View AI Audit Trail"
                                  type="button"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFlag(assessment.submissionId, !assessment.flagged);
                                }}
                                className={assessment.flagged ? 'text-yellow-600' : ''}
                                title={assessment.flagged ? 'Unflag' : 'Flag'}
                                type="button"
                              >
                                <Flag className={`h-4 w-4 ${assessment.flagged ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(assessment.submissionId, assessment.name);
                                }}
                                disabled={deletingId === assessment.submissionId}
                                className="text-red-600 hover:text-red-700"
                                title="Delete"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assessmentToDelete?.submissionId === 'bulk' ? 'Delete Multiple Assessments' : 'Delete Assessment'}
            </DialogTitle>
            <DialogDescription>
              {assessmentToDelete?.submissionId === 'bulk' ? (
                <>
                  Are you sure you want to delete {selectedAssessments.size} assessment{selectedAssessments.size !== 1 ? 's' : ''}? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete this assessment? This action cannot be undone.
                  {assessmentToDelete?.name && (
                    <span className="block mt-2 font-semibold text-foreground">
                      Assessment by: {assessmentToDelete.name}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setAssessmentToDelete(null);
              }}
              disabled={deletingId !== null || isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null || isBulkDeleting}
            >
              {deletingId || isBulkDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

