'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Search,
  Mail,
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  X,
  Database,
  PenLine,
  Globe,
  FileText,
  Settings,
  Sparkles,
  History,
  Calendar,
} from 'lucide-react';

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

interface ManualCompanyData {
  name: string;
  industry: string;
  city: string;
  state: string;
  employees: string;
  website: string;
  phone: string;
  address: string;
}

interface ManualContactData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
}

type SourceType = 'hubspot' | 'scratch' | null;

const STEPS_HUBSPOT = [
  { id: 1, title: 'Choose Source', description: 'Select data source for the letter' },
  { id: 2, title: 'Select Company & Recipient', description: 'Choose the company and contact' },
  { id: 3, title: 'Configure Letter', description: 'Set purpose, research, and examples' },
  { id: 4, title: 'Writing Letter', description: 'AI is generating your personalized letter' },
  { id: 5, title: 'Generated Letter', description: 'Your personalized letter is ready' },
];

const STEPS_SCRATCH = [
  { id: 1, title: 'Choose Source', description: 'Select data source for the letter' },
  { id: 2, title: 'Enter Details', description: 'Enter company and recipient information' },
  { id: 3, title: 'Configure Letter', description: 'Set purpose, research, and examples' },
  { id: 4, title: 'Writing Letter', description: 'AI is generating your personalized letter' },
  { id: 5, title: 'Generated Letter', description: 'Your personalized letter is ready' },
];

export default function CreateLetterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Source selection
  const [sourceType, setSourceType] = useState<SourceType>(null);
  
  // HubSpot flow: Company selection
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<HubSpotCompany | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // HubSpot flow: Recipient selection
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // Manual entry data
  const [manualCompany, setManualCompany] = useState<ManualCompanyData>({
    name: '',
    industry: '',
    city: '',
    state: '',
    employees: '',
    website: '',
    phone: '',
    address: '',
  });
  const [manualContact, setManualContact] = useState<ManualContactData>({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
  });
  
  // Review step (kept for backward compatibility but not used in UI)
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companySummary, setCompanySummary] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Letter configuration
  const [letterTypes, setLetterTypes] = useState<any[]>([]);
  const [selectedLetterType, setSelectedLetterType] = useState<string>('');
  const [researchSources, setResearchSources] = useState<string[]>([]);
  const [letterSettings, setLetterSettings] = useState<any>(null);
  const [selectedExample, setSelectedExample] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  
  // Previous letters
  const [previousLetters, setPreviousLetters] = useState<any[]>([]);
  const [selectedPreviousLetter, setSelectedPreviousLetter] = useState<string>('');
  const [isLoadingPreviousLetters, setIsLoadingPreviousLetters] = useState(false);
  
  // Generation step
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [letterId, setLetterId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<Array<{
    type: 'step' | 'info' | 'success' | 'error' | 'data' | 'complete';
    message: string;
    data?: any;
    timestamp: string;
  }>>([]);
  const hasFetchedCompanies = useRef(false);

  // Get the appropriate steps based on source type
  const STEPS = sourceType === 'scratch' ? STEPS_SCRATCH : STEPS_HUBSPOT;

  useEffect(() => {
    checkAuth();
    fetchLetterConfig();
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      fetchPreviousLetters();
    }
  }, [currentStep]);

  useEffect(() => {
    // Reset fetch flag when source type changes or going back to step 1
    if (currentStep === 1 || sourceType !== 'hubspot') {
      hasFetchedCompanies.current = false;
      setCompanies([]);
    }
  }, [sourceType, currentStep]);

  // Removed auto-fetch on step 2 - now requires user to search
  // This prevents loading all companies unnecessarily

  useEffect(() => {
    // Fetch contacts immediately when a company is selected (for instant display)
    if (sourceType === 'hubspot' && selectedCompany) {
      fetchContactsForCompany(selectedCompany.id);
    }
  }, [selectedCompany, sourceType]);

  // Removed automatic fetch of company review data - now done as part of letter generation

  const fetchLetterConfig = async () => {
    setIsLoadingConfig(true);
    try {
      // Fetch letter types
      const typesResponse = await fetch('/api/admin/letter-types', { credentials: 'include' });
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setLetterTypes(typesData.letterTypes || []);
        const defaultType = typesData.letterTypes?.find((t: any) => t.isDefault);
        if (defaultType) {
          setSelectedLetterType(defaultType._id || defaultType.id);
        }
      }

      // Fetch letter settings for examples
      const settingsResponse = await fetch('/api/admin/letter-settings', { credentials: 'include' });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setLetterSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Error fetching letter configuration:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchPreviousLetters = async () => {
    setIsLoadingPreviousLetters(true);
    try {
      const response = await fetch('/api/admin/letters?limit=10&status=approved', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPreviousLetters(data.letters || []);
      }
    } catch (error) {
      console.error('Error fetching previous letters:', error);
    } finally {
      setIsLoadingPreviousLetters(false);
    }
  };

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
        throw new Error(errorData.error || 'Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch companies');
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch only contacts - called immediately when company is selected for fast UX
  const fetchContactsForCompany = async (companyId: string) => {
    setIsLoadingContacts(true);
    setContacts([]);
    setSelectedContact(null);
    
    try {
      const contactsResponse = await fetch(`/api/admin/hubspot/companies/${companyId}/contacts`, {
        credentials: 'include',
      });
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData.contacts || []);
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Removed fetchCompanyReviewData - now done as part of letter generation process

  // Debounced search - triggers automatically as user types (min 2 chars)
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, don't search
    if (!searchQuery.trim()) {
      setCompanies([]);
      return;
    }

    // If search query is less than 2 characters, don't search yet
    if (searchQuery.trim().length < 2) {
      return;
    }

    // Set up debounced search (500ms delay)
    searchTimeoutRef.current = setTimeout(() => {
      fetchCompanies(searchQuery);
    }, 500);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Trigger immediate search
    if (searchQuery.trim().length >= 2) {
      fetchCompanies(searchQuery);
    } else if (searchQuery.trim().length > 0) {
      setError('Please enter at least 2 characters to search');
    }
  };

  const handleGenerateLetter = async () => {
    if (sourceType === 'hubspot' && !selectedCompany) {
      setError('Please select a company first');
      return;
    }

    if (sourceType === 'scratch' && !manualCompany.name) {
      setError('Please enter a company name');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedLetter('');
    setGenerationProgress([]);
    // Move to step 4 (Writing Letter) immediately
    setCurrentStep(4);

    try {
      // Prepare company data based on source type
      const companyData = sourceType === 'hubspot' 
        ? selectedCompany 
        : {
            id: 'manual',
            name: manualCompany.name,
            domain: '',
            website: manualCompany.website,
            phone: manualCompany.phone,
            address: manualCompany.address,
            city: manualCompany.city,
            state: manualCompany.state,
            zip: '',
            industry: manualCompany.industry,
            employees: manualCompany.employees,
          };

      // Prepare recipient data based on source type
      const recipientName = sourceType === 'hubspot'
        ? selectedContact?.fullName
        : manualContact.firstName || manualContact.lastName
          ? `${manualContact.firstName} ${manualContact.lastName}`.trim()
          : undefined;
      
      const recipientTitle = sourceType === 'hubspot'
        ? selectedContact?.jobTitle
        : manualContact.jobTitle || undefined;

      // Fetch company summary if HubSpot and not already loaded
      let finalCompanySummary = companySummary;
      if (sourceType === 'hubspot' && selectedCompany && !companySummary) {
        try {
          const summaryResponse = await fetch(`/api/admin/hubspot/companies/${selectedCompany.id}/summary`, {
            credentials: 'include',
          });
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            finalCompanySummary = summaryData.summary || '';
          }
        } catch (error) {
          console.error('Error fetching company summary:', error);
        }
      }

      // Fetch deals if HubSpot and not already loaded
      let finalDeals = deals;
      if (sourceType === 'hubspot' && selectedCompany && deals.length === 0) {
        try {
          const dealsResponse = await fetch(`/api/admin/hubspot/companies/${selectedCompany.id}/deals`, {
            credentials: 'include',
          });
          if (dealsResponse.ok) {
            const dealsData = await dealsResponse.json();
            finalDeals = dealsData.deals || [];
          }
        } catch (error) {
          console.error('Error fetching deals:', error);
        }
      }

      const response = await fetch('/api/admin/hubspot/generate-letter/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyId: sourceType === 'hubspot' ? selectedCompany?.id : 'manual',
          companyData,
          recipientName,
          recipientTitle,
          companySummary: finalCompanySummary,
          contacts: sourceType === 'hubspot' ? contacts : [],
          deals: finalDeals,
          isManualEntry: sourceType === 'scratch',
          letterTypeId: selectedLetterType,
          researchSources,
          selectedExample,
          customInstructions,
          previousLetterId: selectedPreviousLetter || undefined,
        }),
      });

      // Handle non-streaming error responses (like 401)
      if (!response.ok && response.status !== 200) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to generate letter: ${response.status}`);
        } catch (e: any) {
          if (e.message) throw e;
          const errorText = await response.text();
          throw new Error(errorText || `Failed to generate letter: ${response.status}`);
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        // If no reader, try to parse as JSON error response
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to generate letter: ${response.status}`);
          } catch (e: any) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to generate letter: ${response.status}`);
          }
        }
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              setGenerationProgress(prev => [...prev, data]);

              if (data.type === 'complete') {
                setGeneratedLetter(data.data.letter);
                if (data.data.letterId) {
                  setLetterId(data.data.letterId);
                }
                // Move to the generated letter step (step 5)
                setCurrentStep(5);
                setIsGenerating(false);
              } else if (data.type === 'error') {
                // Show error message with details if available
                let errorMessage = data.message;
                if (data.data?.details) {
                  try {
                    const details = typeof data.data.details === 'string' 
                      ? JSON.parse(data.data.details) 
                      : data.data.details;
                    if (details.error?.message) {
                      errorMessage += `: ${details.error.message}`;
                    } else if (typeof details === 'string') {
                      errorMessage += `: ${details}`;
                    } else {
                      errorMessage += `: ${JSON.stringify(details)}`;
                    }
                  } catch {
                    errorMessage += `: ${data.data.details}`;
                  }
                }
                setError(errorMessage);
                setIsGenerating(false);
              }
            } catch (e) {
              console.error('Error parsing progress update:', e);
            }
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate letter');
      setIsGenerating(false);
    }
  };

  const handleCopyLetter = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
    }
  };

  const handleDownloadLetter = () => {
    const companyName = sourceType === 'hubspot' ? selectedCompany?.name : manualCompany.name;
    if (generatedLetter && companyName) {
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `letter-${companyName.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Source selection step
      if (sourceType) {
        setCurrentStep(2);
      }
    } else if (sourceType === 'hubspot') {
      // HubSpot flow (5 steps: source, company+contact, configure, writing, generated)
      if (currentStep === 2 && selectedCompany) {
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Skip review step - go directly to letter generation
        handleGenerateLetter();
      }
    } else if (sourceType === 'scratch') {
      // Manual entry flow
      if (currentStep === 2 && manualCompany.name) {
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Skip review step - go directly to letter generation
        handleGenerateLetter();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Reset source type if going back to step 1
      if (currentStep === 2) {
        setSourceType(null);
      }
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return sourceType !== null;
    
    if (sourceType === 'hubspot') {
      // HubSpot: 5 steps (source, company+contact, configure, writing, generated)
      if (currentStep === 2) return selectedCompany !== null; // Contact is optional
      if (currentStep === 3) return selectedLetterType !== '' && !isGenerating; // Must select letter type
      if (currentStep === 4) return false; // Generation in progress, can't proceed
    } else if (sourceType === 'scratch') {
      if (currentStep === 2) return manualCompany.name.trim() !== '';
      if (currentStep === 3) return selectedLetterType !== '' && !isGenerating; // Must select letter type
      if (currentStep === 4) return false; // Generation in progress, can't proceed
    }
    
    return false;
  };

  const isLastStep = () => {
    // Step 3 is now the last step before generation starts
    if (sourceType === 'hubspot') return currentStep === 3;
    if (sourceType === 'scratch') return currentStep === 3;
    return false;
  };

  const isGeneratedStep = () => {
    if (sourceType === 'hubspot') return currentStep === 5;
    if (sourceType === 'scratch') return currentStep === 5;
    return false;
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create Letter</h1>
              <p className="text-sm text-gray-500">Generate a personalized letter step by step</p>
            </div>
            <Link href="/admin/letters">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 relative">
            {/* Progress line background */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-200 hidden sm:block" style={{ marginLeft: '8%', marginRight: '8%' }} />
            
            <div className="flex items-start justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                  {/* Step circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      currentStep > step.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : currentStep === step.id
                        ? 'bg-blue-500 text-white shadow-md ring-4 ring-blue-100'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="mt-3 text-center px-1">
                    <p
                      className={`text-xs font-medium leading-tight ${
                        currentStep === step.id 
                          ? 'text-blue-600' 
                          : currentStep > step.id 
                          ? 'text-gray-700' 
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className={`text-[10px] mt-1 leading-tight max-w-[100px] mx-auto ${
                      currentStep >= step.id ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
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

        {/* Step Content */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-xl">{STEPS[currentStep - 1]?.title || 'Create Letter'}</CardTitle>
            <CardDescription className="text-sm mt-1">{STEPS[currentStep - 1]?.description || ''}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Step 1: Choose Source */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => setSourceType('hubspot')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    sourceType === 'hubspot'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${sourceType === 'hubspot' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Database className={`h-8 w-8 ${sourceType === 'hubspot' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">From HubSpot</h3>
                      <p className="text-sm text-muted-foreground">
                        Select a company and contact from your HubSpot CRM. Get access to full company data, deals, and contact history.
                      </p>
                    </div>
                    {sourceType === 'hubspot' && (
                      <CheckCircle2 className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => setSourceType('scratch')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    sourceType === 'scratch'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${sourceType === 'scratch' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <PenLine className={`h-8 w-8 ${sourceType === 'scratch' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Enter Manually</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a letter from scratch by entering the company and recipient details manually.
                      </p>
                    </div>
                    {sourceType === 'scratch' && (
                      <CheckCircle2 className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 (HubSpot): Select Company & Recipient */}
            {currentStep === 2 && sourceType === 'hubspot' && (
              <div className="space-y-6">
                {/* Two Column Layout when company selected */}
                <div className={selectedCompany ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
                  {/* Company Selection */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Select Company
                    </h3>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Type to search companies (min 2 characters)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <Button type="submit" disabled={isSearching || searchQuery.trim().length < 2}>
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
                    </form>
                    {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                      <p className="text-xs text-muted-foreground mb-3">Enter at least 2 characters to search</p>
                    )}
                    {companies.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Found {companies.length} {companies.length === 1 ? 'company' : 'companies'}
                      </p>
                    )}

                    {companies.length > 0 && (
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {companies.map((company) => (
                          <div
                            key={company.id}
                            onClick={() => setSelectedCompany(company)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedCompany?.id === company.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{company.name}</p>
                                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                    {company.industry && <span>{company.industry}</span>}
                                    {company.city && company.state && (
                                      <span>{company.city}, {company.state}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {selectedCompany?.id === company.id && (
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {companies.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
                      <div className="text-center py-6 text-muted-foreground border rounded-lg">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No companies found. Try a different search term.</p>
                      </div>
                    )}
                    {companies.length === 0 && !searchQuery && (
                      <div className="text-center py-6 text-muted-foreground border rounded-lg">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start typing to search for companies...</p>
                      </div>
                    )}
                  </div>

                  {/* PDF-Style Letter Preview Card - shows when company is selected */}
                  {selectedCompany && (
                    <div className="lg:sticky lg:top-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-400">
                        <FileText className="h-5 w-5" />
                        Letter Preview
                      </h3>
                      <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        {/* Mini Letterhead */}
                        <div className="bg-gradient-to-r from-[#3D6AFF] to-[#2B4FD9] px-5 py-3">
                          <div className="text-white text-xs font-semibold tracking-wider">APPELLO</div>
                        </div>
                        
                        {/* Letter Content Preview */}
                        <div className="p-5">
                          {/* Date - using suppressHydrationWarning to avoid SSR mismatch */}
                          <div className="text-right text-xs text-gray-400 mb-6" suppressHydrationWarning>
                            {new Date().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          
                          {/* Recipient Block - styled like a formal letter */}
                          <div className="space-y-0.5 mb-6">
                            {selectedContact ? (
                              <>
                                <p className="font-semibold text-gray-900">{selectedContact.fullName}</p>
                                {selectedContact.jobTitle && (
                                  <p className="text-sm text-gray-600">{selectedContact.jobTitle}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No recipient selected</p>
                            )}
                            <p className="text-sm text-gray-900 font-medium mt-1">{selectedCompany.name}</p>
                            {selectedCompany.address && (
                              <p className="text-sm text-gray-600">{selectedCompany.address}</p>
                            )}
                            {(selectedCompany.city || selectedCompany.state || selectedCompany.zip) && (
                              <p className="text-sm text-gray-600">
                                {[
                                  selectedCompany.city,
                                  selectedCompany.state,
                                  selectedCompany.zip
                                ].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          
                          {/* Letter Body Placeholder */}
                          <div className="space-y-2 border-t border-gray-100 pt-4">
                            <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                            <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                          </div>
                          
                          {/* Company Details Summary */}
                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Company Details</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              {selectedCompany.industry && (
                                <>
                                  <span className="text-gray-400">Industry</span>
                                  <span className="text-gray-700 font-medium">{selectedCompany.industry}</span>
                                </>
                              )}
                              {selectedCompany.employees && (
                                <>
                                  <span className="text-gray-400">Employees</span>
                                  <span className="text-gray-700 font-medium">{selectedCompany.employees}</span>
                                </>
                              )}
                              {selectedCompany.phone && (
                                <>
                                  <span className="text-gray-400">Phone</span>
                                  <span className="text-gray-700 font-medium">{selectedCompany.phone}</span>
                                </>
                              )}
                              {selectedCompany.website && (
                                <>
                                  <span className="text-gray-400">Website</span>
                                  <span className="text-gray-700 font-medium truncate">{selectedCompany.website}</span>
                                </>
                              )}
                              {!selectedCompany.industry && !selectedCompany.employees && !selectedCompany.phone && !selectedCompany.website && (
                                <span className="col-span-2 text-gray-400 italic">No additional details available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recipient Selection - shows when company is selected */}
                {selectedCompany && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Select Recipient
                      <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                    </h3>
                    
                    {isLoadingContacts ? (
                      <div className="flex items-center justify-center py-8 border rounded-lg bg-gray-50">
                        <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Loading contacts...</span>
                      </div>
                    ) : contacts.length > 0 ? (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        <div
                          onClick={() => setSelectedContact(null)}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedContact === null ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">No specific recipient</p>
                                <p className="text-xs text-muted-foreground">Send to the company generally</p>
                              </div>
                            </div>
                            {selectedContact === null && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                        {contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{contact.fullName}</p>
                                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                    {contact.jobTitle && <span>{contact.jobTitle}</span>}
                                    {contact.email && <span>{contact.email}</span>}
                                  </div>
                                </div>
                              </div>
                              {selectedContact?.id === contact.id && (
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground border rounded-lg bg-gray-50">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No contacts found for this company.</p>
                        <p className="text-xs mt-1">You can proceed without selecting a recipient.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 (Manual): Enter Details */}
            {currentStep === 2 && sourceType === 'scratch' && (
              <div className="space-y-8">
                {/* Company Information */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={manualCompany.name}
                        onChange={(e) => setManualCompany({ ...manualCompany, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology, Healthcare"
                        value={manualCompany.industry}
                        onChange={(e) => setManualCompany({ ...manualCompany, industry: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="employees">Number of Employees</Label>
                      <Input
                        id="employees"
                        placeholder="e.g., 50, 100-500"
                        value={manualCompany.employees}
                        onChange={(e) => setManualCompany({ ...manualCompany, employees: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={manualCompany.city}
                        onChange={(e) => setManualCompany({ ...manualCompany, city: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={manualCompany.state}
                        onChange={(e) => setManualCompany({ ...manualCompany, state: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://example.com"
                        value={manualCompany.website}
                        onChange={(e) => setManualCompany({ ...manualCompany, website: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input
                        id="companyPhone"
                        placeholder="(555) 123-4567"
                        value={manualCompany.phone}
                        onChange={(e) => setManualCompany({ ...manualCompany, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Recipient Information <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={manualContact.firstName}
                        onChange={(e) => setManualContact({ ...manualContact, firstName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={manualContact.lastName}
                        onChange={(e) => setManualContact({ ...manualContact, lastName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        placeholder="e.g., CEO, Marketing Director"
                        value={manualContact.jobTitle}
                        onChange={(e) => setManualContact({ ...manualContact, jobTitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={manualContact.email}
                        onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 (HubSpot) / Step 3 (Scratch): Configure Letter */}
            {currentStep === 3 && (sourceType === 'hubspot' || sourceType === 'scratch') ? (
              <div className="space-y-6">
                {isLoadingConfig ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading configuration options...</p>
                  </div>
                ) : (
                  <>
                    {/* Letter Purpose/Type */}
                    <div>
                      <Label htmlFor="letterType" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Letter Purpose *
                      </Label>
                      <Select value={selectedLetterType} onValueChange={setSelectedLetterType}>
                        <SelectTrigger id="letterType" className="w-full">
                          <SelectValue placeholder="Select the purpose of this letter" />
                        </SelectTrigger>
                        <SelectContent>
                          {letterTypes.map((type) => (
                            <SelectItem key={type._id || type.id} value={type._id || type.id}>
                              <div>
                                <div className="font-medium">{type.name}</div>
                                {type.description && (
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        Choose the type of letter you want to generate. Each type has specific formatting and tone guidelines.
                      </p>
                    </div>

                    {/* Research Sources */}
                    <div>
                      <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Research Sources
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="researchAtlas"
                            checked={researchSources.includes('atlas')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setResearchSources([...researchSources, 'atlas']);
                              } else {
                                setResearchSources(researchSources.filter(s => s !== 'atlas'));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="researchAtlas" className="flex items-center gap-2 cursor-pointer">
                            <Database className="h-4 w-4 text-blue-600" />
                            <span>ATLAS Database</span>
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          Search our internal ATLAS database for similar customers, case studies, and success stories
                        </p>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="researchInternet"
                            checked={researchSources.includes('internet')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setResearchSources([...researchSources, 'internet']);
                              } else {
                                setResearchSources(researchSources.filter(s => s !== 'internet'));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="researchInternet" className="flex items-center gap-2 cursor-pointer">
                            <Globe className="h-4 w-4 text-green-600" />
                            <span>Internet Research</span>
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          Conduct web research to gather recent news, company updates, and industry insights
                        </p>
                      </div>
                    </div>

                    {/* Prewritten Examples */}
                    {letterSettings?.approvedSamples && letterSettings.approvedSamples.length > 0 && (
                      <div>
                        <Label htmlFor="example" className="text-base font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Use Prewritten Example (Optional)
                        </Label>
                        <Select value={selectedExample} onValueChange={setSelectedExample}>
                          <SelectTrigger id="example" className="w-full">
                            <SelectValue placeholder="Select an example to use as reference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None - Generate from scratch</SelectItem>
                            {letterSettings.approvedSamples.map((sample: any, index: number) => (
                              <SelectItem key={index} value={sample.name || `example-${index}`}>
                                <div>
                                  <div className="font-medium">{sample.name}</div>
                                  {sample.description && (
                                    <div className="text-xs text-muted-foreground">{sample.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-2">
                          Optionally select a prewritten example to guide the style and structure of your letter.
                        </p>
                        {selectedExample && letterSettings.approvedSamples.find((s: any) => (s.name || `example-${letterSettings.approvedSamples.indexOf(s)}`) === selectedExample) && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Example Preview:</p>
                            <pre className="text-xs whitespace-pre-wrap font-sans">
                              {letterSettings.approvedSamples.find((s: any) => (s.name || `example-${letterSettings.approvedSamples.indexOf(s)}`) === selectedExample)?.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Instructions */}
                    <div>
                      <Label htmlFor="customInstructions" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Custom Instructions (Optional)
                      </Label>
                      <Textarea
                        id="customInstructions"
                        placeholder="Add any specific requirements, tone preferences, or key points to include..."
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Provide additional guidance for the letter generation. For example: "Focus on mobile timesheet benefits" or "Use a more formal tone"
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Writing Letter Step - HubSpot flow (step 4) */}
            {currentStep === 4 && sourceType === 'hubspot' && (
              <div className="space-y-6">
                {/* Generation Progress */}
                {isGenerating && (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-lg font-medium text-gray-700">Generating your personalized letter...</p>
                      <p className="text-sm text-muted-foreground mt-1">This may take a moment while we research and craft your letter</p>
                    </div>
                    
                    {/* Progress Log */}
                    {generationProgress.length > 0 && (
                      <div className="border rounded-lg bg-gray-50 p-4 max-h-64 overflow-y-auto">
                        <h4 className="font-medium text-sm text-gray-600 mb-3">Progress:</h4>
                        <div className="space-y-2">
                          {generationProgress.map((progress, index) => (
                            <div 
                              key={index} 
                              className={`flex items-start gap-2 text-sm ${
                                progress.type === 'error' ? 'text-red-600' :
                                progress.type === 'success' ? 'text-green-600' :
                                progress.type === 'step' ? 'text-blue-600 font-medium' :
                                'text-gray-600'
                              }`}
                            >
                              {progress.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                              {progress.type === 'step' && <Loader2 className="h-4 w-4 mt-0.5 flex-shrink-0 animate-spin" />}
                              {progress.type === 'info' && <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">•</span>}
                              {progress.type === 'error' && <X className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                              <span>{progress.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error state */}
                {!isGenerating && error && (
                  <div className="text-center py-8">
                    <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600 font-medium">Generation failed</p>
                    <p className="text-sm text-muted-foreground mt-2">{error}</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => {
                        setError('');
                        setCurrentStep(3);
                      }}
                    >
                      Go Back and Try Again
                    </Button>
                  </div>
                )}

                {/* Static review (shown when not generating and no error) */}
                {!isGenerating && !error && (
                  <>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company Information
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedCompany?.name}</p>
                        {selectedCompany?.industry && (
                          <p><span className="font-medium">Industry:</span> {selectedCompany.industry}</p>
                        )}
                        {selectedCompany?.city && selectedCompany?.state && (
                          <p>
                            <span className="font-medium">Location:</span> {selectedCompany.city}, {selectedCompany.state}
                          </p>
                        )}
                        {selectedCompany?.employees && (
                          <p><span className="font-medium">Employees:</span> {selectedCompany.employees}</p>
                        )}
                      </div>
                    </div>

                    {selectedContact && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Recipient
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedContact.fullName}</p>
                          {selectedContact.jobTitle && (
                            <p><span className="font-medium">Title:</span> {selectedContact.jobTitle}</p>
                          )}
                          {selectedContact.email && (
                            <p><span className="font-medium">Email:</span> {selectedContact.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Letter Configuration Summary */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Letter Configuration
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
                        {selectedLetterType && (
                          <p className="text-sm">
                            <span className="font-medium">Letter Type:</span>{' '}
                            {letterTypes.find(t => (t._id || t.id) === selectedLetterType)?.name || 'Unknown'}
                          </p>
                        )}
                        {researchSources.length > 0 && (
                          <p className="text-sm">
                            <span className="font-medium">Research Sources:</span>{' '}
                            {researchSources.map(s => s === 'atlas' ? 'ATLAS Database' : 'Internet Research').join(', ')}
                          </p>
                        )}
                        {selectedExample && selectedExample !== 'none' && (
                          <p className="text-sm">
                            <span className="font-medium">Reference Example:</span>{' '}
                            {selectedExample}
                          </p>
                        )}
                        {customInstructions && (
                          <div className="text-sm">
                            <span className="font-medium">Custom Instructions:</span>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{customInstructions}</p>
                          </div>
                        )}
                        {!selectedLetterType && researchSources.length === 0 && (!selectedExample || selectedExample === 'none') && !customInstructions && (
                          <p className="text-sm text-muted-foreground">Using default settings</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Writing Letter Step - Manual flow (step 4) */}
            {currentStep === 4 && sourceType === 'scratch' && (
              <div className="space-y-6">
                {/* Generation Progress */}
                {isGenerating && (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-lg font-medium text-gray-700">Generating your personalized letter...</p>
                      <p className="text-sm text-muted-foreground mt-1">This may take a moment while we research and craft your letter</p>
                    </div>
                    
                    {/* Progress Log */}
                    {generationProgress.length > 0 && (
                      <div className="border rounded-lg bg-gray-50 p-4 max-h-64 overflow-y-auto">
                        <h4 className="font-medium text-sm text-gray-600 mb-3">Progress:</h4>
                        <div className="space-y-2">
                          {generationProgress.map((progress, index) => (
                            <div 
                              key={index} 
                              className={`flex items-start gap-2 text-sm ${
                                progress.type === 'error' ? 'text-red-600' :
                                progress.type === 'success' ? 'text-green-600' :
                                progress.type === 'step' ? 'text-blue-600 font-medium' :
                                'text-gray-600'
                              }`}
                            >
                              {progress.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                              {progress.type === 'step' && <Loader2 className="h-4 w-4 mt-0.5 flex-shrink-0 animate-spin" />}
                              {progress.type === 'info' && <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">•</span>}
                              {progress.type === 'error' && <X className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                              <span>{progress.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error state */}
                {!isGenerating && error && (
                  <div className="text-center py-8">
                    <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600 font-medium">Generation failed</p>
                    <p className="text-sm text-muted-foreground mt-2">{error}</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => {
                        setError('');
                        setCurrentStep(3);
                      }}
                    >
                      Go Back and Try Again
                    </Button>
                  </div>
                )}

                {/* Static review (shown when not generating and no error) */}
                {!isGenerating && !error && (
                  <>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company Information
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">Name:</span> {manualCompany.name}</p>
                        {manualCompany.industry && (
                          <p><span className="font-medium">Industry:</span> {manualCompany.industry}</p>
                        )}
                        {(manualCompany.city || manualCompany.state) && (
                          <p>
                            <span className="font-medium">Location:</span>{' '}
                            {[manualCompany.city, manualCompany.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {manualCompany.employees && (
                          <p><span className="font-medium">Employees:</span> {manualCompany.employees}</p>
                        )}
                        {manualCompany.website && (
                          <p><span className="font-medium">Website:</span> {manualCompany.website}</p>
                        )}
                        {manualCompany.phone && (
                          <p><span className="font-medium">Phone:</span> {manualCompany.phone}</p>
                        )}
                      </div>
                    </div>

                    {(manualContact.firstName || manualContact.lastName) && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Recipient
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p>
                            <span className="font-medium">Name:</span>{' '}
                            {`${manualContact.firstName} ${manualContact.lastName}`.trim()}
                          </p>
                          {manualContact.jobTitle && (
                            <p><span className="font-medium">Title:</span> {manualContact.jobTitle}</p>
                          )}
                          {manualContact.email && (
                            <p><span className="font-medium">Email:</span> {manualContact.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Letter Configuration Summary */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Letter Configuration
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200">
                        {selectedLetterType && (
                          <p className="text-sm">
                            <span className="font-medium">Letter Type:</span>{' '}
                            {letterTypes.find(t => (t._id || t.id) === selectedLetterType)?.name || 'Unknown'}
                          </p>
                        )}
                        {researchSources.length > 0 && (
                          <p className="text-sm">
                            <span className="font-medium">Research Sources:</span>{' '}
                            {researchSources.map(s => s === 'atlas' ? 'ATLAS Database' : 'Internet Research').join(', ')}
                          </p>
                        )}
                        {selectedExample && selectedExample !== 'none' && (
                          <p className="text-sm">
                            <span className="font-medium">Reference Example:</span>{' '}
                            {selectedExample}
                          </p>
                        )}
                        {customInstructions && (
                          <div className="text-sm">
                            <span className="font-medium">Custom Instructions:</span>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{customInstructions}</p>
                          </div>
                        )}
                        {!selectedLetterType && researchSources.length === 0 && (!selectedExample || selectedExample === 'none') && !customInstructions && (
                          <p className="text-sm text-muted-foreground">Using default settings</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Generated Letter Step - both flows */}
            {isGeneratedStep() && (
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Generating your personalized letter...</p>
                    <Progress value={undefined} className="mt-4" />
                  </div>
                ) : generatedLetter ? (
                  <>
                    <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" onClick={handleCopyLetter}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" onClick={handleDownloadLetter}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg border">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {generatedLetter}
                      </pre>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Link href="/admin/letters">
                        <Button variant="outline">Back to Letters</Button>
                      </Link>
                      {letterId && (
                        <Link href={`/admin/letters/${letterId}`}>
                          <Button>View Full Details</Button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No letter generated yet.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {!isGeneratedStep() && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isGenerating}
            >
              {isLastStep() ? (
                <>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Letter
                      <Mail className="h-4 w-4 ml-2" />
                    </>
                  )}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

