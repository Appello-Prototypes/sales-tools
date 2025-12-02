'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Brain,
  Globe,
  Settings,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react';

interface SystemConnection {
  name: string;
  type: 'api' | 'database' | 'mcp';
  status: 'connected' | 'disconnected' | 'error';
  endpoint?: string;
  lastChecked?: Date;
  details?: any;
}

interface ScoringConfig {
  weights: {
    urgency: number;
    painSeverity: number;
    companySize: number;
    timeline: number;
    likelihood: number;
    currentState: number;
    budgetIndicators: number;
  };
  gradeThresholds: Record<string, number>;
  priorityThresholds: Record<string, number>;
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<SystemConnection[]>([]);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [customPrompts, setCustomPrompts] = useState({
    industryBenchmarks: '',
    peerComparison: '',
    successStories: '',
    personalizedInsights: '',
    nextSteps: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    loadSystemStatus();
    loadScoringConfig();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system-status');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScoringConfig = async () => {
    try {
      const response = await fetch('/api/admin/scoring-config');
      if (response.ok) {
        const data = await response.json();
        setScoringConfig(data.config);
        if (data.customPrompts) {
          setCustomPrompts(data.customPrompts);
        }
      }
    } catch (error) {
      console.error('Error loading scoring config:', error);
    }
  };

  const saveScoringConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/scoring-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: scoringConfig,
          customPrompts,
        }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Error saving configuration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      connected: 'default',
      error: 'destructive',
      disconnected: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Analytics & Configuration</h1>
            <p className="text-sm text-muted-foreground">Monitor connections, configure scoring, and manage AI prompts</p>
          </div>
          <Button onClick={loadSystemStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connections">System Connections</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Configuration</TabsTrigger>
            <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
            <TabsTrigger value="variables">Variables & Logic</TabsTrigger>
            <TabsTrigger value="process">Analysis Process</TabsTrigger>
          </TabsList>

          {/* System Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Connected Services
                </CardTitle>
                <CardDescription>
                  Status of all external services and APIs used by the assessment system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.map((conn, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {conn.type === 'database' && <Database className="h-6 w-6 text-blue-600" />}
                        {conn.type === 'api' && <Brain className="h-6 w-6 text-purple-600" />}
                        {conn.type === 'mcp' && <Globe className="h-6 w-6 text-green-600" />}
                        <div>
                          <h3 className="font-semibold">{conn.name}</h3>
                          {conn.endpoint && (
                            <p className="text-sm text-muted-foreground">{conn.endpoint}</p>
                          )}
                          {conn.details && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              {conn.details.connection && (
                                <p><span className="font-medium">Connection:</span> {conn.details.connection}</p>
                              )}
                              {conn.details.tools && Array.isArray(conn.details.tools) && conn.details.tools.length > 0 && (
                                <p><span className="font-medium">Tools:</span> {conn.details.tools.join(', ')}</p>
                              )}
                              {conn.details.ragEnabled !== undefined && (
                                <p><span className="font-medium">RAG Enabled:</span> {conn.details.ragEnabled ? 'Yes ✅' : 'No'}</p>
                              )}
                              {conn.details.error && (
                                <p className="text-red-600"><span className="font-medium">Error:</span> {conn.details.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(conn.status)}
                        {getStatusBadge(conn.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scoring Configuration Tab */}
          <TabsContent value="scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Scoring Weights
                </CardTitle>
                <CardDescription>
                  Adjust the weight of each factor in the opportunity scoring algorithm (must total 100)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoringConfig && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(scoringConfig.weights).map(([key, value]: [string, number]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              setScoringConfig({
                                ...scoringConfig,
                                weights: {
                                  ...scoringConfig.weights,
                                  [key]: newValue,
                                },
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">
                        Total Weight: {Object.values(scoringConfig.weights).reduce((sum, w) => sum + w, 0)}/100
                      </p>
                      {Object.values(scoringConfig.weights).reduce((sum, w) => sum + w, 0) !== 100 && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Weights must total exactly 100
                        </p>
                      )}
                    </div>
                    <Button onClick={saveScoringConfig} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Thresholds</CardTitle>
                <CardDescription>Minimum percentage scores for each grade</CardDescription>
              </CardHeader>
              <CardContent>
                {scoringConfig && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(scoringConfig.gradeThresholds).map(([grade, threshold]: [string, number]) => (
                      <div key={grade} className="space-y-2">
                        <Label>{grade}</Label>
                        <Input
                          type="number"
                          value={threshold}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setScoringConfig({
                              ...scoringConfig,
                              gradeThresholds: {
                                ...scoringConfig.gradeThresholds,
                                [grade]: newValue,
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Thresholds</CardTitle>
                <CardDescription>Minimum scores for priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                {scoringConfig && (
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(scoringConfig.priorityThresholds).map(([priority, threshold]: [string, number]) => (
                      <div key={priority} className="space-y-2">
                        <Label>{priority}</Label>
                        <Input
                          type="number"
                          value={threshold}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setScoringConfig({
                              ...scoringConfig,
                              priorityThresholds: {
                                ...scoringConfig.priorityThresholds,
                                [priority]: newValue,
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Prompts Tab */}
          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Custom AI Prompts
                </CardTitle>
                <CardDescription>
                  Inject custom prompts to be added to AI analysis. These will be prepended to the default prompts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Industry Benchmarks Prompt</Label>
                    <Textarea
                      value={customPrompts.industryBenchmarks}
                      onChange={(e) =>
                        setCustomPrompts({ ...customPrompts, industryBenchmarks: e.target.value })
                      }
                      placeholder="Add custom context or instructions for industry benchmarks generation..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peer Comparison Prompt</Label>
                    <Textarea
                      value={customPrompts.peerComparison}
                      onChange={(e) =>
                        setCustomPrompts({ ...customPrompts, peerComparison: e.target.value })
                      }
                      placeholder="Add custom context for peer comparison..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Success Stories Prompt</Label>
                    <Textarea
                      value={customPrompts.successStories}
                      onChange={(e) =>
                        setCustomPrompts({ ...customPrompts, successStories: e.target.value })
                      }
                      placeholder="Add custom context for success stories..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Personalized Insights Prompt</Label>
                    <Textarea
                      value={customPrompts.personalizedInsights}
                      onChange={(e) =>
                        setCustomPrompts({ ...customPrompts, personalizedInsights: e.target.value })
                      }
                      placeholder="Add custom context for personalized insights..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Steps Prompt</Label>
                    <Textarea
                      value={customPrompts.nextSteps}
                      onChange={(e) =>
                        setCustomPrompts({ ...customPrompts, nextSteps: e.target.value })
                      }
                      placeholder="Add custom context for next steps..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={saveScoringConfig} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Prompts'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variables & Logic Tab */}
          <TabsContent value="variables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Scoring Variables & Logic
                </CardTitle>
                <CardDescription>
                  View all variables considered in scoring and ROI calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Opportunity Scoring Variables</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(
                          {
                            urgency: '1-10 slider → 0-20 points (non-linear)',
                            painSeverity: 'Number of pain points (1.5 pts each) + Hours/week multiplier',
                            companySize: 'Field workers count → 6-15 points',
                            timeline: 'Decision timeline → 2-15 points',
                            likelihood: '1-10 slider → 0-15 points (non-linear)',
                            currentState: 'Manual systems indicator → 0-10 points',
                            budgetIndicators: 'Competitor evaluation + next steps → 0-5 points',
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">ROI Calculation Variables</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(
                          {
                            revenueEstimation: 'fieldWorkers × $120,000',
                            hourlyRate: '$35/hr (admin rate)',
                            timeSavingsPercent: '75% reduction',
                            profitImprovementPercent: '60% of margin loss recovered (max 8%)',
                            changeOrderCapture: '80% of lost change orders',
                            complianceSavings: '70% reduction',
                            appelloPricing: '$10/user/month (min 10 users)',
                            onboardingCost: '$6,000 one-time',
                            trainingCost: '20 hours × $35/hr = $700',
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">AI Analysis Variables</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(
                          {
                            similarCustomers: 'ATLAS query: trade + fieldWorkers + painPoints',
                            industryBenchmarks: 'Claude analysis of similar customers',
                            peerComparison: 'Claude analysis of ROI and outcomes',
                            successStories: 'Claude generation from similar customer profiles',
                            personalizedInsights: 'Claude analysis of full assessment',
                            nextSteps: 'Claude analysis of timeline and demo focus',
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Process Tab */}
          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complete Analysis Process Flow
                </CardTitle>
                <CardDescription>
                  The exact step-by-step script the system follows from assessment submission to final report generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Phase 1: Submission & Scoring */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                      Phase 1: Assessment Submission & Scoring
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Receive Assessment Data</p>
                          <p className="text-sm text-muted-foreground">Endpoint: POST /api/assessments/[submissionId]/submit</p>
                          <p className="text-xs text-muted-foreground mt-1">• Accepts all 5 sections + name/email</p>
                          <p className="text-xs text-muted-foreground">• Finds existing assessment by submissionId</p>
                          <p className="text-xs text-muted-foreground">• Updates contact info and all sections</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Calculate Completion Metrics</p>
                          <p className="text-xs text-muted-foreground mt-1">• Sets completedAt timestamp</p>
                          <p className="text-xs text-muted-foreground">• Calculates timeToComplete (seconds)</p>
                          <p className="text-xs text-muted-foreground">• Sets status = 'completed', currentStep = 5</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Calculate Opportunity Score</p>
                          <p className="text-sm text-muted-foreground">Function: calculateOpportunityScore(data)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Calculates weighted score (0-100 points)</p>
                          <p className="text-xs text-muted-foreground">• Factors: Urgency (20pts), Pain Severity (20pts), Company Size (15pts), Timeline (15pts), Likelihood (15pts), Current State (10pts), Budget Indicators (5pts)</p>
                          <p className="text-xs text-muted-foreground">• Maps to grade (A+, A, B+, B, C+, C, D)</p>
                          <p className="text-xs text-muted-foreground">• Maps to priority (High ≥75, Medium 55-74, Low &lt;55)</p>
                          <p className="text-xs text-muted-foreground">• Saves: opportunityScore, opportunityGrade, opportunityPriority</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2: ROI Calculation */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                      Phase 2: ROI Calculation
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Calculate ROI</p>
                          <p className="text-sm text-muted-foreground">Function: calculateROI(data)</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p><strong>Time Costs:</strong> hoursPerWeek × 52 × $35/hr</p>
                            <p><strong>Money Costs:</strong></p>
                            <p className="ml-4">• Profit Margin Loss: Based on pain points + urgency (0-8% of revenue)</p>
                            <p className="ml-4">• Change Order Loss: 8% of revenue (if change order pain point)</p>
                            <p className="ml-4">• Compliance Costs: $15K (if safety/compliance pain point)</p>
                            <p><strong>Appello Investment:</strong></p>
                            <p className="ml-4">• Software: (fieldWorkers + 3) × $10/month × 12 (min 10 users)</p>
                            <p className="ml-4">• Onboarding: $6,000 (one-time)</p>
                            <p className="ml-4">• Training: 20 hours × $35/hr = $700</p>
                            <p><strong>Savings:</strong></p>
                            <p className="ml-4">• Time Savings: 75% reduction</p>
                            <p className="ml-4">• Profit Improvement: Recover 60% of margin loss (max 8%)</p>
                            <p className="ml-4">• Change Order Capture: 80% of lost change orders</p>
                            <p className="ml-4">• Compliance Savings: 70% reduction</p>
                            <p><strong>ROI Metrics:</strong></p>
                            <p className="ml-4">• Net Annual Value: totalSavings - softwareCost</p>
                            <p className="ml-4">• ROI %: ((netValue - oneTimeCosts) / totalInvestment) × 100</p>
                            <p className="ml-4">• Payback: totalInvestment / (totalSavings / 12) months</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3: Company Research */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                      Phase 3: Comprehensive Company Research
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 1/6: Web Search for Company</p>
                          <p className="text-sm text-muted-foreground">Function: researchCompany() → Web Research</p>
                          <p className="text-xs text-muted-foreground mt-1">• Query: &quot;{'{companyName}'} {'{trade}'} contractor&quot;</p>
                          <p className="text-xs text-muted-foreground">• API: Firecrawl POST /v1/search</p>
                          <p className="text-xs text-muted-foreground">• Limit: 5 results</p>
                          <p className="text-xs text-muted-foreground">• Extracts: Website URL, company info from search results</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 1a: Scrape Company Website</p>
                          <p className="text-sm text-muted-foreground">Function: analyzeCompanyWebsite(url)</p>
                          <p className="text-xs text-muted-foreground mt-1">• API: Firecrawl POST /v1/scrape</p>
                          <p className="text-xs text-muted-foreground">• Formats: markdown</p>
                          <p className="text-xs text-muted-foreground">• Analyzes: Technologies, services, key pages, value propositions, pain points</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 2/6: Competitor Research</p>
                          <p className="text-sm text-muted-foreground">Function: researchCompetitors(companyName, trade, location)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Query: &quot;{'{trade}'} contractors near {'{location}'}&quot;</p>
                          <p className="text-xs text-muted-foreground">• API: Firecrawl POST /v1/search</p>
                          <p className="text-xs text-muted-foreground">• Returns: Competitor names, websites, descriptions, differentiation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 3/6: Industry Research</p>
                          <p className="text-sm text-muted-foreground">Function: researchIndustry(trade, fieldWorkers)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Query: &quot;{'{trade}'} industry trends 2025 challenges opportunities&quot;</p>
                          <p className="text-xs text-muted-foreground">• API: Firecrawl POST /v1/search</p>
                          <p className="text-xs text-muted-foreground">• Returns: Trends, challenges, opportunities, market size</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 4/6: Tools & Software Research</p>
                          <p className="text-sm text-muted-foreground">Function: researchTools(section3, companyName)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Analyzes: Current tools mentioned in assessment</p>
                          <p className="text-xs text-muted-foreground">• Identifies: Likely using, analysis of tool stack</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 5/6: ATLAS Intelligence</p>
                          <p className="text-sm text-muted-foreground">Function: researchATLAS(assessmentData)</p>
                          <p className="text-xs text-muted-foreground mt-1">• MCP Tool: Query_ATLAS</p>
                          <p className="text-xs text-muted-foreground">• Query: &quot;Find similar customers: {'{trade}'}, {'{fieldWorkers}'} field workers, pain points: {'{painPoints}'}&quot;</p>
                          <p className="text-xs text-muted-foreground">• Returns: Similar customers, case studies, relevant examples, insights</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Step 6/6: Generate Sales Intelligence</p>
                          <p className="text-sm text-muted-foreground">Function: generateSalesIntelligence(research, assessmentData)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Analyzes: All research data</p>
                          <p className="text-xs text-muted-foreground">• Generates: Key contacts, decision makers, buying signals, objections, talking points, competitive advantages, risks</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4: Customer Report Generation */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                      Phase 4: Customer Report Generation
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Generate Base Customer Report</p>
                          <p className="text-sm text-muted-foreground">Function: generateCustomerReport(data, roi, score)</p>
                          <p className="text-xs text-muted-foreground mt-1">• Company info, trade, field workers</p>
                          <p className="text-xs text-muted-foreground">• Pain summary (top 5 pain points)</p>
                          <p className="text-xs text-muted-foreground">• Cost analysis (time + money costs)</p>
                          <p className="text-xs text-muted-foreground">• Appello solutions mapping</p>
                          <p className="text-xs text-muted-foreground">• ROI metrics (savings, ROI %, payback)</p>
                          <p className="text-xs text-muted-foreground">• Vision (before/after state)</p>
                          <p className="text-xs text-muted-foreground">• Next steps</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Enhance Report with AI</p>
                          <p className="text-sm text-muted-foreground">Function: enhanceReportWithAI(baseReport, data)</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p><strong>Step 1:</strong> Find Similar Customers (ATLAS)</p>
                            <p className="ml-4">• MCP Tool: Query_ATLAS</p>
                            <p className="ml-4">• Query: &quot;Similar customers: {'{trade}'}, {'{fieldWorkers}'} field workers, pain points: {'{painPoints}'}&quot;</p>
                            <p><strong>Step 2:</strong> Generate Industry Benchmarks (Claude)</p>
                            <p className="ml-4">• Model: claude-sonnet-4-5-20250929</p>
                            <p className="ml-4">• Mode: Extended thinking (16K tokens)</p>
                            <p className="ml-4">• Input: Company profile + similar customers data</p>
                            <p className="ml-4">• Output: Field workers percentile, typical ROI, average savings, common pain points</p>
                            <p><strong>Step 3:</strong> Generate Peer Comparison (Claude)</p>
                            <p className="ml-4">• Input: Company profile + similar customers</p>
                            <p className="ml-4">• Output: Similar companies count, average ROI, common outcomes, typical timeline</p>
                            <p><strong>Step 4:</strong> Generate Success Stories (Claude)</p>
                            <p className="ml-4">• Input: Company profile + similar customers</p>
                            <p className="ml-4">• Output: 2-3 relevant success stories (company profile, challenge, solution, outcome)</p>
                            <p><strong>Step 5:</strong> Generate Personalized Insights (Claude)</p>
                            <p className="ml-4">• Input: Full assessment summary</p>
                            <p className="ml-4">• Output: 3-5 actionable insights</p>
                            <p><strong>Step 6:</strong> Generate Next Steps (Claude)</p>
                            <p className="ml-4">• Input: Timeline, demo focus, urgency</p>
                            <p className="ml-4">• Output: Immediate actions, demo focus areas, timeline guidance</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 5: Admin Report Generation */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
                      Phase 5: Admin/Sales Intelligence Report
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Generate Admin Report</p>
                          <p className="text-sm text-muted-foreground">Function: generateAdminReport(data, score, roi, companyResearch)</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p><strong>Company Intelligence:</strong></p>
                            <p className="ml-4">• Company info, website, industry</p>
                            <p className="ml-4">• Website analysis (technologies, services, value props)</p>
                            <p><strong>Competitive Intelligence:</strong></p>
                            <p className="ml-4">• Competitors list with differentiation</p>
                            <p className="ml-4">• Market positioning</p>
                            <p><strong>Sales Intelligence:</strong></p>
                            <p className="ml-4">• Key contacts, decision makers</p>
                            <p className="ml-4">• Buying signals, objections</p>
                            <p className="ml-4">• Talking points, competitive advantages</p>
                            <p className="ml-4">• Risks and concerns</p>
                            <p><strong>Sales Recommendations:</strong></p>
                            <p className="ml-4">• Next steps (immediate actions)</p>
                            <p className="ml-4">• Demo focus areas</p>
                            <p className="ml-4">• Timeline guidance</p>
                            <p className="ml-4">• Pricing strategy</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 6: Save & Finalize */}
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
                      Phase 6: Save & Finalize
                    </h3>
                    <div className="space-y-2 ml-8">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Save All Data to Database</p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p>• assessment.auditTrail = auditTrail (all AI actions tracked)</p>
                            <p>• assessment.debugLog = debugLog (all processing steps)</p>
                            <p>• assessment.adminReport = adminReport (sales intelligence)</p>
                            <p>• assessment.customerReport = enhancedCustomerReport (AI-enhanced)</p>
                            <p>• assessment.customerReportGeneratedAt = timestamp</p>
                            <p>• Finalize debug log (mark as complete)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Calls Summary */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">API Calls Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-blue-800 mb-2">Firecrawl API Calls:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                          <li>POST /v1/search (company search)</li>
                          <li>POST /v1/search (competitor search)</li>
                          <li>POST /v1/search (industry trends)</li>
                          <li>POST /v1/scrape (company website)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 mb-2">ATLAS MCP Calls:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                          <li>Query_ATLAS (similar customers for research)</li>
                          <li>Query_ATLAS (similar customers for report)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 mb-2">Claude API Calls:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                          <li>Industry benchmarks generation</li>
                          <li>Peer comparison generation</li>
                          <li>Success stories generation</li>
                          <li>Personalized insights generation</li>
                          <li>Next steps generation</li>
                          <li>Website analysis (if scraped)</li>
                          <li>Company info extraction</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 mb-2">Database Operations:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                          <li>Save assessment data</li>
                          <li>Save opportunity score</li>
                          <li>Save ROI calculation</li>
                          <li>Save audit trail</li>
                          <li>Save debug logs</li>
                          <li>Save customer report</li>
                          <li>Save admin report</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Timing Estimates */}
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-3">⏱️ Estimated Processing Times</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 1: Scoring</span>
                        <span className="font-medium">&lt;1 second</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 2: ROI Calculation</span>
                        <span className="font-medium">&lt;1 second</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 3: Company Research</span>
                        <span className="font-medium">30-60 seconds</span>
                        <span className="text-xs text-yellow-700">(4 Firecrawl calls + 1 ATLAS call)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 4: Customer Report AI Enhancement</span>
                        <span className="font-medium">30-60 seconds</span>
                        <span className="text-xs text-yellow-700">(1 ATLAS call + 5 Claude calls)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 5: Admin Report</span>
                        <span className="font-medium">&lt;1 second</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Phase 6: Save to Database</span>
                        <span className="font-medium">&lt;1 second</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <div className="flex justify-between font-semibold">
                          <span className="text-yellow-900">Total Estimated Time</span>
                          <span className="text-yellow-900">60-120 seconds (1-2 minutes)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

