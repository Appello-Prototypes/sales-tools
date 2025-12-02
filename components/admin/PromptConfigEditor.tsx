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
  Settings,
  FileText,
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
  Sparkles,
  AlertTriangle,
  Edit2,
  Copy,
  History,
  RotateCcw,
  GitCompare,
  Clock,
  ArrowRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface LetterType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon?: string;
  isCustom: boolean;
  isActive: boolean;
}

interface ToneConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isActive: boolean;
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

interface ConfigChange {
  field: string;
  previousValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'deleted';
}

interface VersionDetail {
  version: number;
  configSnapshot: any;
  changes: ConfigChange[];
  changeSummary: string;
  action: string;
  actionDetails?: string;
  changedBy: string;
  createdAt: string;
}

interface PromptConfig {
  systemPrompt: string;
  letterTypes: LetterType[];
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
  lastUpdatedBy: string;
  updatedAt: string;
}

interface PromptConfigEditorProps {
  onConfigUpdate?: (config: PromptConfig) => void;
  compact?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function PromptConfigEditor({ onConfigUpdate, compact = false }: PromptConfigEditorProps) {
  const [config, setConfig] = useState<PromptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('system');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    system: true,
    research: false,
    quality: false,
  });

  // New letter type form state
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newType, setNewType] = useState({
    id: '',
    name: '',
    description: '',
    prompt: '',
  });

  // Version history state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // Ref to store the callback to avoid infinite loops
  const onConfigUpdateRef = React.useRef(onConfigUpdate);
  onConfigUpdateRef.current = onConfigUpdate;

  // Load configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/letter-studio/config');
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

  // Load version history
  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/admin/letter-studio/config/history');
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

  // Load when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      loadHistory();
    }
  }, [activeTab, history.length, loadHistory]);

  // Load version details
  const loadVersionDetails = async (version: number) => {
    try {
      const response = await fetch(`/api/admin/letter-studio/config/history?version=${version}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedVersion(data.version);
      }
    } catch (err: any) {
      setError('Failed to load version details');
    }
  };

  // Rollback to a version
  const rollbackToVersion = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}? This will overwrite the current configuration.`)) {
      return;
    }

    try {
      setRollingBack(true);
      setError(null);
      
      const response = await fetch('/api/admin/letter-studio/config/history', {
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
        setSuccess(`Successfully rolled back to version ${version}`);
        setSelectedVersion(null);
        await loadHistory(); // Refresh history
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
  const saveConfig = async (updates: Partial<PromptConfig>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/letter-studio/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        onConfigUpdateRef.current?.(data.config);
        setSuccess('Configuration saved successfully');
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

  // Add new letter type
  const addLetterType = async () => {
    if (!newType.id || !newType.name || !newType.prompt) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/letter-studio/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_letter_type',
          letterType: {
            ...newType,
            isActive: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(prev => prev ? { ...prev, letterTypes: data.letterTypes } : null);
        setShowNewTypeForm(false);
        setNewType({ id: '', name: '', description: '', prompt: '' });
        setSuccess('Letter type added successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add letter type');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete letter type
  const deleteLetterType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this letter type?')) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/letter-studio/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_letter_type',
          typeId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(prev => prev ? { ...prev, letterTypes: data.letterTypes } : null);
        setSuccess('Letter type deleted');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete letter type');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
          <Badge className="bg-slate-700 text-slate-300">v{config.version}</Badge>
          <span className="text-slate-500">
            Last updated by {config.lastUpdatedBy}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadConfig}
          className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/80 border border-slate-700/50 p-1 rounded-lg gap-1">
          <TabsTrigger 
            value="system" 
            className="text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:hover:text-slate-200 rounded-md px-4 py-2 transition-all"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            System Prompt
          </TabsTrigger>
          <TabsTrigger 
            value="types" 
            className="text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:hover:text-slate-200 rounded-md px-4 py-2 transition-all"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Letter Types
          </TabsTrigger>
          <TabsTrigger 
            value="tones" 
            className="text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:hover:text-slate-200 rounded-md px-4 py-2 transition-all"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Tones
          </TabsTrigger>
          <TabsTrigger 
            value="research" 
            className="text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:hover:text-slate-200 rounded-md px-4 py-2 transition-all"
          >
            Research
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:hover:text-slate-200 rounded-md px-4 py-2 transition-all"
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* System Prompt Tab */}
        <TabsContent value="system" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">System Prompt</CardTitle>
              <CardDescription className="text-slate-400">
                The base instructions for the AI agent. This defines its role and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[400px]"
                placeholder="Enter system prompt..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => saveConfig({ systemPrompt: config.systemPrompt })}
                  disabled={saving}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all"
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save System Prompt
                </Button>
              </div>

              {/* Quality Standards */}
              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={() => toggleSection('quality')}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {expandedSections.quality ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-white font-medium">Quality Standards</span>
                </button>
                {expandedSections.quality && (
                  <div className="mt-4">
                    <Textarea
                      value={config.qualityStandards}
                      onChange={(e) => setConfig({ ...config, qualityStandards: e.target.value })}
                      className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[200px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={() => saveConfig({ qualityStandards: config.qualityStandards })}
                        disabled={saving}
                        size="sm"
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all"
                      >
                        Save Quality Standards
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Letter Types Tab */}
        <TabsContent value="types" className="mt-4 space-y-4">
          {/* Add New Type Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium">Letter Types ({config.letterTypes.length})</h3>
            <Button
              onClick={() => setShowNewTypeForm(true)}
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Custom Type
            </Button>
          </div>

          {/* New Type Form */}
          {showNewTypeForm && (
            <Card className="bg-slate-800/50 border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Create New Letter Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs">ID (unique, lowercase)</Label>
                    <Input
                      value={newType.id}
                      onChange={(e) => setNewType({ ...newType, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="e.g., quarterly_checkin"
                      className="bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Display Name</Label>
                    <Input
                      value={newType.name}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      placeholder="e.g., Quarterly Check-in"
                      className="bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Description</Label>
                  <Input
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    placeholder="Brief description of when to use this type"
                    className="bg-slate-900 border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Prompt Instructions</Label>
                  <Textarea
                    value={newType.prompt}
                    onChange={(e) => setNewType({ ...newType, prompt: e.target.value })}
                    placeholder="## Letter Type Guidelines&#10;- Guideline 1&#10;- Guideline 2"
                    className="bg-slate-900 border-slate-600 text-white text-sm min-h-[150px] font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewTypeForm(false);
                      setNewType({ id: '', name: '', description: '', prompt: '' });
                    }}
                    className="border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={addLetterType}
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {saving ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                    Create Type
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Letter Types List */}
          {config.letterTypes.map((type) => (
            <LetterTypeCard
              key={type.id}
              type={type}
              onUpdate={async (updates) => {
                const response = await fetch('/api/admin/letter-studio/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_letter_type',
                    typeId: type.id,
                    updates,
                  }),
                });
                if (response.ok) {
                  const data = await response.json();
                  setConfig(prev => prev ? { ...prev, letterTypes: data.letterTypes } : null);
                  setSuccess('Letter type updated');
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              onDelete={type.isCustom ? () => deleteLetterType(type.id) : undefined}
            />
          ))}
        </TabsContent>

        {/* Tones Tab */}
        <TabsContent value="tones" className="mt-4 space-y-4">
          <h3 className="text-white font-medium">Tone Configurations ({config.tones.length})</h3>
          {config.tones.map((tone) => (
            <Card key={tone.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{tone.name}</span>
                      <Badge className={tone.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600 text-slate-300'}>
                        {tone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{tone.description}</p>
                  </div>
                </div>
                <Textarea
                  value={tone.prompt}
                  onChange={(e) => {
                    const newTones = config.tones.map(t =>
                      t.id === tone.id ? { ...t, prompt: e.target.value } : t
                    );
                    setConfig({ ...config, tones: newTones });
                  }}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[80px]"
                />
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button
              onClick={() => saveConfig({ tones: config.tones })}
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save All Tones
            </Button>
          </div>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="mt-4 space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Research Instructions</CardTitle>
              <CardDescription className="text-slate-400">
                Instructions for how the AI should use each tool during research.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer vs Prospect */}
              <div>
                <Label className="text-slate-300">Customer vs Prospect Detection</Label>
                <p className="text-slate-500 text-xs mb-2">
                  Instructions for determining customer status and adjusting approach.
                </p>
                <Textarea
                  value={config.researchInstructions.customerVsProspectPrompt}
                  onChange={(e) => setConfig({
                    ...config,
                    researchInstructions: {
                      ...config.researchInstructions,
                      customerVsProspectPrompt: e.target.value,
                    },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[150px]"
                />
              </div>

              {/* ATLAS */}
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
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[100px]"
                />
              </div>

              {/* HubSpot */}
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
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[100px]"
                />
              </div>

              {/* Firecrawl */}
              <div>
                <Label className="text-slate-300">Firecrawl Web Research</Label>
                <Textarea
                  value={config.researchInstructions.firecrawlPrompt}
                  onChange={(e) => setConfig({
                    ...config,
                    researchInstructions: {
                      ...config.researchInstructions,
                      firecrawlPrompt: e.target.value,
                    },
                  })}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[100px]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveConfig({ researchInstructions: config.researchInstructions })}
                  disabled={saving}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all"
                >
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Research Instructions
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
                <History className="h-5 w-5 text-violet-400" />
                Version History
              </h3>
              <p className="text-sm text-slate-400">Track changes and rollback to previous versions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
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
                <p className="text-sm text-slate-500 mt-1">Changes will be tracked when you save configurations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card 
                  key={entry.version} 
                  className={`bg-slate-800/50 border-slate-700 transition-all ${
                    index === 0 ? 'border-violet-500/50' : ''
                  } hover:border-slate-600`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`
                            ${entry.action === 'create' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                            ${entry.action === 'update' ? 'bg-blue-500/20 text-blue-300' : ''}
                            ${entry.action === 'add_letter_type' ? 'bg-green-500/20 text-green-300' : ''}
                            ${entry.action === 'update_letter_type' ? 'bg-amber-500/20 text-amber-300' : ''}
                            ${entry.action === 'delete_letter_type' ? 'bg-red-500/20 text-red-300' : ''}
                            ${entry.action === 'rollback' ? 'bg-purple-500/20 text-purple-300' : ''}
                          `}>
                            v{entry.version}
                          </Badge>
                          {index === 0 && (
                            <Badge className="bg-violet-500/20 text-violet-300 text-xs">Current</Badge>
                          )}
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white text-sm font-medium truncate">
                          {entry.changeSummary || entry.actionDetails || 'Configuration updated'}
                        </p>
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
                          className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
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
                            className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500 transition-all"
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
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/20 text-violet-300">v{selectedVersion.version}</Badge>
                      <span className="text-white font-medium">Version Details</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedVersion.changeSummary}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedVersion(null)} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </span>
                    <span>by {selectedVersion.changedBy}</span>
                    <Badge className={`
                      ${selectedVersion.action === 'create' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                      ${selectedVersion.action === 'update' ? 'bg-blue-500/20 text-blue-300' : ''}
                      ${selectedVersion.action === 'add_letter_type' ? 'bg-green-500/20 text-green-300' : ''}
                      ${selectedVersion.action === 'update_letter_type' ? 'bg-amber-500/20 text-amber-300' : ''}
                      ${selectedVersion.action === 'delete_letter_type' ? 'bg-red-500/20 text-red-300' : ''}
                      ${selectedVersion.action === 'rollback' ? 'bg-purple-500/20 text-purple-300' : ''}
                    `}>
                      {selectedVersion.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Changes */}
                  {selectedVersion.changes && selectedVersion.changes.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <GitCompare className="h-4 w-4 text-violet-400" />
                        Changes in this Version
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
                            {change.changeType === 'modified' && (
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-red-400 flex-shrink-0">−</span>
                                  <pre className="text-slate-400 whitespace-pre-wrap break-all font-mono text-xs bg-slate-900/50 p-2 rounded flex-1">
                                    {typeof change.previousValue === 'object' 
                                      ? JSON.stringify(change.previousValue, null, 2)
                                      : String(change.previousValue || '(empty)')}
                                  </pre>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-emerald-400 flex-shrink-0">+</span>
                                  <pre className="text-slate-300 whitespace-pre-wrap break-all font-mono text-xs bg-slate-900/50 p-2 rounded flex-1">
                                    {typeof change.newValue === 'object'
                                      ? JSON.stringify(change.newValue, null, 2)
                                      : String(change.newValue || '(empty)')}
                                  </pre>
                                </div>
                              </div>
                            )}
                            {change.changeType === 'added' && (
                              <pre className="text-emerald-300 text-xs mt-1 font-mono bg-slate-900/50 p-2 rounded whitespace-pre-wrap">
                                {typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue, null, 2)
                                  : String(change.newValue)}
                              </pre>
                            )}
                            {change.changeType === 'deleted' && (
                              <pre className="text-red-300 text-xs mt-1 font-mono bg-slate-900/50 p-2 rounded whitespace-pre-wrap line-through">
                                {typeof change.previousValue === 'object'
                                  ? JSON.stringify(change.previousValue, null, 2)
                                  : String(change.previousValue)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Config Snapshot Preview */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Configuration at this Version</h4>
                    <div className="bg-slate-900 rounded-lg p-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-slate-400">
                        <div>Letter Types: {selectedVersion.configSnapshot?.letterTypes?.length || 0}</div>
                        <div>Tones: {selectedVersion.configSnapshot?.tones?.length || 0}</div>
                        <div>System Prompt: {selectedVersion.configSnapshot?.systemPrompt?.length || 0} chars</div>
                        <div>Quality Standards: {selectedVersion.configSnapshot?.qualityStandards?.length || 0} chars</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-800/80">
                  <p className="text-sm text-slate-500">
                    {selectedVersion.actionDetails}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedVersion(null)}
                      className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
                    >
                      Close
                    </Button>
                    {history.findIndex(h => h.version === selectedVersion.version) > 0 && (
                      <Button
                        onClick={() => rollbackToVersion(selectedVersion.version)}
                        disabled={rollingBack}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all"
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
// Letter Type Card Component
// ============================================================================

interface LetterTypeCardProps {
  type: LetterType;
  onUpdate: (updates: Partial<LetterType>) => void;
  onDelete?: () => void;
}

function LetterTypeCard({ type, onUpdate, onDelete }: LetterTypeCardProps) {
  const [editing, setEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(type.prompt);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`bg-slate-800/50 ${type.isCustom ? 'border-violet-500/30' : 'border-slate-700'}`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{type.name}</span>
              {type.isCustom && (
                <Badge className="bg-violet-500/20 text-violet-300 text-xs">Custom</Badge>
              )}
              <Badge className={type.isActive ? 'bg-emerald-500/20 text-emerald-300 text-xs' : 'bg-slate-600 text-slate-300 text-xs'}>
                {type.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{type.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
            >
              {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {editing ? (
              <>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white font-mono text-sm min-h-[200px]"
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
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 transition-all"
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
                    className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all"
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

export default PromptConfigEditor;

