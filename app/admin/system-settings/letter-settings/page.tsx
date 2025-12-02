'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

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

export default function LetterSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LetterSettings | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string>('');
  const [newSampleName, setNewSampleName] = useState('');
  const [newSampleContent, setNewSampleContent] = useState('');
  const [newSampleDescription, setNewSampleDescription] = useState('');

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
      await Promise.all([fetchSettings(), fetchModels()]);
    } catch (error) {
      router.push('/admin/login');
    }
  };

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
      console.error('Error fetching models:', error);
      // Fallback to default models if API fails
      setModels([
        {
          id: 'claude-sonnet-4-5-20250929',
          name: 'Claude Sonnet 4.5',
          description: 'Latest and most capable model',
          recommended: true,
          default: true,
          category: 'latest',
        },
      ]);
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

  const handleSave = async () => {
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
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Failed to load settings'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Letter Settings</h1>
            <p className="text-muted-foreground">Configure AI model and prompts for cold call letter generation</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

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
                    <>
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
                              <div className="flex items-center gap-2">
                                <span>
                                  {model.name}
                                  {model.recommended && ' ⭐'}
                                  {model.default && ' (Default)'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {settings.aiModel && (
                        <div className="mt-2">
                          {(() => {
                            const selectedModel = models.find((m) => m.id === settings.aiModel);
                            return selectedModel ? (
                              <div className="text-sm text-muted-foreground">
                                <p>
                                  {models.length} model{models.length !== 1 ? 's' : ''} available.{' '}
                                  {selectedModel.recommended && (
                                    <span className="font-medium text-blue-600">
                                      {selectedModel.name} is recommended for best performance.
                                    </span>
                                  )}
                                </p>
                                {selectedModel.description && (
                                  <p className="mt-1">{selectedModel.description}</p>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </>
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
                  <p className="text-sm text-muted-foreground">
                    Maximum length of AI responses. Higher values allow more detailed responses.
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Controls randomness. Lower values make responses more focused and deterministic.
                  </p>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <span className="text-xs text-muted-foreground">
                      Changes take effect immediately after saving
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customize the AI's behavior and personality. This prompt guides how the AI responds to all letter generation requests.
                  </p>
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

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    // Reset to defaults
                    fetchSettings();
                  }
                }}
              >
                Reset to Defaults
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}

