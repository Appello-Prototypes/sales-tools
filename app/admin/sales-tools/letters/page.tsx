/**
 * @deprecated This page is deprecated. Please use Letter Studio instead.
 * 
 * Letter Studio provides:
 * - AI-powered multiagent research
 * - Complete session history
 * - Draft versioning
 * - Enhanced research insights
 * 
 * Redirect to: /admin/letter-studio
 */

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, Loader2, Mail, Copy, Download, Building2, Clock, XCircle, RefreshCw, 
  ExternalLink, CheckCircle2, Eye, Settings, Plus, Trash2, Save, Edit2, 
  Copy as CopyIcon, ChevronUp, ChevronDown, FileText, Zap, AlertCircle,
  CheckCircle, Info, HelpCircle, Sparkles
} from 'lucide-react';

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
  company?: string;
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

interface LetterType {
  _id?: string;
  name: string;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isDefault: boolean;
}

export default function LetterGeneratorPage() {
  const router = useRouter();
  
  // Redirect to Letter Studio on mount
  useEffect(() => {
    router.replace('/admin/letter-studio');
  }, [router]);
  
  // Return loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Letter Studio...</p>
      </div>
    </div>
  );
  
  // Letter generation state
  const [searchMode, setSearchMode] = useState<'company' | 'contact'>('company');
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<HubSpotCompany | null>(null);
  const [selectedContactFromSearch, setSelectedContactFromSearch] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [selectedLetterType, setSelectedLetterType] = useState<string>('Cold Call');
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
  const [editingSampleIndex, setEditingSampleIndex] = useState<number | null>(null);
  const [editedSampleName, setEditedSampleName] = useState('');
  const [editedSampleContent, setEditedSampleContent] = useState('');
  const [editedSampleDescription, setEditedSampleDescription] = useState('');
  const [showTemplateHelper, setShowTemplateHelper] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');

  useEffect(() => {
    checkAuth();
    fetchLetterTypes();
  }, []);

  useEffect(() => {
    if (searchMode === 'company') {
      setAllContacts([]);
      setSelectedContactFromSearch(null);
    } else {
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [searchMode]);

  useEffect(() => {
    // Load initial companies when generate tab becomes active and in company mode
    if (activeTab === 'generate' && searchMode === 'company' && !searchQuery && !isSearching) {
      const timer = setTimeout(() => {
        fetchCompanies('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchMode]);

  // Debounced search effect
  useEffect(() => {
    if (activeTab !== 'generate') return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        if (searchMode === 'company') {
          fetchCompanies(searchQuery);
        } else {
          fetchContacts(searchQuery);
        }
      } else if (searchMode === 'company') {
        // Load initial companies if search is cleared
        fetchCompanies('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, activeTab]);

  useEffect(() => {
    if (!loading && activeTab === 'letters') {
      fetchLetters();
    }
  }, [page, statusFilter, searchQueryList, loading, activeTab]);

  useEffect(() => {
    if (!loading && activeTab === 'settings' && !settings) {
      Promise.all([fetchSettings(), fetchModels()]);
    }
  }, [activeTab, loading]);

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
      if (search && search.trim().length >= 2) {
        params.append('search', search.trim());
      }
      // Use MongoDB cache (useSync=true by default) and limit results
      params.append('limit', '50'); // Limit to 50 results for dropdown
      // Don't use fetchAll - we want fast, limited results

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
      
      if (data.companies && data.companies.length === 0 && search) {
        setError('No companies found matching your search. Try a different search term.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch companies from HubSpot');
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchContacts = async (search: string = '') => {
    setIsSearching(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '50');
      // Force HubSpot API if MongoDB is empty
      params.append('useSync', 'false');

      const response = await fetch(`/api/admin/hubspot/contacts?${params}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || `Failed to fetch contacts (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setAllContacts(data.contacts || []);
      
      if (data.contacts && data.contacts.length === 0 && search) {
        setError('No contacts found matching your search. Try a different search term.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch contacts from HubSpot');
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchLetterTypes = async () => {
    try {
      const response = await fetch('/api/admin/letter-types', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setLetterTypes(data.letterTypes || []);
        const defaultType = data.letterTypes?.find((t: LetterType) => t.isDefault);
        if (defaultType) {
          setSelectedLetterType(defaultType.name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch letter types:', error);
      // Set default letter types
      setLetterTypes([
        { name: 'Cold Call', description: 'Outreach to potential customers', isDefault: true, systemPrompt: '', userPromptTemplate: '' },
        { name: 'Internal', description: 'Internal company communications', isDefault: false, systemPrompt: '', userPromptTemplate: '' },
      ]);
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
    if (searchMode === 'company') {
      fetchCompanies(searchQuery);
    } else {
      fetchContacts(searchQuery);
    }
  };

  const handleExportPDF = async () => {
    if (!generatedLetter) return;
    
    try {
      const response = await fetch('/api/admin/letters/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          letterId: letterId,
          letterContent: generatedLetter,
          recipientName: selectedContact?.fullName || selectedContactFromSearch?.fullName,
          recipientTitle: selectedContact?.jobTitle || selectedContactFromSearch?.jobTitle,
          companyName: selectedCompany?.name || selectedContactFromSearch?.company,
          companyAddress: selectedCompany ? `${selectedCompany.city || ''}, ${selectedCompany.state || ''}`.trim() : '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appello-letter-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Open print dialog for PDF
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleGenerateLetter = async () => {
    if (searchMode === 'company' && !selectedCompany) {
      setError('Please select a company first');
      return;
    }
    if (searchMode === 'contact' && !selectedContactFromSearch) {
      setError('Please select a contact first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedLetter('');

    try {
      const requestBody: any = {
        letterType: selectedLetterType,
      };

      if (searchMode === 'company') {
        requestBody.companyId = selectedCompany!.id;
        requestBody.companyData = selectedCompany;
        requestBody.recipientName = selectedContact?.fullName || undefined;
        requestBody.recipientTitle = selectedContact?.jobTitle || undefined;
        requestBody.companySummary = companySummary;
        requestBody.contacts = contacts;
        requestBody.deals = deals;
      } else {
        // Contact mode
        requestBody.contactId = selectedContactFromSearch!.id;
        requestBody.recipientName = selectedContactFromSearch!.fullName;
        requestBody.recipientTitle = selectedContactFromSearch!.jobTitle || undefined;
        requestBody.recipientEmail = selectedContactFromSearch!.email || undefined;
        requestBody.companyName = selectedContactFromSearch!.company || undefined;
        // Fetch company summary if we have company name
        if (selectedContactFromSearch!.company) {
          // You might want to search for the company and get its summary
        }
      }

      const response = await fetch('/api/admin/hubspot/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
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
    if (generatedLetter) {
      const companyName = selectedCompany?.name || selectedContactFromSearch?.company || 'letter';
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appello-letter-${companyName.replace(/\s+/g, '-')}.txt`;
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
      setSettingsChanged(false);
      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMsg.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Settings saved successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const templateVariables = [
    { var: '{{companyName}}', desc: 'Company name' },
    { var: '{{industry}}', desc: 'Company industry' },
    { var: '{{location}}', desc: 'Company location (city, state)' },
    { var: '{{website}}', desc: 'Company website URL' },
    { var: '{{employees}}', desc: 'Number of employees' },
    { var: '{{recipientName}}', desc: 'Recipient full name' },
    { var: '{{recipientTitle}}', desc: 'Recipient job title' },
    { var: '{{companySummary}}', desc: 'AI-generated company summary' },
    { var: '{{contacts}}', desc: 'List of key contacts' },
    { var: '{{deals}}', desc: 'List of active deals' },
  ];

  const insertTemplateVariable = (variable: string, field: 'systemPrompt' | 'userPromptTemplate') => {
    if (!settings) return;
    const textarea = document.getElementById(field) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = settings[field];
      const newText = text.substring(0, start) + variable + text.substring(end);
      setSettings({ ...settings, [field]: newText });
      setSettingsChanged(true);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleEditSample = (index: number) => {
    if (!settings) return;
    const sample = settings.approvedSamples[index];
    setEditingSampleIndex(index);
    setEditedSampleName(sample.name);
    setEditedSampleContent(sample.content);
    setEditedSampleDescription(sample.description || '');
  };

  const handleSaveEditSample = () => {
    if (!settings || editingSampleIndex === null) return;
    const updatedSamples = [...settings.approvedSamples];
    updatedSamples[editingSampleIndex] = {
      ...updatedSamples[editingSampleIndex],
      name: editedSampleName,
      content: editedSampleContent,
      description: editedSampleDescription || undefined,
    };
    setSettings({ ...settings, approvedSamples: updatedSamples });
    setSettingsChanged(true);
    setEditingSampleIndex(null);
    setEditedSampleName('');
    setEditedSampleContent('');
    setEditedSampleDescription('');
  };

  const handleDuplicateSample = (index: number) => {
    if (!settings) return;
    const sample = settings.approvedSamples[index];
    setSettings({
      ...settings,
      approvedSamples: [
        ...settings.approvedSamples,
        {
          ...sample,
          name: `${sample.name} (Copy)`,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setSettingsChanged(true);
  };

  const handleMoveSample = (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= settings.approvedSamples.length) return;
    const updatedSamples = [...settings.approvedSamples];
    [updatedSamples[index], updatedSamples[newIndex]] = [updatedSamples[newIndex], updatedSamples[index]];
    setSettings({ ...settings, approvedSamples: updatedSamples });
    setSettingsChanged(true);
  };

  const validateTemplateVariables = (text: string) => {
    const validVars = templateVariables.map(v => v.var.replace(/[{}]/g, ''));
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    const invalidVars = matches.filter(m => {
      const varName = m.replace(/[{}]/g, '');
      return !validVars.includes(varName);
    });
    return { valid: invalidVars.length === 0, invalidVars };
  };

  const getPromptStats = (text: string) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const lines = text.split('\n').length;
    return { words, chars, lines };
  };

  const handlePreviewPrompt = () => {
    if (!settings) return;
    // Create a preview with example data
    let preview = settings.userPromptTemplate
      .replace(/\{\{companyName\}\}/g, 'Acme Construction Inc.')
      .replace(/\{\{industry\}\}/g, 'Electrical Contracting')
      .replace(/\{\{location\}\}/g, 'Chicago, IL')
      .replace(/\{\{website\}\}/g, 'https://acmeconstruction.com')
      .replace(/\{\{employees\}\}/g, '50-100')
      .replace(/\{\{recipientName\}\}/g, 'John Smith')
      .replace(/\{\{recipientTitle\}\}/g, 'Operations Manager')
      .replace(/\{\{companySummary\}\}/g, 'Acme Construction is a mid-sized electrical contractor specializing in commercial projects. They have been in business for 15 years and focus on ICI projects.')
      .replace(/\{\{contacts\}\}/g, '- John Smith (Operations Manager) - john@acme.com\n- Jane Doe (Project Manager) - jane@acme.com')
      .replace(/\{\{deals\}\}/g, '- Office Building Renovation - Stage: Negotiation - Value: $250,000');
    
    // Remove conditional blocks for preview
    preview = preview.replace(/\{\{#if\s+\w+\}\}/g, '');
    preview = preview.replace(/\{\{\/if\}\}/g, '');
    preview = preview.replace(/\{\{[^}]+\}\}/g, '[Variable]');
    
    setPreviewPrompt(preview);
    setShowPreviewDialog(true);
  };

  // Track settings changes
  useEffect(() => {
    if (settings) {
      // Reset changed flag when settings are loaded
      setSettingsChanged(false);
    }
  }, [settings?._id]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && activeTab === 'settings') {
        e.preventDefault();
        if (settingsChanged && settings) {
          handleSaveSettings();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsChanged, settings, activeTab]);

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
    setSettingsChanged(true);
    setNewSampleName('');
    setNewSampleContent('');
    setNewSampleDescription('');
  };

  const handleRemoveSample = (index: number) => {
    if (!settings) return;
    if (confirm('Are you sure you want to remove this sample?')) {
      setSettings({
        ...settings,
        approvedSamples: settings.approvedSamples.filter((_, i) => i !== index),
      });
      setSettingsChanged(true);
    }
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

          {/* Letters Table */}
          <div>
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
          </div>
        </div>
      </div>
    );
}
