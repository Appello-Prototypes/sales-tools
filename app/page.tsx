'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TestTube,
  Sparkles,
  Settings,
  FileText,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  BarChart3,
  Briefcase,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { TestAssessmentLogs } from '@/components/admin/TestAssessmentLogs';

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
  debugLog?: any;
  adminReport?: any;
  section1?: {
    trade?: string;
    fieldWorkers?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    highPriority: 0,
    averageScore: 0,
    averageROI: 0,
    totalPotentialSavings: 0,
    flaggedCount: 0,
  });
  const [recentHighPriority, setRecentHighPriority] = useState<Assessment[]>([]);
  const [recentActivity, setRecentActivity] = useState<Assessment[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    flagged: 'all',
  });
  const [page, setPage] = useState(1);
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
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [showTestLogs, setShowTestLogs] = useState(false);
  const [testAssessmentResult, setTestAssessmentResult] = useState<{
    submissionId: string;
    name: string;
    email: string;
    trade: string;
    reportUrl: string;
    adminUrl: string;
    adminReportUrl?: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.flagged, filters.search, page, loading]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
      fetchAssessments();
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
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/admin/assessments?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        
        // Show error but don't clear existing data
        console.error('Failed to fetch assessments:', errorData);
        return;
      }
      
      const data = await response.json();
      setAssessments(data.assessments);
      
      // Calculate stats
      const completed = data.assessments.filter((a: Assessment) => a.status === 'completed');
      const inProgress = data.assessments.filter((a: Assessment) => a.status === 'in_progress');
      const highPriority = data.assessments.filter((a: Assessment) => a.opportunityPriority === 'High');
      const flagged = data.assessments.filter((a: Assessment) => a.flagged);
      
      // Calculate advanced metrics for completed assessments
      const completedWithScores = completed.filter((a: Assessment) => a.opportunityScore !== undefined);
      const averageScore = completedWithScores.length > 0
        ? Math.round(completedWithScores.reduce((sum: number, a: Assessment) => sum + (a.opportunityScore || 0), 0) / completedWithScores.length)
        : 0;
      
      // Get recent high priority assessments (last 5)
      const recentHighPriorityList = [...highPriority]
        .sort((a, b) => {
          const aTime = new Date(a.completedAt || a.createdAt).getTime();
          const bTime = new Date(b.completedAt || b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 5);
      
      // Get recent activity (last 10 completed assessments)
      const recentActivityList = [...completed]
        .sort((a, b) => {
          const aTime = new Date(a.completedAt || a.createdAt).getTime();
          const bTime = new Date(b.completedAt || b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 10);
      
      setRecentHighPriority(recentHighPriorityList);
      setRecentActivity(recentActivityList);
      
      setStats({
        total: data.pagination.total,
        completed: completed.length,
        inProgress: inProgress.length,
        highPriority: highPriority.length,
        averageScore,
        averageROI: 0, // Will be calculated if we fetch ROI data
        totalPotentialSavings: 0, // Will be calculated if we fetch ROI data
        flaggedCount: flagged.length,
      });
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

  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    if (assessmentToDelete.submissionId === 'bulk') {
      // Bulk delete
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
        } else {
          const error = await response.json();
          alert(`Failed to delete: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error bulk deleting assessments:', error);
        alert('Failed to delete assessments');
      } finally {
        setIsBulkDeleting(false);
      }
    } else {
      // Single delete
      setDeletingId(assessmentToDelete.submissionId);
      try {
        const response = await fetch(`/api/admin/assessments/${assessmentToDelete.submissionId}/delete`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh assessments
          await fetchAssessments();
          setSelectedAssessments(prev => {
            const newSet = new Set(prev);
            newSet.delete(assessmentToDelete.submissionId);
            return newSet;
          });
          setShowDeleteDialog(false);
          setAssessmentToDelete(null);
        } else {
          const error = await response.json();
          alert(`Failed to delete: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting assessment:', error);
        alert('Failed to delete assessment');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleCreateTestAssessment = () => {
    setShowTestLogs(true);
  };

  const handleTestAssessmentComplete = (result: any) => {
    setTestAssessmentResult({
      submissionId: result.submissionId,
      name: result.data.name,
      email: result.data.email,
      trade: result.data.trade,
      reportUrl: result.reportUrl,
      adminUrl: result.adminUrl,
      adminReportUrl: result.adminReportUrl,
    });
    setIsCreatingTest(false);
    // Refresh assessments list
    fetchAssessments();
  };

  const handleTestLogsClose = () => {
    setShowTestLogs(false);
    setIsCreatingTest(false);
  };

  const handleCreateTestAssessmentOld = async () => {
    setIsCreatingTest(true);
    setTestAssessmentResult(null);
    
    try {
      const response = await fetch('/api/admin/test-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create test assessment');
      }
      
      const result = await response.json();
      setTestAssessmentResult({
        submissionId: result.submissionId,
        name: result.data.name,
        email: result.data.email,
        trade: result.data.trade,
        reportUrl: result.reportUrl,
        adminUrl: result.adminUrl,
      });
      
      // Refresh assessments list to get the audit trail
      await fetchAssessments();
      
      // Log audit trail status
      if (result.auditTrailGenerated) {
        console.log('✅ Audit trail generated successfully');
      } else {
        console.warn('⚠️ Audit trail generation may have failed');
      }
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        setTestAssessmentResult(null);
      }, 10000);
    } catch (error: any) {
      console.error('Error creating test assessment:', error);
      alert(`Failed to create test assessment: ${error.message}`);
    } finally {
      setIsCreatingTest(false);
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
        // Refresh assessments from database to ensure persistence
        await fetchAssessments();
      } else {
        const error = await response.json();
        alert(`Failed to ${flagged ? 'flag' : 'unflag'}: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error flagging assessment:', error);
      alert(`Failed to ${flagged ? 'flag' : 'unflag'} assessment`);
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
        return 'text-green-600';
      case 'B+':
      case 'B':
        return 'text-blue-600';
      case 'C+':
      case 'C':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // Note: Flagged filtering is now handled server-side via API
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
      // Client-side flagged filter removed - now handled by API
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
      <AdminLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Overview of assessment submissions and statistics</p>
            </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completed` : 'No assessments yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed > 0 ? `${Math.round((stats.highPriority / stats.completed) * 100)}% of completed` : 'Requires attention'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageScore}/100</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completed > 0 ? `${stats.completed} scored assessments` : 'No scores yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.flaggedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assessments marked for follow-up
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent High Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Access key features quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/submissions">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Submissions
                </Button>
              </Link>
              <Link href="/admin/crm">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  CRM Dashboard
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics & Reports
                </Button>
              </Link>
              <Link href="/admin/integrations">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Integrations
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent High Priority Assessments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle>Recent High Priority</CardTitle>
                </div>
                <Link href="/admin/submissions?priority=High">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              <CardDescription>Top opportunities requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {recentHighPriority.length > 0 ? (
                <div className="space-y-3">
                  {recentHighPriority.map((assessment) => (
                    <Link
                      key={assessment._id}
                      href={`/admin/assessments/${assessment.submissionId}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {assessment.companyName || assessment.name || 'Unknown Company'}
                            </span>
                            <Badge className={getPriorityColor(assessment.opportunityPriority)}>
                              {assessment.opportunityPriority}
                            </Badge>
                            {assessment.opportunityScore !== undefined && (
                              <Badge variant="outline" className={getGradeColor(assessment.opportunityGrade)}>
                                {assessment.opportunityScore}/100 ({assessment.opportunityGrade})
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {assessment.section1?.trade && (
                              <span>{assessment.section1.trade}</span>
                            )}
                            {assessment.email && (
                              <span>{assessment.email}</span>
                            )}
                            <span>
                              {new Date(assessment.completedAt || assessment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No high priority assessments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <Link href="/admin/submissions">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Latest completed assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((assessment) => (
                  <Link
                    key={assessment._id}
                    href={`/admin/assessments/${assessment.submissionId}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(assessment.opportunityPriority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {assessment.companyName || assessment.name || 'Unknown Company'}
                          </span>
                          {assessment.opportunityScore !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {assessment.opportunityScore}/100
                            </Badge>
                          )}
                          {assessment.opportunityGrade && (
                            <Badge variant="outline" className={`text-xs ${getGradeColor(assessment.opportunityGrade)}`}>
                              {assessment.opportunityGrade}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {assessment.section1?.trade && <span>{assessment.section1.trade}</span>}
                          <span>
                            {new Date(assessment.completedAt || assessment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assessment.adminReport && (
                        <Link href={`/admin/reports/${assessment.submissionId}`}>
                          <Button variant="ghost" size="sm" title="View Sales Intelligence Report">
                            <Briefcase className="h-4 w-4 text-green-600" />
                          </Button>
                        </Link>
                      )}
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Assessment Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Testing Tools</CardTitle>
              </div>
            </div>
            <CardDescription>
              Create test assessments with real-time transparency - see every step as it happens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleCreateTestAssessment}
                disabled={isCreatingTest}
                className="w-full sm:w-auto"
              >
                {isCreatingTest ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Creating Test Assessment...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Create Test Assessment (with Live Logs)
                  </>
                )}
              </Button>
              
              {testAssessmentResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">Test Assessment Created Successfully!</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><strong>Name:</strong> {testAssessmentResult.name}</p>
                        <p><strong>Email:</strong> {testAssessmentResult.email}</p>
                        <p><strong>Trade:</strong> {testAssessmentResult.trade}</p>
                        <p><strong>Submission ID:</strong> {testAssessmentResult.submissionId}</p>
                        <p className="mt-2 text-xs text-green-700">
                          💡 <strong>Tip:</strong> Look for the <FileText className="h-3 w-3 inline" /> icon next to this assessment in the table to view the AI audit trail
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(testAssessmentResult.reportUrl, '_blank')}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Customer Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(testAssessmentResult.adminUrl, '_blank')}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Admin Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTestAssessmentResult(null);
                            fetchAssessments();
                          }}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Test Assessment Logs Dialog - Full Screen */}
      {showTestLogs && (
        <TestAssessmentLogs
          onComplete={handleTestAssessmentComplete}
          onClose={handleTestLogsClose}
        />
      )}
    </AdminLayout>
  );
}
