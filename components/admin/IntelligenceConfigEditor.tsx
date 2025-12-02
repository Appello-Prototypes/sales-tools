'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertTriangle,
  Edit2,
  History,
  RotateCcw,
  Clock,
  Brain,
  User,
  Building2,
  TrendingUp,
  Target,
  AlertCircle,
  Sparkles,
  GitCompare,
  Layers,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  outputFormat: string;
  maxIterations: number;
  isActive: boolean;
}

interface AnalysisType {
  id: string;
  name: string;
  description: string;
  entityType: 'deal' | 'contact' | 'company' | 'all';
  focusAreas: string[];
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IntelligenceConfig {
  agents: {
    deal: AgentConfig;
    contact: AgentConfig;
    company: AgentConfig;
  };
  analysisTypes: AnalysisType[];
  researchInstructions: {
    atlasPrompt: string;
    hubspotPrompt: string;
    generalGuidelines: string;
  };
  qualityStandards: string;
  outputSchema: {
    dealSchema: string;
    contactSchema: string;
    companySchema: string;
  };
  version: number;
  lastUpdatedBy: string;
  updatedAt: string;
}

interface HistoryEntry {
  version: number;
  changeSummary: string;
  action: string;
  actionDetails?: string;
  changedBy: string;
  createdAt: string;
  changeCount: number;
}

interface VersionDetail {
  version: number;
  configSnapshot: any;
  changes: Array<{
    field: string;
    previousValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'deleted';
  }>;
  changeSummary: string;
  action: string;
  actionDetails?: string;
  changedBy: string;
  createdAt: string;
}

interface IntelligenceConfigEditorProps {
  onConfigUpdate?: (config: IntelligenceConfig) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function IntelligenceConfigEditor({ onConfigUpdate }: IntelligenceConfigEditorProps) {
  const [config, setConfig] = useState<IntelligenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('agents');
  const [selectedAgent, setSelectedAgent] = useState<'deal' | 'contact' | 'company'>('deal');

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // New analysis type form
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newType, setNewType] = useState({
    id: '',
    name: '',
    description: '',
    entityType: 'all' as 'deal' | 'contact' | 'company' | 'all',
    focusAreas: '',
    prompt: '',
  });

  const onConfigUpdateRef = React.useRef(onConfigUpdate);
  onConfigUpdateRef.current = onConfigUpdate;

  // Load configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/intelligence/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onConfigUpdateRef.current?.(data.config);
      } else {
        throw new Error('Failed to load configuration');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/admin/intelligence/config/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      loadHistory();
    }
  }, [activeTab, history.length, loadHistory]);

  // Load version details
  const loadVersionDetails = async (version: number) => {
    try {
      const response = await fetch(`/api/admin/intelligence/config/history?version=${version}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedVersion(data.version);
      }
    } catch (err: any) {
      setError('Failed to load version details');
    }
  };

  // Rollback
  const rollbackToVersion = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) return;

    try {
      setRollingBack(true);
      setError(null);

      const response = await fetch('/api/admin/intelligence/config/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rollback',
          targetVersion: version,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onConfigUpdateRef.current?.(data.config);
        setSuccess(`Rolled back to version ${version}`);
        setSelectedVersion(null);
        await loadHistory();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rollback');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRollingBack(false);
    }
  };

  // Save configuration
  const saveConfig = async (updates: Partial<IntelligenceConfig>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/intelligence/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onConfigUpdateRef.current?.(data.config);
        setSuccess('Configuration saved');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update agent config
  const saveAgentConfig = async (agentId: 'deal' | 'contact' | 'company', updates: Partial<AgentConfig>) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/intelligence/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_agent',
          agentId,
          updates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onConfigUpdateRef.current?.(data.config);
        setSuccess(`${agentId} agent updated`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to update agent');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add analysis type
  const addAnalysisType = async () => {
    if (!newType.id || !newType.name || !newType.prompt) {
      setError('Please fill in required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/intelligence/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_analysis_type',
          analysisType: {
            ...newType,
            focusAreas: newType.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
            isActive: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setShowNewTypeForm(false);
        setNewType({ id: '', name: '', description: '', entityType: 'all', focusAreas: '', prompt: '' });
        setSuccess('Analysis type added');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add analysis type');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete analysis type
  const deleteAnalysisType = async (typeId: string) => {
    if (!confirm('Delete this analysis type?')) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/intelligence/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_analysis_type',
          typeId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setSuccess('Analysis type deleted');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'deal': return TrendingUp;
      case 'contact': return User;
      case 'company': return Building2;
      default: return Brain;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
          <p className="text-slate-400">Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-amber-400 mb-2" />
          <p className="text-slate-400">Failed to load configuration</p>
          <Button onClick={loadConfig} variant="outline" size="sm" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
          <X className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-400 hover:text-red-300" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-300 text-sm">{success}</span>
        </div>
      )}

      {/* Version Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300">v{config.version}</Badge>
          <span className="text-slate-500">Last updated by {config.lastUpdatedBy}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadConfig}
          className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/80 border border-slate-700/50 p-1 rounded-lg gap-1">
          <TabsTrigger
            value="agents"
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
          >
            <Brain className="h-4 w-4 mr-1.5" />
            Agent Prompts
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
          >
            <Target className="h-4 w-4 mr-1.5" />
            Analysis Types
          </TabsTrigger>
          <TabsTrigger
            value="research"
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
          >
            <Layers className="h-4 w-4 mr-1.5" />
            Research
          </TabsTrigger>
          <TabsTrigger
            value="output"
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Output Schema
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-slate-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Agent Prompts Tab */}
        <TabsContent value="agents" className="mt-4 space-y-4">
          {/* Agent Selector */}
          <div className="flex gap-2">
            {(['deal', 'contact', 'company'] as const).map((agentId) => {
              const Icon = getAgentIcon(agentId);
              const agent = config.agents[agentId];
              return (
                <button
                  key={agentId}
                  onClick={() => setSelectedAgent(agentId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedAgent === agentId
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="capitalize">{agentId}</span>
                  <Badge className={agent.isActive ? 'bg-emerald-500/20 text-emerald-300 text-xs' : 'bg-slate-600 text-slate-400 text-xs'}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Selected Agent Config */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {React.createElement(getAgentIcon(selectedAgent), { className: 'h-5 w-5 text-purple-400' })}
                {config.agents[selectedAgent].name}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {config.agents[selectedAgent].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">System Prompt</Label>
                <Textarea
                  value={config.agents[selectedAgent].systemPrompt}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      agents: {
                        ...config.agents,
                        [selectedAgent]: {
                          ...config.agents[selectedAgent],
                          systemPrompt: e.target.value,
                        },
                      },
                    });
                  }}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[400px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Max Iterations</Label>
                  <Input
                    type="number"
                    value={config.agents[selectedAgent].maxIterations}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        agents: {
                          ...config.agents,
                          [selectedAgent]: {
                            ...config.agents[selectedAgent],
                            maxIterations: parseInt(e.target.value) || 10,
                          },
                        },
                      });
                    }}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Output Format</Label>
                  <Select
                    value={config.agents[selectedAgent].outputFormat}
                    onValueChange={(value) => {
                      setConfig({
                        ...config,
                        agents: {
                          ...config.agents,
                          [selectedAgent]: {
                            ...config.agents[selectedAgent],
                            outputFormat: value,
                          },
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="text">Plain Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveAgentConfig(selectedAgent, config.agents[selectedAgent])}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save {selectedAgent} Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Types Tab */}
        <TabsContent value="analysis" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">Analysis Types ({config.analysisTypes.length})</h3>
            <Button
              onClick={() => setShowNewTypeForm(true)}
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Type
            </Button>
          </div>

          {/* New Type Form */}
          {showNewTypeForm && (
            <Card className="bg-slate-800/50 border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Create New Analysis Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs">ID</Label>
                    <Input
                      value={newType.id}
                      onChange={(e) => setNewType({ ...newType, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="e.g., quick_score"
                      className="bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Name</Label>
                    <Input
                      value={newType.name}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      placeholder="e.g., Quick Score"
                      className="bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Entity Type</Label>
                    <Select
                      value={newType.entityType}
                      onValueChange={(v: any) => setNewType({ ...newType, entityType: v })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Description</Label>
                  <Input
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    placeholder="Brief description"
                    className="bg-slate-900 border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Focus Areas (comma-separated)</Label>
                  <Input
                    value={newType.focusAreas}
                    onChange={(e) => setNewType({ ...newType, focusAreas: e.target.value })}
                    placeholder="e.g., risks, opportunities, actions"
                    className="bg-slate-900 border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Prompt Instructions</Label>
                  <Textarea
                    value={newType.prompt}
                    onChange={(e) => setNewType({ ...newType, prompt: e.target.value })}
                    placeholder="Instructions for the AI agent..."
                    className="bg-slate-900 border-slate-600 text-white text-sm min-h-[100px] font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewTypeForm(false);
                      setNewType({ id: '', name: '', description: '', entityType: 'all', focusAreas: '', prompt: '' });
                    }}
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addAnalysisType} disabled={saving}>
                    {saving ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Types List */}
          {config.analysisTypes.map((type) => (
            <AnalysisTypeCard
              key={type.id}
              type={type}
              onUpdate={async (updates) => {
                const response = await fetch('/api/admin/intelligence/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_analysis_type',
                    typeId: type.id,
                    updates,
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  setConfig(data.config);
                  setSuccess('Analysis type updated');
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              onDelete={() => deleteAnalysisType(type.id)}
            />
          ))}
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="mt-4 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Research Instructions</CardTitle>
              <CardDescription className="text-slate-400">
                How the AI agents should use research tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-300">ATLAS Knowledge Base</Label>
                <Textarea
                  value={config.researchInstructions.atlasPrompt}
                  onChange={(e) => setConfig({
                    ...config,
                    researchInstructions: {
                      ...config.researchInstructions,
                      atlasPrompt: e.target.value,
                    },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[120px]"
                />
              </div>
              <div>
                <Label className="text-slate-300">HubSpot CRM</Label>
                <Textarea
                  value={config.researchInstructions.hubspotPrompt}
                  onChange={(e) => setConfig({
                    ...config,
                    researchInstructions: {
                      ...config.researchInstructions,
                      hubspotPrompt: e.target.value,
                    },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[120px]"
                />
              </div>
              <div>
                <Label className="text-slate-300">General Guidelines</Label>
                <Textarea
                  value={config.researchInstructions.generalGuidelines}
                  onChange={(e) => setConfig({
                    ...config,
                    researchInstructions: {
                      ...config.researchInstructions,
                      generalGuidelines: e.target.value,
                    },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[150px]"
                />
              </div>
              <div className="pt-4 border-t border-slate-700">
                <Label className="text-slate-300">Quality Standards</Label>
                <Textarea
                  value={config.qualityStandards}
                  onChange={(e) => setConfig({ ...config, qualityStandards: e.target.value })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[200px]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveConfig({
                    researchInstructions: config.researchInstructions,
                    qualityStandards: config.qualityStandards,
                  })}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Research Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Output Schema Tab */}
        <TabsContent value="output" className="mt-4 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Output Schemas</CardTitle>
              <CardDescription className="text-slate-400">
                Define the JSON structure the AI should produce for each entity type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  Deal Schema
                </Label>
                <Textarea
                  value={config.outputSchema.dealSchema}
                  onChange={(e) => setConfig({
                    ...config,
                    outputSchema: { ...config.outputSchema, dealSchema: e.target.value },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[200px]"
                />
              </div>
              <div>
                <Label className="text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-400" />
                  Contact Schema
                </Label>
                <Textarea
                  value={config.outputSchema.contactSchema}
                  onChange={(e) => setConfig({
                    ...config,
                    outputSchema: { ...config.outputSchema, contactSchema: e.target.value },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[150px]"
                />
              </div>
              <div>
                <Label className="text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  Company Schema
                </Label>
                <Textarea
                  value={config.outputSchema.companySchema}
                  onChange={(e) => setConfig({
                    ...config,
                    outputSchema: { ...config.outputSchema, companySchema: e.target.value },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[150px]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveConfig({ outputSchema: config.outputSchema })}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Output Schemas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                Version History
              </h3>
              <p className="text-sm text-slate-400">Track changes and rollback to previous versions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loadingHistory ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8 text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
                <p className="text-slate-400">Loading history...</p>
              </CardContent>
            </Card>
          ) : history.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8 text-center">
                <History className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p className="text-slate-400">No version history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card
                  key={entry.version}
                  className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 ${
                    index === 0 ? 'border-purple-500/50' : ''
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-purple-500/20 text-purple-300">v{entry.version}</Badge>
                          {index === 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">Current</Badge>
                          )}
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium truncate">{entry.changeSummary}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>by {entry.changedBy}</span>
                          {entry.changeCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{entry.changeCount} change{entry.changeCount !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadVersionDetails(entry.version)}
                          className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rollbackToVersion(entry.version)}
                            disabled={rollingBack}
                            className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          >
                            <RotateCcw className={`h-3 w-3 mr-1 ${rollingBack ? 'animate-spin' : ''}`} />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Version Detail Modal */}
          {selectedVersion && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden border border-slate-700">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300">v{selectedVersion.version}</Badge>
                      <span className="text-white font-medium">Version Details</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{selectedVersion.changeSummary}</p>
                  </div>
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </span>
                    <span>by {selectedVersion.changedBy}</span>
                  </div>

                  {selectedVersion.changes && selectedVersion.changes.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <GitCompare className="h-4 w-4 text-purple-400" />
                        Changes
                      </h4>
                      <div className="space-y-2">
                        {selectedVersion.changes.map((change, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border ${
                              change.changeType === 'added' ? 'bg-emerald-500/5 border-emerald-500/30' :
                              change.changeType === 'deleted' ? 'bg-red-500/5 border-red-500/30' :
                              'bg-amber-500/5 border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${
                                change.changeType === 'added' ? 'bg-emerald-500/20 text-emerald-300' :
                                change.changeType === 'deleted' ? 'bg-red-500/20 text-red-300' :
                                'bg-amber-500/20 text-amber-300'
                              }`}>
                                {change.changeType}
                              </Badge>
                              <span className="text-white text-sm font-mono">{change.field}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-700 flex justify-between items-center">
                  <p className="text-sm text-slate-500">{selectedVersion.actionDetails}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedVersion(null)} className="border-slate-600">
                      Close
                    </Button>
                    {history.findIndex(h => h.version === selectedVersion.version) > 0 && (
                      <Button
                        onClick={() => rollbackToVersion(selectedVersion.version)}
                        disabled={rollingBack}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"
                      >
                        <RotateCcw className={`h-4 w-4 mr-2 ${rollingBack ? 'animate-spin' : ''}`} />
                        Rollback to v{selectedVersion.version}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Analysis Type Card Component
// ============================================================================

interface AnalysisTypeCardProps {
  type: AnalysisType;
  onUpdate: (updates: Partial<AnalysisType>) => void;
  onDelete: () => void;
}

function AnalysisTypeCard({ type, onUpdate, onDelete }: AnalysisTypeCardProps) {
  const [editing, setEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(type.prompt);
  const [expanded, setExpanded] = useState(false);

  const entityColors: Record<string, string> = {
    all: 'text-purple-400',
    deal: 'text-blue-400',
    contact: 'text-green-400',
    company: 'text-amber-400',
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{type.name}</span>
              <Badge className={`bg-slate-700 ${entityColors[type.entityType]} text-xs capitalize`}>
                {type.entityType}
              </Badge>
              <Badge className={type.isActive ? 'bg-emerald-500/20 text-emerald-300 text-xs' : 'bg-slate-600 text-slate-400 text-xs'}>
                {type.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{type.description}</p>
            {type.focusAreas.length > 0 && (
              <div className="flex gap-1 mt-2">
                {type.focusAreas.map((area) => (
                  <Badge key={area} className="bg-slate-700 text-slate-300 text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
            >
              {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {editing ? (
              <>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[150px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setEditedPrompt(type.prompt);
                    }}
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdate({ prompt: editedPrompt });
                      setEditing(false);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <pre className="bg-slate-900 rounded-lg p-3 text-slate-300 text-sm font-mono whitespace-pre-wrap">
                  {type.prompt}
                </pre>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit Prompt
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntelligenceConfigEditor;


