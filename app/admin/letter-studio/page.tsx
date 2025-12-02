'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Globe,
  MapPin,
  Briefcase,
  Send,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Users,
  AlertTriangle,
  TrendingUp,
  FileText,
  Zap,
  Search,
  X,
  Loader2,
  Database,
  Plug,
  CheckCircle2,
  XCircle,
  Circle,
  Settings,
  Heart,
  UserCheck,
  UserX,
  ExternalLink,
  Save,
} from 'lucide-react';
import { AgentActivityLog, type ActivityLogEntry } from '@/components/ai/AgentActivityLog';
import { PromptConfigEditor } from '@/components/admin/PromptConfigEditor';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface ResearchSummary {
  companyInsights: string[];
  industryContext: string[];
  similarCustomers: string[];
  painPoints: string[];
  opportunities: string[];
  customerStatus?: 'existing_customer' | 'prospect' | 'unknown';
  priorInteractions?: {
    found: boolean;
    interactions: Array<{
      date: string;
      type: 'call' | 'meeting' | 'email' | 'note' | 'other';
      summary: string;
      participants?: string[];
    }>;
    summary: string;
  };
}

// Letter type from config
interface LetterTypeConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon?: string;
  isCustom: boolean;
  isActive: boolean;
}

// Tone from config
interface ToneConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isActive: boolean;
}

// Prompt configuration
interface PromptConfig {
  systemPrompt: string;
  letterTypes: LetterTypeConfig[];
  tones: ToneConfig[];
  defaults: {
    letterType: string;
    tone: string;
    maxWordCount: number;
    includeSubject: boolean;
  };
  researchInstructions: {
    atlasPrompt: string;
    hubspotPrompt: string;
    firecrawlPrompt: string;
    customerVsProspectPrompt: string;
  };
  qualityStandards: string;
  version: number;
}

interface GenerationResult {
  letter: string;
  subject?: string;
  researchSummary: ResearchSummary;
  personalizationPoints: string[];
  suggestedFollowUp?: string;
  confidence: number;
  stats: { iterations: number; toolCalls: number };
  savedLetterId?: string;
}

// HubSpot types
interface HubSpotDeal {
  id: string;
  dealname: string;
  dealstage: string;
}

interface HubSpotCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
}

interface HubSpotContact {
  id: string;
  firstname?: string;
  lastname?: string;
  fullName?: string;
  email?: string;
  jobtitle?: string;
}

// Tools Status types
interface ToolStatus {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  toolCount?: number;
  icon: 'atlas' | 'hubspot' | 'ai' | 'firecrawl';
}

interface IntegrationStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  details?: {
    connected?: boolean;
    available?: boolean;
    toolCount?: number;
    tools?: string[];
    error?: string;
  };
}

// ============================================================================
// Constants (fallbacks if config doesn't load)
// ============================================================================

const DEFAULT_LETTER_TYPES = [
  { value: 'cold_outreach', label: 'Cold Outreach', icon: Mail, description: 'First contact with a new prospect' },
  { value: 'follow_up', label: 'Follow Up', icon: RefreshCw, description: 'Continue a previous conversation' },
  { value: 'reengagement', label: 'Re-engagement', icon: Zap, description: 'Reconnect with dormant contacts' },
  { value: 'referral', label: 'Referral', icon: Users, description: 'Leverage a mutual connection' },
  { value: 'existing_customer', label: 'Existing Customer', icon: Heart, description: 'Reach out to current customers' },
];

const DEFAULT_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'consultative', label: 'Consultative' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'casual', label: 'Casual' },
];

// Icon mapping for dynamic letter types
const ICON_MAP: Record<string, any> = {
  Mail, RefreshCw, Zap, Users, Heart, FileText, Sparkles, Target,
};

// ============================================================================
// Main Component
// ============================================================================

export default function LetterStudioPage() {
  const router = useRouter();
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [letterType, setLetterType] = useState('cold_outreach');
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResearch, setShowResearch] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Prompt configuration state
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
  const [letterTypes, setLetterTypes] = useState(DEFAULT_LETTER_TYPES);
  const [tones, setTones] = useState(DEFAULT_TONES);

  // Customer status (from HubSpot)
  const [isExistingCustomer, setIsExistingCustomer] = useState<boolean | null>(null);
  const [checkingCustomerStatus, setCheckingCustomerStatus] = useState(false);

  // Streaming state (manual implementation for POST-based SSE)
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // HubSpot Selector state
  const [showSelector, setShowSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'deals' | 'companies' | 'contacts'>('deals');
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Tools Status state
  const [toolsStatus, setToolsStatus] = useState<ToolStatus[]>([
    { id: 'atlas', name: 'ATLAS Knowledge Base', description: 'Historical data, similar customers, insights', status: 'loading', icon: 'atlas' },
    { id: 'hubspot', name: 'HubSpot MCP', description: 'CRM data, deals, contacts, companies', status: 'loading', icon: 'hubspot' },
    { id: 'firecrawl', name: 'Firecrawl', description: 'Web scraping, search, company research', status: 'loading', toolCount: 3, icon: 'firecrawl' },
    { id: 'anthropic', name: 'Claude AI', description: 'AI reasoning and letter generation', status: 'loading', icon: 'ai' },
  ]);
  const [showToolsStatus, setShowToolsStatus] = useState(true);

  // Load tools status on mount
  useEffect(() => {
    const loadToolsStatus = async () => {
      try {
        const response = await fetch('/api/admin/integrations/status');
        if (response.ok) {
          const data = await response.json();
          const integrations = data.integrations as IntegrationStatus[];

          setToolsStatus(prev => prev.map(tool => {
            if (tool.id === 'atlas') {
              const atlas = integrations.find(i => i.id === 'atlas');
              return {
                ...tool,
                status: atlas?.status || 'disconnected',
                toolCount: atlas?.details?.tools?.length || 1,
              };
            }
            if (tool.id === 'hubspot') {
              const hubspotMcp = integrations.find(i => i.id === 'hubspot-mcp');
              return {
                ...tool,
                status: hubspotMcp?.status || 'disconnected',
                toolCount: hubspotMcp?.details?.toolCount || 0,
              };
            }
            if (tool.id === 'firecrawl') {
              const firecrawl = integrations.find(i => i.id === 'firecrawl');
              return {
                ...tool,
                status: firecrawl?.status || 'disconnected',
                toolCount: 3, // scrape, search, map
              };
            }
            if (tool.id === 'anthropic') {
              const anthropic = integrations.find(i => i.id === 'anthropic');
              return {
                ...tool,
                status: anthropic?.status || 'disconnected',
              };
            }
            return tool;
          }));
        }
      } catch (error) {
        console.error('Failed to load tools status:', error);
        setToolsStatus(prev => prev.map(tool => ({ ...tool, status: 'error' })));
      }
    };

    loadToolsStatus();
  }, []);

  // Load prompt configuration on mount
  useEffect(() => {
    const loadPromptConfig = async () => {
      try {
        const response = await fetch('/api/admin/letter-studio/config');
        if (response.ok) {
          const data = await response.json();
          setPromptConfig(data.config);
          
          // Update letter types from config
          if (data.config.letterTypes?.length > 0) {
            setLetterTypes(data.config.letterTypes
              .filter((t: LetterTypeConfig) => t.isActive)
              .map((t: LetterTypeConfig) => ({
                value: t.id,
                label: t.name,
                icon: ICON_MAP[t.icon || 'FileText'] || FileText,
                description: t.description,
                isCustom: t.isCustom,
              }))
            );
          }
          
          // Update tones from config
          if (data.config.tones?.length > 0) {
            setTones(data.config.tones
              .filter((t: ToneConfig) => t.isActive)
              .map((t: ToneConfig) => ({
                value: t.id,
                label: t.name,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Failed to load prompt config:', error);
      }
    };

    loadPromptConfig();
  }, []);

  // Check customer status from HubSpot when company is selected
  const checkCustomerStatus = useCallback(async (companyId: string) => {
    if (!companyId) {
      setIsExistingCustomer(null);
      return;
    }

    setCheckingCustomerStatus(true);
    try {
      // Check if company has any closed-won deals
      const response = await fetch(`/api/admin/hubspot/companies/${companyId}/deals`);
      if (response.ok) {
        const data = await response.json();
        const deals = data.deals || [];
        
        // Check for any closed-won deals or active customer indicators
        const hasClosedWonDeals = deals.some((deal: any) => 
          deal.dealstage?.toLowerCase().includes('closedwon') ||
          deal.dealstage?.toLowerCase().includes('closed won') ||
          deal.hs_is_closed_won === true
        );
        
        setIsExistingCustomer(hasClosedWonDeals);
        
        // Auto-suggest letter type based on customer status
        if (hasClosedWonDeals && letterType === 'cold_outreach') {
          setLetterType('existing_customer');
        }
      }
    } catch (error) {
      console.error('Failed to check customer status:', error);
      setIsExistingCustomer(null);
    } finally {
      setCheckingCustomerStatus(false);
    }
  }, [letterType]);

  // Generate letter with POST-based SSE streaming
  const handleGenerate = useCallback(async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    // Reset state
    setGenerationResult(null);
    setLogs([]);
    setError(null);
    setIsLoading(true);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/admin/letter-studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          companyName,
          companyIndustry,
          companyDomain,
          companyLocation,
          contactName,
          contactTitle,
          contactEmail,
          letterType,
          tone,
          customInstructions,
          saveDraft: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to start generation: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.substring(6);

            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);

                if (currentEvent === 'progress') {
                  // Add to logs
                  const log: ActivityLogEntry = {
                    step: data.step || 'progress',
                    message: data.message || '',
                    status: data.status || 'info',
                    data: data.data,
                    timestamp: new Date(),
                  };
                  setLogs(prev => [...prev, log]);
                } else if (currentEvent === 'complete') {
                  setGenerationResult(data);
                } else if (currentEvent === 'error') {
                  setError(data.message || 'Unknown error');
                }
              } catch (e) {
                console.error('Parse error:', e);
              }

              currentEvent = '';
              currentData = '';
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to generate letter');
        console.error('Generation error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyName, companyIndustry, companyDomain, companyLocation, contactName, contactTitle, contactEmail, letterType, tone, customInstructions]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (generationResult?.letter) {
      navigator.clipboard.writeText(generationResult.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generationResult]);

  // ============================================================================
  // HubSpot Selector Functions
  // ============================================================================

  const fetchDeals = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/hubspot/deals?limit=100&useSync=true');
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/hubspot/companies?limit=500');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchContacts = async (companyId?: string) => {
    setLoadingData(true);
    try {
      const url = companyId 
        ? `/api/admin/hubspot/companies/${companyId}/contacts`
        : '/api/admin/hubspot/contacts?limit=100';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const openSelector = (tab: 'deals' | 'companies' | 'contacts') => {
    setSelectorTab(tab);
    setShowSelector(true);
    setSearchQuery('');
    if (tab === 'deals' && deals.length === 0) fetchDeals();
    if (tab === 'companies' && companies.length === 0) fetchCompanies();
    if (tab === 'contacts') fetchContacts(selectedCompanyId || undefined);
  };

  const selectDeal = async (dealId: string) => {
    try {
      const response = await fetch(`/api/admin/hubspot/deals/${dealId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.companies?.[0]) {
          setCompanyName(data.companies[0].name || '');
          setCompanyDomain(data.companies[0].domain || '');
          setCompanyIndustry(data.companies[0].industry || '');
          const city = data.companies[0].city || '';
          const state = data.companies[0].state || '';
          setCompanyLocation([city, state].filter(Boolean).join(', '));
          setSelectedCompanyId(data.companies[0].id);
          // Check customer status
          checkCustomerStatus(data.companies[0].id);
        }
        if (data.contacts?.[0]) {
          setContactName(data.contacts[0].fullName || `${data.contacts[0].firstname || ''} ${data.contacts[0].lastname || ''}`.trim());
          setContactEmail(data.contacts[0].email || '');
          setContactTitle(data.contacts[0].jobtitle || '');
        }
        setShowSelector(false);
      }
    } catch (error) {
      console.error('Error selecting deal:', error);
    }
  };

  const selectCompany = (company: HubSpotCompany) => {
    setCompanyName(company.name || '');
    setCompanyDomain(company.domain || '');
    setCompanyIndustry(company.industry || '');
    const location = [company.city, company.state].filter(Boolean).join(', ');
    setCompanyLocation(location);
    setSelectedCompanyId(company.id);
    setShowSelector(false);
    // Clear contact when company changes
    setContactName('');
    setContactEmail('');
    setContactTitle('');
    // Check customer status
    checkCustomerStatus(company.id);
  };

  const selectContact = (contact: HubSpotContact) => {
    setContactName(contact.fullName || `${contact.firstname || ''} ${contact.lastname || ''}`.trim());
    setContactEmail(contact.email || '');
    setContactTitle(contact.jobtitle || '');
    setShowSelector(false);
  };

  // Filtered lists for search
  const filteredDeals = deals.filter(d => 
    d.dealname?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredContacts = contacts.filter(c => 
    (c.fullName || `${c.firstname || ''} ${c.lastname || ''}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Letter Studio</h1>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">AI-Powered</Badge>
              {promptConfig && (
                <Badge className="bg-slate-700 text-slate-300">v{promptConfig.version}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className={`border-slate-600 ${showSettings ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showSettings ? 'Hide Settings' : 'Prompt Settings'}
            </Button>
          </div>
          <p className="text-slate-400">
            Research-backed, highly personalized letters generated by AI
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-400" />
                  AI Agent Configuration
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Customize the system prompt, letter types, tones, and research instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromptConfigEditor 
                  onConfigUpdate={(config) => {
                    setPromptConfig(config);
                    // Update letter types
                    if (config.letterTypes?.length > 0) {
                      setLetterTypes(config.letterTypes
                        .filter((t: LetterTypeConfig) => t.isActive)
                        .map((t: LetterTypeConfig) => ({
                          value: t.id,
                          label: t.name,
                          icon: ICON_MAP[t.icon || 'FileText'] || FileText,
                          description: t.description,
                          isCustom: t.isCustom,
                        }))
                      );
                    }
                    // Update tones
                    if (config.tones?.length > 0) {
                      setTones(config.tones
                        .filter((t: ToneConfig) => t.isActive)
                        .map((t: ToneConfig) => ({
                          value: t.id,
                          label: t.name,
                        }))
                      );
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Agent Tools Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setShowToolsStatus(!showToolsStatus)}
              >
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plug className="h-5 w-5 text-cyan-400" />
                    Agent Tools
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {toolsStatus.filter(t => t.status === 'connected').length > 0 && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                          {toolsStatus.filter(t => t.status === 'connected').length} online
                        </Badge>
                      )}
                      {toolsStatus.filter(t => t.status === 'disconnected' || t.status === 'error').length > 0 && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                          {toolsStatus.filter(t => t.status === 'disconnected' || t.status === 'error').length} offline
                        </Badge>
                      )}
                    </div>
                    {showToolsStatus ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </CardTitle>
              </CardHeader>
              {showToolsStatus && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {toolsStatus.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50">
                        <div className={`p-2 rounded-lg ${
                          tool.id === 'atlas' ? 'bg-purple-500/20' :
                          tool.id === 'hubspot' ? 'bg-orange-500/20' :
                          tool.id === 'firecrawl' ? 'bg-amber-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {tool.id === 'atlas' && <Database className="h-4 w-4 text-purple-400" />}
                          {tool.id === 'hubspot' && <Building2 className="h-4 w-4 text-orange-400" />}
                          {tool.id === 'firecrawl' && <Globe className="h-4 w-4 text-amber-400" />}
                          {tool.id === 'anthropic' && <Sparkles className="h-4 w-4 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{tool.name}</span>
                            {tool.toolCount !== undefined && tool.toolCount > 0 && (
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                {tool.toolCount} {tool.toolCount === 1 ? 'tool' : 'tools'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{tool.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {tool.status === 'loading' && (
                            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                          )}
                          {tool.status === 'connected' && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs text-emerald-400">Online</span>
                            </div>
                          )}
                          {tool.status === 'disconnected' && (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-slate-500" />
                              <span className="text-xs text-slate-500">Offline</span>
                            </div>
                          )}
                          {tool.status === 'error' && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                              <span className="text-xs text-amber-400">Error</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    The agent uses these tools to research and generate personalized letters
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Company Information */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-400" />
                    Company Information
                  </CardTitle>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openSelector('deals')} 
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" 
                      title="Select from Deal"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openSelector('companies')} 
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" 
                      title="Select Company"
                    >
                      <Building2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openSelector('contacts')} 
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" 
                      title="Select Contact"
                    >
                      <User className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Select from HubSpot or enter manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Construction"
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Industry</Label>
                    <Input
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="e.g., Construction"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        placeholder="e.g., Toronto, ON"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      placeholder="e.g., acmeconstruction.com"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-green-400" />
                  Contact (Optional)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Add recipient details for more personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Name</Label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g., John Smith"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={contactTitle}
                        onChange={(e) => setContactTitle(e.target.value)}
                        placeholder="e.g., Operations Manager"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g., john@acmeconstruction.com"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Status Indicator */}
            {selectedCompanyId && (
              <div className={`p-3 rounded-lg border ${
                isExistingCustomer === true 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : isExistingCustomer === false 
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {checkingCustomerStatus ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-400">Checking customer status...</span>
                    </>
                  ) : isExistingCustomer === true ? (
                    <>
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-emerald-300 font-medium">Existing Customer</span>
                      <span className="text-xs text-emerald-400/70">- Consider using &quot;Existing Customer&quot; letter type</span>
                    </>
                  ) : isExistingCustomer === false ? (
                    <>
                      <UserX className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-300 font-medium">New Prospect</span>
                      <span className="text-xs text-blue-400/70">- Focus on establishing credibility</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Customer status unknown</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Letter Type Selection */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-400" />
                    Letter Type
                  </span>
                  <span className="text-xs text-slate-500">{letterTypes.length} types available</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {letterTypes.map((type: any) => {
                    const IconComponent = type.icon || FileText;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setLetterType(type.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          letterType === type.value
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className={`h-4 w-4 ${letterType === type.value ? 'text-violet-400' : 'text-slate-400'}`} />
                          <span className={`font-medium ${letterType === type.value ? 'text-violet-300' : 'text-slate-300'}`}>
                            {type.label}
                          </span>
                          {type.isCustom && (
                            <Badge className="bg-violet-500/20 text-violet-300 text-[10px] px-1">Custom</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader 
                className="pb-4 cursor-pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Advanced Options
                  </span>
                  {showAdvanced ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </CardTitle>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Tone</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tones.map((t: any) => (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            tone === t.value
                              ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Custom Instructions</Label>
                    <Textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g., Mention our new scheduling feature, avoid discussing pricing..."
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !companyName.trim()}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Researching & Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Intelligent Letter
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Activity Log */}
            {(isLoading || logs.length > 0) && (
              <AgentActivityLog
                logs={logs}
                isLoading={isLoading}
                title="Letter Intelligence Agent"
                subtitle="Researching & writing"
                maxHeight="400px"
              />
            )}

            {/* Generated Letter */}
            {generationResult && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-400" />
                      Generated Letter
                    </CardTitle>
                    <div className="flex gap-2">
                      {generationResult.savedLetterId && (
                        <Link href={`/admin/letters/${generationResult.savedLetterId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Letter
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                  {generationResult.subject && (
                    <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-700">
                      <span className="text-slate-500 text-sm">Subject: </span>
                      <span className="text-white">{generationResult.subject}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {generationResult.letter}
                  </div>
                  
                  {/* Stats and Saved Status */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>🔍 {generationResult.stats?.toolCalls || 0} research queries</span>
                      <span>🔄 {generationResult.stats?.iterations || 0} iterations</span>
                      {generationResult.confidence && (
                        <span>✨ {Math.round(generationResult.confidence * 100)}% confidence</span>
                      )}
                    </div>
                    {generationResult.savedLetterId && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <Save className="h-4 w-4" />
                        <span>Draft saved</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Research Summary */}
            {generationResult?.researchSummary && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader 
                  className="pb-4 cursor-pointer"
                  onClick={() => setShowResearch(!showResearch)}
                >
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-cyan-400" />
                      Research Insights
                    </span>
                    {showResearch ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </CardTitle>
                </CardHeader>
                {showResearch && (
                  <CardContent className="space-y-4">
                    {/* Prior Interactions - CRITICAL for accuracy verification */}
                    {generationResult.researchSummary.priorInteractions && (
                      <div className={`p-3 rounded-lg border ${
                        generationResult.researchSummary.priorInteractions.found 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          {generationResult.researchSummary.priorInteractions.found ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-emerald-300">Verified Prior Interactions</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                              <span className="text-amber-300">No Prior Interactions Found</span>
                            </>
                          )}
                        </h4>
                        <p className="text-sm text-slate-400 mb-2">
                          {generationResult.researchSummary.priorInteractions.summary}
                        </p>
                        {generationResult.researchSummary.priorInteractions.interactions?.length > 0 && (
                          <ul className="space-y-2 mt-2">
                            {generationResult.researchSummary.priorInteractions.interactions.map((interaction, i) => (
                              <li key={i} className="text-sm text-slate-400 bg-slate-900/50 p-2 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    {interaction.type}
                                  </Badge>
                                  <span className="text-xs text-slate-500">{interaction.date}</span>
                                </div>
                                <p className="text-slate-300">{interaction.summary}</p>
                                {interaction.participants && interaction.participants.length > 0 && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Participants: {interaction.participants.join(', ')}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Company Insights */}
                    {generationResult.researchSummary.companyInsights?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-400" />
                          Company Insights
                        </h4>
                        <ul className="space-y-1">
                          {generationResult.researchSummary.companyInsights.map((insight, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Similar Customers */}
                    {generationResult.researchSummary.similarCustomers?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-400" />
                          Similar Customers
                        </h4>
                        <ul className="space-y-1">
                          {generationResult.researchSummary.similarCustomers.map((customer, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-green-400 mt-1">•</span>
                              {customer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pain Points */}
                    {generationResult.researchSummary.painPoints?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Identified Pain Points
                        </h4>
                        <ul className="space-y-1">
                          {generationResult.researchSummary.painPoints.map((pain, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-amber-400 mt-1">•</span>
                              {pain}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Opportunities */}
                    {generationResult.researchSummary.opportunities?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          Opportunities
                        </h4>
                        <ul className="space-y-1">
                          {generationResult.researchSummary.opportunities.map((opp, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-emerald-400 mt-1">•</span>
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Personalization Points */}
                    {generationResult.personalizationPoints?.length > 0 && (
                      <div className="pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-400" />
                          Personalization Points Used
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {generationResult.personalizationPoints.map((point, i) => (
                            <Badge key={i} className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                              {point}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && logs.length === 0 && !generationResult && (
              <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">Ready to Generate</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Enter company information and click generate. The AI will research the company, 
                    find relevant insights, and craft a personalized letter.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* HubSpot Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[70vh] flex flex-col overflow-hidden border border-slate-700">
            {/* Header with tabs */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
              <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
                {(['deals', 'companies', 'contacts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { 
                      setSelectorTab(tab); 
                      setSearchQuery('');
                      if (tab === 'deals' && deals.length === 0) fetchDeals();
                      if (tab === 'companies' && companies.length === 0) fetchCompanies();
                      if (tab === 'contacts') fetchContacts(selectedCompanyId || undefined);
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectorTab === tab 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowSelector(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${selectorTab}...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Deals */}
                  {selectorTab === 'deals' && (
                    filteredDeals.length === 0 ? (
                      <p className="text-center text-slate-500 py-12">No deals found</p>
                    ) : (
                      filteredDeals.map(deal => (
                        <button 
                          key={deal.id} 
                          onClick={() => selectDeal(deal.id)} 
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="font-medium text-white">{deal.dealname}</div>
                          <div className="text-xs text-slate-500">{deal.dealstage}</div>
                        </button>
                      ))
                    )
                  )}

                  {/* Companies */}
                  {selectorTab === 'companies' && (
                    filteredCompanies.length === 0 ? (
                      <p className="text-center text-slate-500 py-12">No companies found</p>
                    ) : (
                      filteredCompanies.map(company => (
                        <button 
                          key={company.id} 
                          onClick={() => selectCompany(company)} 
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="font-medium text-white">{company.name}</div>
                          {company.domain && <div className="text-xs text-slate-500">{company.domain}</div>}
                        </button>
                      ))
                    )
                  )}

                  {/* Contacts */}
                  {selectorTab === 'contacts' && (
                    filteredContacts.length === 0 ? (
                      <p className="text-center text-slate-500 py-12">No contacts found</p>
                    ) : (
                      filteredContacts.map(contact => (
                        <button 
                          key={contact.id} 
                          onClick={() => selectContact(contact)} 
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="font-medium text-white">
                            {contact.fullName || `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || 'Unnamed'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {[contact.jobtitle, contact.email].filter(Boolean).join(' • ')}
                          </div>
                        </button>
                      ))
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

