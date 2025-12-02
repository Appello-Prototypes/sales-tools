'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search, Loader2, Mail, Copy, Download, Building2, Clock, XCircle, RefreshCw, 
  ExternalLink, CheckCircle2, Eye, Settings, Plus, Trash2, Save
} from 'lucide-react';
import { getCompanyLinkClient, getContactLinkClient } from '@/lib/hubspot/hubspotLinks';

// Import types and interfaces
interface HubSpotCompany {
  id: string;
  name: string;
  domain: string;
  website: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  industry: string;
  employees: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  phone: string;
  fullName: string;
}

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  closeDate: string | null;
  pipeline: string;
}

interface ProgressLogItem {
  id: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

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

interface Model {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  default: boolean;
  category: string;
}

interface LetterSettings {
  _id?: string;
  aiModel: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  userPromptTemplate: string;
  approvedSamples: Array<{
    _id?: string;
    name: string;
    content: string;
    description?: string;
    createdAt?: string;
  }>;
}

export default function MarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('letters');
  
  // Letter generation state
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<HubSpotCompany | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companySummary, setCompanySummary] = useState<string>('');
  const [progressLog, setProgressLog] = useState<ProgressLogItem[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [letterId, setLetterId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Letters list state
  const [letters, setLetters] = useState<GeneratedLetter[]>([]);
  const [searchQueryList, setSearchQueryList] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Settings state
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LetterSettings | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [newSampleName, setNewSampleName] = useState('');
  const [newSampleContent, setNewSampleContent] = useState('');
  const [newSampleDescription, setNewSampleDescription] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && activeTab === 'letters') {
      fetchLetters();
    }
  }, [page, statusFilter, searchQueryList, loading, activeTab]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
      if (activeTab === 'settings') {
        await Promise.all([fetchSettings(), fetchModels()]);
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  // Letter generation functions (from cold-call-letters/page.tsx)
  const updateProgress = (id: string, status: ProgressLogItem['status'], message: string) => {
    setProgressLog((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) => (item.id === id ? { ...item, status, message, timestamp: new Date() } : item));
      }
      return [...prev, { id, status, message, timestamp: new Date() }];
    });
  };

  const clearProgressLog = () => {
    setProgressLog([]);
  };

  const fetchCompanies = async (search: string = '') => {
    setIsSearching(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      // Fetch all companies using pagination
      params.append('limit', '50'); // Limit to 50 results for dropdown

      const response = await fetch(`/api/admin/hubspot/companies?${params}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch companies from HubSpot');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchCompanyData = async (companyId: string) => {
    setIsLoadingData(true);
    setError('');
    clearProgressLog();
    setContacts([]);
    setDeals([]);
    setCompanySummary('');
    setSelectedContact(null);
    setGeneratedLetter('');
    setLetterId(null);

    const contactLogId = 'contacts';
    const dealsLogId = 'deals';
    const summaryLogId = 'summary';

    updateProgress(contactLogId, 'loading', 'Fetching contacts...');
    updateProgress(dealsLogId, 'loading', 'Fetching deals...');
    updateProgress(summaryLogId, 'loading', 'Generating AI summary...');

    try {
      const [contactsRes, dealsRes, summaryRes] = await Promise.all([
        fetch(`/api/admin/hubspot/companies/${companyId}/contacts`, { credentials: 'include' }).catch(() => null),
        fetch(`/api/admin/hubspot/companies/${companyId}/deals`, { credentials: 'include' }).catch(() => null),
        fetch(`/api/admin/hubspot/companies/${companyId}/summary`, { credentials: 'include' }).catch(() => null),
      ]);

      if (contactsRes && contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
        updateProgress(contactLogId, 'success', `Found ${contactsData.contacts?.length || 0} contacts`);
        if (contactsData.contacts && contactsData.contacts.length > 0) {
          setSelectedContact(contactsData.contacts[0]);
        }
      } else {
        updateProgress(contactLogId, 'error', 'Failed to fetch contacts');
      }

      if (dealsRes && dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);
        updateProgress(dealsLogId, 'success', `Found ${dealsData.deals?.length || 0} deals`);
      } else {
        updateProgress(dealsLogId, 'error', 'Failed to fetch deals');
      }

      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setCompanySummary(summaryData.summary || '');
        updateProgress(summaryLogId, 'success', 'AI summary generated');
      } else {
        updateProgress(summaryLogId, 'error', 'Failed to generate AI summary');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load company data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(searchQuery);
  };

  const handleGenerateLetter = async () => {
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedLetter('');

    try {
      const response = await fetch('/api/admin/hubspot/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId: selectedCompany.id,
          companyData: selectedCompany,
          recipientName: selectedContact?.fullName || undefined,
          recipientTitle: selectedContact?.jobTitle || undefined,
          companySummary,
          contacts,
          deals,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate letter');
      }

      const data = await response.json();
      setGeneratedLetter(data.letter);
      if (data.letterId) {
        setLetterId(data.letterId);
      }
      // Refresh letters list
      fetchLetters();
    } catch (error: any) {
      setError(error.message || 'Failed to generate letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!letterId || !feedback.trim()) return;
    setIsRegenerating(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/letters/${letterId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate letter');
      }
      const data = await response.json();
      setGeneratedLetter(data.letter);
      setFeedback('');
      fetchLetters();
    } catch (error: any) {
      setError(error.message || 'Failed to regenerate letter');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyLetter = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
    }
  };

  const handleDownloadLetter = () => {
    if (generatedLetter && selectedCompany) {
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cold-call-letter-${selectedCompany.name.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Letters list functions
  const fetchLetters = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (statusFilter) params.append('status', statusFilter);
      if (searchQueryList) params.append('search', searchQueryList);

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

  // Settings functions
  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const response = await fetch('/api/admin/models', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      setModels(data.models || []);
    } catch (error: any) {
      setModels([{
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        description: 'Latest and most capable model',
        recommended: true,
        default: true,
        category: 'latest',
      }]);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/letter-settings', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (error: any) {
      setError(error.message || 'Failed to load settings');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/letter-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      const data = await response.json();
      setSettings(data.settings);
      alert('Settings saved successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSample = () => {
    if (!settings || !newSampleName.trim() || !newSampleContent.trim()) return;
    setSettings({
      ...settings,
      approvedSamples: [
        ...settings.approvedSamples,
        {
          name: newSampleName,
          content: newSampleContent,
          description: newSampleDescription || undefined,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setNewSampleName('');
    setNewSampleContent('');
    setNewSampleDescription('');
  };

  const handleRemoveSample = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      approvedSamples: settings.approvedSamples.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="h-8 w-8" />
                  Marketing
                </h1>
                <p className="text-muted-foreground">
                  Generate cold call letters, manage your library, and configure settings
                </p>
              </div>
              {activeTab === 'letters' && (
                <Button onClick={() => setActiveTab('generate')} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Generate Letter
                </Button>
              )}
              {activeTab === 'generate' && (
                <Button onClick={() => setActiveTab('letters')} variant="outline" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  View All Letters
                </Button>
              )}
              {activeTab === 'settings' && (
                <Button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="letters">All Letters</TabsTrigger>
                <TabsTrigger value="generate">Generate Letter</TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* All Letters Tab */}
              <TabsContent value="letters" className="mt-6">
                {error && (
                  <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <p className="text-red-800">{error}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>All Generated Letters</CardTitle>
                    <CardDescription>{letters.length} letters found</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-4">
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by company name, recipient, or content..."
                            value={searchQueryList}
                            onChange={(e) => {
                              setSearchQueryList(e.target.value);
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
                        <Button onClick={() => setActiveTab('generate')} className="mt-4">
                          Generate Your First Letter
                        </Button>
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
              </TabsContent>

              {/* Generate Letter Tab */}
              <TabsContent value="generate" className="mt-6">
                {error && (
                  <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <p className="text-red-800">{error}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Company Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Select Company from HubSpot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search companies..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <Button type="submit" disabled={isSearching}>
                            {isSearching ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                              </>
                            )}
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-2">
                        <Label>Select Company</Label>
                        <Select
                          value={selectedCompany?.id || ''}
                          onValueChange={(value) => {
                            const company = companies.find(c => c.id === value);
                            setSelectedCompany(company || null);
                            if (company) {
                              fetchCompanyData(company.id);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a company..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.length === 0 ? (
                              <SelectItem value="no-results" disabled>
                                {isSearching ? 'Searching...' : 'No companies found. Try searching.'}
                              </SelectItem>
                            ) : (
                              companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                  {company.city && company.state && ` - ${company.city}, ${company.state}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCompany && (
                        <>
                          <Card className="bg-gray-50">
                            <CardContent className="pt-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">Company:</span>
                                  <span>{selectedCompany.name}</span>
                                  <a
                                    href={getCompanyLinkClient(selectedCompany.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="View in HubSpot"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                {selectedCompany.website && (
                                  <div>
                                    <span className="font-semibold">Website:</span>{' '}
                                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {selectedCompany.website}
                                    </a>
                                  </div>
                                )}
                                {selectedCompany.industry && (
                                  <div><span className="font-semibold">Industry:</span> {selectedCompany.industry}</div>
                                )}
                                {(selectedCompany.city || selectedCompany.state) && (
                                  <div>
                                    <span className="font-semibold">Location:</span>{' '}
                                    {[selectedCompany.city, selectedCompany.state].filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {progressLog.length > 0 && (
                            <Card className="bg-blue-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Loading Progress
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {progressLog.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 text-sm">
                                      {item.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                                      {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                      {item.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                                      {item.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                                      <span className={item.status === 'error' ? 'text-red-600' : item.status === 'success' ? 'text-green-600' : ''}>
                                        {item.message}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {contacts.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Select Recipient</Label>
                                {selectedContact && (
                                  <a
                                    href={getContactLinkClient(selectedContact.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm flex items-center gap-1"
                                    title="View in HubSpot"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View in HubSpot
                                  </a>
                                )}
                              </div>
                              <Select
                                value={selectedContact?.id || ''}
                                onValueChange={(value) => {
                                  const contact = contacts.find(c => c.id === value);
                                  setSelectedContact(contact || null);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a contact..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                      {contact.fullName} {contact.jobTitle && `- ${contact.jobTitle}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <Button
                            onClick={handleGenerateLetter}
                            disabled={!selectedCompany || isGenerating || isLoadingData}
                            className="w-full"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Letter...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Generate Letter
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Generated Letter */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Generated Letter
                          </CardTitle>
                          <CardDescription>
                            {selectedCompany ? `Letter for ${selectedCompany.name}` : 'Select a company to generate a letter'}
                          </CardDescription>
                        </div>
                        {generatedLetter && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopyLetter}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadLetter}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            {letterId && (
                              <Link href={`/admin/letters/${letterId}`}>
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View/Edit
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {generatedLetter ? (
                        <div className="space-y-4">
                          <Textarea
                            value={generatedLetter}
                            readOnly
                            className="min-h-[300px] font-mono text-sm"
                          />
                          {letterId && (
                            <>
                              <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="feedback">Feedback for Regeneration</Label>
                                <Textarea
                                  id="feedback"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="e.g., Make it more formal, focus on cost savings..."
                                  rows={3}
                                />
                                <Button
                                  onClick={handleRegenerate}
                                  disabled={!feedback.trim() || isRegenerating}
                                  variant="outline"
                                  className="w-full"
                                >
                                  {isRegenerating ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Regenerating...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Regenerate with Feedback
                                    </>
                                  )}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center min-h-[400px] text-center text-muted-foreground">
                          <div>
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No letter generated yet.</p>
                            <p className="text-sm mt-2">Select a company and click "Generate Letter" to create a personalized cold call letter.</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                {!settings ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading settings...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* AI Model Configuration */}
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Model Configuration</CardTitle>
                        <CardDescription>Configure the AI model used for letter generation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Model</Label>
                          {loadingModels ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading models...
                            </div>
                          ) : (
                            <Select
                              value={settings.aiModel}
                              onValueChange={(value) => setSettings({ ...settings, aiModel: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model..." />
                              </SelectTrigger>
                              <SelectContent>
                                {models.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    {model.name}
                                    {model.recommended && ' ⭐'}
                                    {model.default && ' (Default)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Max Tokens: {settings.maxTokens}</Label>
                          <Slider
                            value={[settings.maxTokens]}
                            onValueChange={([value]) => setSettings({ ...settings, maxTokens: value })}
                            min={500}
                            max={4000}
                            step={100}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>500 (Short)</span>
                            <span>4000 (Long)</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Temperature: {settings.temperature.toFixed(2)}</Label>
                          <Slider
                            value={[settings.temperature]}
                            onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
                            min={0}
                            max={1}
                            step={0.1}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0.0 (Focused)</span>
                            <span>1.0 (Creative)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Prompts */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Prompts</CardTitle>
                        <CardDescription>Configure system and user prompts for letter generation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="systemPrompt">System Prompt</Label>
                          <Textarea
                            id="systemPrompt"
                            value={settings.systemPrompt}
                            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                            rows={8}
                            className="font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="userPromptTemplate">User Prompt Template</Label>
                          <Textarea
                            id="userPromptTemplate"
                            value={settings.userPromptTemplate}
                            onChange={(e) => setSettings({ ...settings, userPromptTemplate: e.target.value })}
                            rows={12}
                            className="font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">
                            Use template variables: {`{{companyName}}`}, {`{{industry}}`}, {`{{location}}`}, {`{{website}}`}, {`{{employees}}`}, {`{{recipientName}}`}, {`{{recipientTitle}}`}, {`{{companySummary}}`}, {`{{contacts}}`}, {`{{deals}}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Approved Samples */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Approved Sample Letters</CardTitle>
                        <CardDescription>Add sample letters to guide AI generation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4 border p-4 rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="sampleName">Sample Name</Label>
                            <Input
                              id="sampleName"
                              value={newSampleName}
                              onChange={(e) => setNewSampleName(e.target.value)}
                              placeholder="e.g., HVAC Contractor Example"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sampleDescription">Description (Optional)</Label>
                            <Input
                              id="sampleDescription"
                              value={newSampleDescription}
                              onChange={(e) => setNewSampleDescription(e.target.value)}
                              placeholder="Brief description of this sample"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sampleContent">Letter Content</Label>
                            <Textarea
                              id="sampleContent"
                              value={newSampleContent}
                              onChange={(e) => setNewSampleContent(e.target.value)}
                              rows={8}
                              placeholder="Paste the approved letter content here..."
                            />
                          </div>
                          <Button onClick={handleAddSample} disabled={!newSampleName.trim() || !newSampleContent.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sample
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {settings.approvedSamples.map((sample, index) => (
                            <Card key={index} className="bg-gray-50">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{sample.name}</CardTitle>
                                    {sample.description && (
                                      <CardDescription>{sample.description}</CardDescription>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSample(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border">
                                  {sample.content}
                                </pre>
                              </CardContent>
                            </Card>
                          ))}
                          {settings.approvedSamples.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">No approved samples yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
}

