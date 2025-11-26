'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Mail, Copy, Download, Building2, Clock, XCircle, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';

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

export default function ColdCallLettersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
      fetchCompanies();
    } catch (error) {
      router.push('/admin/login');
    }
  };

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
      params.append('limit', '50');

      const response = await fetch(`/api/admin/hubspot/companies?${params}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || `Failed to fetch companies (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch companies from HubSpot');
      console.error('Error fetching companies:', error);
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

    // Initialize progress log items
    const contactLogId = 'contacts';
    const dealsLogId = 'deals';
    const summaryLogId = 'summary';

    updateProgress(contactLogId, 'loading', 'Fetching contacts...');
    updateProgress(dealsLogId, 'loading', 'Fetching deals...');
    updateProgress(summaryLogId, 'loading', 'Generating AI summary...');

    try {
      // Fetch contacts, deals, and summary in parallel
      const [contactsRes, dealsRes, summaryRes] = await Promise.all([
        fetch(`/api/admin/hubspot/companies/${companyId}/contacts`, { credentials: 'include' }).catch(() => null),
        fetch(`/api/admin/hubspot/companies/${companyId}/deals`, { credentials: 'include' }).catch(() => null),
        fetch(`/api/admin/hubspot/companies/${companyId}/summary`, { credentials: 'include' }).catch(() => null),
      ]);

      // Process contacts
      if (contactsRes && contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
        updateProgress(contactLogId, 'success', `Found ${contactsData.contacts?.length || 0} contacts`);
        // Auto-select first contact if available
        if (contactsData.contacts && contactsData.contacts.length > 0) {
          setSelectedContact(contactsData.contacts[0]);
        }
      } else {
        updateProgress(contactLogId, 'error', 'Failed to fetch contacts');
      }

      // Process deals
      if (dealsRes && dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);
        updateProgress(dealsLogId, 'success', `Found ${dealsData.deals?.length || 0} deals`);
      } else {
        updateProgress(dealsLogId, 'error', 'Failed to fetch deals');
      }

      // Process summary
      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setCompanySummary(summaryData.summary || '');
        updateProgress(summaryLogId, 'success', 'AI summary generated');
      } else {
        updateProgress(summaryLogId, 'error', 'Failed to generate AI summary');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load company data');
      updateProgress(contactLogId, 'error', 'Error loading data');
      updateProgress(dealsLogId, 'error', 'Error loading data');
      updateProgress(summaryLogId, 'error', 'Error loading data');
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
    } catch (error: any) {
      setError(error.message || 'Failed to generate letter');
      console.error('Error generating letter:', error);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate letter');
      }
      const data = await response.json();
      setGeneratedLetter(data.letter);
      setFeedback('');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cold Call Letter Generator</h1>
            <p className="text-muted-foreground">
              Generate personalized cold call letters for HubSpot companies
            </p>
          </div>

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
                <CardDescription>
                  Search and select a company to generate a personalized letter
                </CardDescription>
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
                          <div>
                            <span className="font-semibold">Company:</span> {selectedCompany.name}
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
                            <div>
                              <span className="font-semibold">Industry:</span> {selectedCompany.industry}
                            </div>
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

                    {/* Progress Log */}
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

                    {/* Contact Selection */}
                    {contacts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Select Recipient</Label>
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
                        {selectedContact && (
                          <div className="text-sm text-muted-foreground">
                            <div>Name: {selectedContact.fullName}</div>
                            {selectedContact.jobTitle && <div>Title: {selectedContact.jobTitle}</div>}
                            {selectedContact.email && <div>Email: {selectedContact.email}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generate Button */}
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">Generated</Badge>
                      <span>Ready to copy, download, or edit</span>
                    </div>
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
        </div>
      </div>
    </AdminLayout>
  );
}
