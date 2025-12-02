'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Globe,
  MapPin,
  Briefcase,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Loader2,
  Search,
  X,
  Zap,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Settings,
  Copy,
  Check,
  Send,
  Users,
  Database,
} from 'lucide-react';
import { AgentCard } from '@/components/ai/AgentCard';
import { useAgentRunner, type AgentTarget, type AgentInstance } from '@/lib/store/agentStore';

// ============================================================================
// Types
// ============================================================================

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

interface HubSpotDeal {
  id: string;
  dealname: string;
  dealstage?: string;
  amount?: string;
  pipeline?: string;
}

// ============================================================================
// Letter Type Options
// ============================================================================

const LETTER_TYPES = [
  { value: 'cold_outreach', label: 'Cold Outreach', icon: Mail },
  { value: 'follow_up', label: 'Follow Up', icon: RefreshCw },
  { value: 'reengagement', label: 'Re-engagement', icon: Zap },
  { value: 'referral', label: 'Referral', icon: Users },
  { value: 'existing_customer', label: 'Existing Customer', icon: Building2 },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'consultative', label: 'Consultative' },
  { value: 'casual', label: 'Casual' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function AgentsPage() {
  // Agent store
  const {
    runAgent,
    runBatchAgents,
    cancelAgent,
    removeAgent,
    clearCompleted,
    toggleMinimize,
    getAllAgents,
    getActiveAgents,
    getCompletedAgents,
    activeCount,
  } = useAgentRunner();
  
  // UI State
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLetter, setSelectedLetter] = useState<AgentInstance | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form state for new agent
  const [newAgent, setNewAgent] = useState<AgentTarget>({
    companyName: '',
    companyIndustry: '',
    companyDomain: '',
    companyLocation: '',
    contactName: '',
    contactTitle: '',
    contactEmail: '',
    letterType: 'cold_outreach',
    tone: 'professional',
    customInstructions: '',
  });
  
  // HubSpot selector state
  const [showHubspotSelector, setShowHubspotSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'deals' | 'companies' | 'contacts'>('companies');
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [companies, setCompanies] = useState<HubSpotCompany[]>([]);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCompanyForBatch, setSelectedCompanyForBatch] = useState<string | null>(null);
  const [selectedContactsForBatch, setSelectedContactsForBatch] = useState<HubSpotContact[]>([]);
  
  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchTargets, setBatchTargets] = useState<AgentTarget[]>([]);
  
  // Get agents
  const allAgents = getAllAgents();
  const activeAgents = getActiveAgents();
  const completedAgents = getCompletedAgents();
  
  // ============================================================================
  // HubSpot Data Loading
  // ============================================================================
  
  const fetchDeals = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/hubspot/deals?fetchAll=true&useSync=true');
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
      const response = await fetch('/api/admin/hubspot/companies?fetchAll=true&useSync=true');
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
        : '/api/admin/hubspot/contacts?fetchAll=true&useSync=true';
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
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
  const handleLaunchAgent = async () => {
    if (!newAgent.companyName.trim()) {
      alert('Please enter a company name');
      return;
    }
    
    await runAgent(newAgent);
    
    // Reset form
    setNewAgent({
      companyName: '',
      companyIndustry: '',
      companyDomain: '',
      companyLocation: '',
      contactName: '',
      contactTitle: '',
      contactEmail: '',
      letterType: 'cold_outreach',
      tone: 'professional',
      customInstructions: '',
    });
    setShowNewAgentForm(false);
  };
  
  const handleLaunchBatch = async () => {
    if (batchTargets.length === 0) {
      alert('Please add at least one target');
      return;
    }
    
    await runBatchAgents(batchTargets);
    setBatchTargets([]);
    setBatchMode(false);
    setShowNewAgentForm(false);
  };
  
  const handleSelectCompany = (company: HubSpotCompany) => {
    if (batchMode) {
      // In batch mode, add to batch targets
      const target: AgentTarget = {
        companyId: company.id,
        companyName: company.name || '',
        companyDomain: company.domain,
        companyIndustry: company.industry,
        companyLocation: [company.city, company.state].filter(Boolean).join(', '),
        letterType: newAgent.letterType,
        tone: newAgent.tone,
        customInstructions: newAgent.customInstructions,
      };
      setBatchTargets(prev => [...prev, target]);
    } else {
      // Single mode - fill form
      setNewAgent(prev => ({
        ...prev,
        companyId: company.id,
        companyName: company.name || '',
        companyDomain: company.domain,
        companyIndustry: company.industry,
        companyLocation: [company.city, company.state].filter(Boolean).join(', '),
      }));
      setSelectedCompanyForBatch(company.id);
    }
    setShowHubspotSelector(false);
  };
  
  const handleSelectContact = (contact: HubSpotContact) => {
    const fullName = contact.fullName || `${contact.firstname || ''} ${contact.lastname || ''}`.trim();
    setNewAgent(prev => ({
      ...prev,
      contactName: fullName,
      contactEmail: contact.email,
      contactTitle: contact.jobtitle,
    }));
    setShowHubspotSelector(false);
  };
  
  const handleSelectDeal = async (deal: HubSpotDeal) => {
    setLoadingData(true);
    try {
      const response = await fetch(`/api/admin/hubspot/deals/${deal.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal details');
      }
      
      const data = await response.json();
      const company = data.companies?.[0];
      const contact = data.contacts?.[0];
      
      if (batchMode) {
        // In batch mode, add to batch targets
        if (company) {
          const target: AgentTarget = {
            companyId: company.id,
            companyName: company.name || '',
            companyDomain: company.domain,
            companyIndustry: company.industry,
            companyLocation: [company.city, company.state].filter(Boolean).join(', '),
            contactName: contact?.fullName || '',
            contactEmail: contact?.email,
            contactTitle: contact?.jobtitle,
            letterType: newAgent.letterType,
            tone: newAgent.tone,
            customInstructions: newAgent.customInstructions,
          };
          setBatchTargets(prev => [...prev, target]);
        }
      } else {
        // Single mode - fill form
        if (company) {
          setNewAgent(prev => ({
            ...prev,
            companyId: company.id,
            companyName: company.name || '',
            companyDomain: company.domain,
            companyIndustry: company.industry,
            companyLocation: [company.city, company.state].filter(Boolean).join(', '),
            contactName: contact?.fullName || '',
            contactEmail: contact?.email,
            contactTitle: contact?.jobtitle,
          }));
          setSelectedCompanyForBatch(company.id);
        }
      }
      setShowHubspotSelector(false);
    } catch (error) {
      console.error('Error fetching deal details:', error);
      alert('Failed to load deal details. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleCopyLetter = () => {
    if (selectedLetter?.result?.letter) {
      navigator.clipboard.writeText(selectedLetter.result.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Filter companies/contacts/deals by search
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Letter Agents</h1>
                <p className="text-slate-400">Launch and monitor AI agents like you&apos;re in Cursor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Active Count Badge */}
              {activeCount > 0 && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {activeCount} running
                </Badge>
              )}
              
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              {/* Clear Completed */}
              {completedAgents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear {completedAgents.length} completed
                </Button>
              )}
              
              {/* Launch New Agent */}
              <Button
                onClick={() => setShowNewAgentForm(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{allAgents.length}</div>
                <div className="text-xs text-slate-400">Total Agents</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Play className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{activeAgents.length}</div>
                <div className="text-xs text-slate-400">Running</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {completedAgents.filter(a => a.status === 'complete').length}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {completedAgents.filter(a => a.status === 'error').length}
                </div>
                <div className="text-xs text-slate-400">Failed</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Agents Grid/List */}
        {allAgents.length === 0 ? (
          <Card className="bg-slate-800/30 border-slate-700 border-dashed">
            <CardContent className="py-16 text-center">
              <Zap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Agents Running</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Launch your first Letter Agent to start generating personalized letters. 
                Each agent researches independently and works in parallel.
              </p>
              <Button
                onClick={() => setShowNewAgentForm(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Launch First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-3'
            }
          `}>
            {/* Sort: active first, then by start time */}
            {[...allAgents]
              .sort((a, b) => {
                // Active agents first
                const aActive = ['preparing', 'researching', 'generating'].includes(a.status);
                const bActive = ['preparing', 'researching', 'generating'].includes(b.status);
                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;
                // Then by start time (newest first)
                return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
              })
              .map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onCancel={() => cancelAgent(agent.id)}
                  onRemove={() => removeAgent(agent.id)}
                  onToggleMinimize={() => toggleMinimize(agent.id)}
                  onViewLetter={(agent) => setSelectedLetter(agent)}
                />
              ))
            }
          </div>
        )}
      </div>
      
      {/* New Agent Modal */}
      {showNewAgentForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {batchMode ? 'Launch Batch Agents' : 'Launch New Agent'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {batchMode 
                      ? `${batchTargets.length} targets selected`
                      : 'Configure and launch a Letter Intelligence Agent'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBatchMode(!batchMode)}
                  className={`border-slate-600 ${
                    batchMode 
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Batch
                </Button>
                <button 
                  onClick={() => {
                    setShowNewAgentForm(false);
                    setBatchMode(false);
                    setBatchTargets([]);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-4 space-y-4">
              {/* HubSpot Import Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowHubspotSelector(true);
                    setSelectorTab('companies');
                    setSearchQuery('');
                    if (companies.length === 0) fetchCompanies();
                    if (deals.length === 0) fetchDeals();
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Import from HubSpot
                </Button>
              </div>
              
              {/* Batch Targets Preview */}
              {batchMode && batchTargets.length > 0 && (
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">Selected Targets ({batchTargets.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {batchTargets.map((target, i) => (
                      <Badge
                        key={i}
                        className="bg-violet-500/20 text-violet-300 border-violet-500/30 gap-1 pr-1"
                      >
                        {target.companyName}
                        <button
                          onClick={() => setBatchTargets(prev => prev.filter((_, idx) => idx !== i))}
                          className="ml-1 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Company Information */}
              {!batchMode && (
                <div className="space-y-3">
                  <Label className="text-slate-300">Company Name *</Label>
                  <Input
                    value={newAgent.companyName}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Acme Construction"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Industry</Label>
                      <Input
                        value={newAgent.companyIndustry || ''}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, companyIndustry: e.target.value }))}
                        placeholder="e.g., Construction"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Location</Label>
                      <Input
                        value={newAgent.companyLocation || ''}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, companyLocation: e.target.value }))}
                        placeholder="e.g., Toronto, ON"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Website</Label>
                    <Input
                      value={newAgent.companyDomain || ''}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, companyDomain: e.target.value }))}
                      placeholder="e.g., acmeconstruction.com"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  
                  {/* Contact (Optional) */}
                  <div className="pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-slate-300">Contact (Optional)</Label>
                      {selectedCompanyForBatch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowHubspotSelector(true);
                            setSelectorTab('contacts');
                            setSearchQuery('');
                            fetchContacts(selectedCompanyForBatch);
                          }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Select Contact
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={newAgent.contactName || ''}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Contact name"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                      <Input
                        value={newAgent.contactTitle || ''}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, contactTitle: e.target.value }))}
                        placeholder="Title"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Letter Type */}
              <div>
                <Label className="text-slate-300">Letter Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {LETTER_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewAgent(prev => ({ ...prev, letterType: type.value }))}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newAgent.letterType === type.value
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 mb-1 ${
                          newAgent.letterType === type.value ? 'text-violet-400' : 'text-slate-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          newAgent.letterType === type.value ? 'text-violet-300' : 'text-slate-300'
                        }`}>
                          {type.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Tone */}
              <div>
                <Label className="text-slate-300">Tone</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewAgent(prev => ({ ...prev, tone: t.value }))}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        newAgent.tone === t.value
                          ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewAgentForm(false);
                  setBatchMode(false);
                  setBatchTargets([]);
                }}
                className="border-slate-600 text-slate-400"
              >
                Cancel
              </Button>
              {batchMode ? (
                <Button
                  onClick={handleLaunchBatch}
                  disabled={batchTargets.length === 0}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Launch {batchTargets.length} Agents
                </Button>
              ) : (
                <Button
                  onClick={handleLaunchAgent}
                  disabled={!newAgent.companyName.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Launch Agent
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* HubSpot Selector Modal */}
      {showHubspotSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] flex flex-col overflow-hidden border border-slate-700">
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
                      if (tab === 'contacts') fetchContacts(selectedCompanyForBatch || undefined);
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
                onClick={() => setShowHubspotSelector(false)} 
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
                          onClick={() => handleSelectDeal(deal)} 
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="font-medium text-white">{deal.dealname}</div>
                          <div className="text-xs text-slate-500">
                            {[deal.dealstage, deal.pipeline, deal.amount ? `$${deal.amount}` : ''].filter(Boolean).join(' • ')}
                          </div>
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
                          onClick={() => handleSelectCompany(company)} 
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="font-medium text-white">{company.name}</div>
                          <div className="text-xs text-slate-500">
                            {[company.industry, company.domain].filter(Boolean).join(' • ')}
                          </div>
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
                          onClick={() => handleSelectContact(contact)} 
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
      
      {/* Full Letter View Modal */}
      {selectedLetter && selectedLetter.result && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedLetter.name}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedLetter.target.letterType.replace(/_/g, ' ')} • {selectedLetter.target.tone}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLetter(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Subject */}
              {selectedLetter.result.subject && (
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-500 uppercase mb-1">Subject Line</div>
                  <div className="text-white font-medium">{selectedLetter.result.subject}</div>
                </div>
              )}
              
              {/* Letter Body */}
              <div className="bg-white rounded-lg p-6 text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                {selectedLetter.result.letter}
              </div>
              
              {/* Research Summary */}
              {selectedLetter.result.researchSummary && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Research Insights</h3>
                  
                  {selectedLetter.result.researchSummary.companyInsights?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Company Insights</div>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {selectedLetter.result.researchSummary.companyInsights.map((insight, i) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedLetter.result.researchSummary.painPoints?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Pain Points</div>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {selectedLetter.result.researchSummary.painPoints.map((point, i) => (
                          <li key={i}>• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedLetter.result.personalizationPoints?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Personalization Points Used</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedLetter.result.personalizationPoints.map((point, i) => (
                          <Badge key={i} className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLetter}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Letter'}
              </Button>
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

