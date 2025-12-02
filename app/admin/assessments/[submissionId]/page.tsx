'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, DollarSign, Clock, Target, CheckCircle2, Star, FileText, Settings, Users, Calendar, Bug, Activity, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, [submissionId]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/admin/assessments/${submissionId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Assessment not found</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assessment, roi, score, report, featureAnalysis } = data;
  
  // Get saved reports if available
  const customerReport = (assessment as any).customerReport || report;
  const adminReport = (assessment as any).adminReport;
  const customerDerivation = customerReport?._derivation;
  const adminDerivation = adminReport?._derivation;

  return (
    <div className="p-6 lg:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {assessment.companyName || 'Assessment Details'}
          </h1>
          <p className="text-muted-foreground">
            Submission ID: {submissionId}
          </p>
        </div>

        {/* Score & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Opportunity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{score.percentage}%</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Grade: {score.grade}</Badge>
                <Badge className={score.priority === 'High' ? 'bg-red-500' : score.priority === 'Medium' ? 'bg-yellow-500' : 'bg-gray-500'}>
                  {score.priority} Priority
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Annual Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-2">
                ${(roi.totalAnnualSavings / 1000).toFixed(0)}K
              </div>
              <p className="text-sm text-muted-foreground">With Appello</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {Math.round(roi.roiPercentage)}%
              </div>
              <p className="text-sm text-muted-foreground">
                Payback: {Math.round(roi.paybackMonths)} months
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Analysis Report */}
        {featureAnalysis && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Appello Features Analysis
              </CardTitle>
              <CardDescription>
                Top Appello features/modules most relevant to this prospect
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recommended Modules */}
              {featureAnalysis.recommendedModules.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Recommended Modules</h3>
                  <div className="flex flex-wrap gap-2">
                    {featureAnalysis.recommendedModules.map((module: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Features */}
              {featureAnalysis.topFeatures.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Top Features (Ranked by Relevance)</h3>
                  <div className="space-y-3">
                    {featureAnalysis.topFeatures.map((feature: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={feature.relevance === 'High' ? 'bg-red-500' : feature.relevance === 'Medium' ? 'bg-yellow-500' : 'bg-gray-500'}>
                                {feature.relevance}
                              </Badge>
                              <span className="text-sm font-medium text-muted-foreground">{feature.module}</span>
                            </div>
                            <h4 className="font-semibold text-base">{feature.feature}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            <strong>Why:</strong> {feature.reason}
                          </p>
                          {feature.painPoints.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <strong>Addresses:</strong> {feature.painPoints.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Differentiators */}
              {featureAnalysis.keyDifferentiators.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Key Differentiators</h3>
                  <ul className="space-y-2">
                    {featureAnalysis.keyDifferentiators.map((diff: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Demo Focus */}
              {featureAnalysis.demoFocus.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Recommended Demo Focus</h3>
                  <ul className="space-y-1">
                    {featureAnalysis.demoFocus.map((focus: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">→</span>
                        <span>{focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demo Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {score.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* All Assessment Answers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete Assessment Answers</CardTitle>
            <CardDescription>All responses from the assessment form</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="section1" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="section1">Company</TabsTrigger>
                <TabsTrigger value="section2">Pain Points</TabsTrigger>
                <TabsTrigger value="section3">Current State</TabsTrigger>
                <TabsTrigger value="section4">Demo</TabsTrigger>
                <TabsTrigger value="section5">Decision</TabsTrigger>
                <TabsTrigger value="debug">Debug Logs</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              {/* Section 1: Company Basics */}
              <TabsContent value="section1" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Trade Specialty</p>
                    <p className="text-base">{assessment.section1?.trade || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Number of Field Workers</p>
                    <p className="text-base">{assessment.section1?.fieldWorkers || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Your Role</p>
                    <p className="text-base">{assessment.section1?.role || 'N/A'}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Section 2: Pain Points */}
              <TabsContent value="section2" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Pain Points</p>
                    {assessment.section2?.painPoints && assessment.section2.painPoints.length > 0 ? (
                      <ul className="space-y-1">
                        {assessment.section2.painPoints.map((pain: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{pain}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No pain points selected</p>
                    )}
                  </div>
                  {assessment.section2?.magicWand && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Biggest Challenge (Magic Wand)</p>
                      <p className="text-base italic">"{assessment.section2.magicWand}"</p>
                    </div>
                  )}
                  {assessment.section2?.urgency !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Urgency Level</p>
                      <p className="text-base">{assessment.section2.urgency}/10</p>
                    </div>
                  )}
                  {assessment.section2?.hoursPerWeek && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Hours Per Week on Admin Tasks</p>
                      <p className="text-base">{assessment.section2.hoursPerWeek}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Section 3: Current State */}
              <TabsContent value="section3" className="mt-4">
                <div className="space-y-4">
                  {assessment.section3?.timesheetMethod && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Timesheet Handling</p>
                      <p className="text-base">{assessment.section3.timesheetMethod}</p>
                    </div>
                  )}
                  {assessment.section3?.unionized && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Union Status</p>
                      <p className="text-base">{assessment.section3.unionized}</p>
                    </div>
                  )}
                  {assessment.section3?.cbaCount && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Number of CBAs</p>
                      <p className="text-base">{assessment.section3.cbaCount}</p>
                    </div>
                  )}
                  {assessment.section3?.unions && assessment.section3.unions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Unions</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.section3.unions.map((union: string, index: number) => (
                          <Badge key={index} variant="outline">{union}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessment.section3?.accountingSoftware && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Accounting Software</p>
                      <p className="text-base">{assessment.section3.accountingSoftware}</p>
                    </div>
                  )}
                  {assessment.section3?.payrollSoftware && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Payroll Software</p>
                      <p className="text-base">{assessment.section3.payrollSoftware}</p>
                    </div>
                  )}
                  {assessment.section3?.constructionSoftware && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Construction Management Software</p>
                      <p className="text-base">{assessment.section3.constructionSoftware}</p>
                    </div>
                  )}
                  {assessment.section3?.notDoing && assessment.section3.notDoing.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Wish They Were Doing (Gaps)</p>
                      <ul className="space-y-1">
                        {assessment.section3.notDoing.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Section 4: Demo Customization */}
              <TabsContent value="section4" className="mt-4">
                <div className="space-y-4">
                  {assessment.section4?.demoFocus && assessment.section4.demoFocus.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Demo Focus Areas</p>
                      <ul className="space-y-1">
                        {assessment.section4.demoFocus.map((focus: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">→</span>
                            <span>{focus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assessment.section4?.evaluators && assessment.section4.evaluators.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Evaluating Stakeholders</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.section4.evaluators.map((evaluator: string, index: number) => (
                          <Badge key={index} variant="outline">{evaluator}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessment.section4?.techComfort && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Crew Comfort Level with Technology</p>
                      <p className="text-base">{assessment.section4.techComfort}</p>
                    </div>
                  )}
                  {assessment.section4?.smartphones && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Crew Smartphones</p>
                      <p className="text-base">{assessment.section4.smartphones}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Section 5: Decision Intelligence */}
              <TabsContent value="section5" className="mt-4">
                <div className="space-y-4">
                  {assessment.section5?.timeline && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Decision Timeline</p>
                      <p className="text-base">{assessment.section5.timeline}</p>
                    </div>
                  )}
                  {assessment.section5?.evaluating && assessment.section5.evaluating.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Evaluating Alternatives</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.section5.evaluating.map((alt: string, index: number) => (
                          <Badge key={index} variant="outline">{alt}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessment.section5?.nextSteps && assessment.section5.nextSteps.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Next Steps Needed</p>
                      <ul className="space-y-1">
                        {assessment.section5.nextSteps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assessment.section5?.likelihood !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Likelihood to Implement</p>
                      <p className="text-base">{assessment.section5.likelihood}/10</p>
                    </div>
                  )}
                  {assessment.section5?.specificQuestions && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Specific Questions</p>
                      <p className="text-base whitespace-pre-wrap">{assessment.section5.specificQuestions}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Debug Logs Tab */}
              <TabsContent value="debug" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5" />
                      Debug Logs
                    </CardTitle>
                    <CardDescription>
                      Complete processing log for this assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assessment.debugLog ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Entries</p>
                            <p className="text-2xl font-bold">{assessment.debugLog.summary?.totalEntries || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Errors</p>
                            <p className="text-2xl font-bold text-red-600">{assessment.debugLog.summary?.errors || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Warnings</p>
                            <p className="text-2xl font-bold text-yellow-600">{assessment.debugLog.summary?.warnings || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-sm font-semibold">
                              {assessment.debugLog.completedAt && assessment.debugLog.startedAt
                                ? `${Math.round((new Date(assessment.debugLog.completedAt).getTime() - new Date(assessment.debugLog.startedAt).getTime()) / 1000)}s`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {assessment.debugLog.entries?.map((entry: any, index: number) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border text-sm ${
                                entry.level === 'error'
                                  ? 'border-red-200 bg-red-50'
                                  : entry.level === 'warn'
                                  ? 'border-yellow-200 bg-yellow-50'
                                  : entry.level === 'debug'
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={entry.level === 'error' ? 'destructive' : entry.level === 'warn' ? 'secondary' : 'outline'}>
                                    {entry.level.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline">{entry.category}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <p className="font-medium">{entry.message}</p>
                              {entry.data && (
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(entry.data, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No debug logs available for this assessment
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Trail Tab */}
              <TabsContent value="audit" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      AI Audit Trail
                    </CardTitle>
                    <CardDescription>
                      Complete log of all AI actions, queries, and data sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assessment.auditTrail ? (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Actions</p>
                            <p className="text-2xl font-bold">{assessment.auditTrail.totalActions || assessment.auditTrail.reportGeneration?.entries?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Claude Queries</p>
                            <p className="text-2xl font-bold">{assessment.auditTrail.totalClaudeQueries || assessment.auditTrail.summary?.totalClaudeQueries || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ATLAS Queries</p>
                            <p className="text-2xl font-bold">{assessment.auditTrail.totalAtlasQueries || assessment.auditTrail.summary?.totalAtlasQueries || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Firecrawl Actions</p>
                            <p className="text-2xl font-bold">{assessment.auditTrail.totalFirecrawlActions || assessment.auditTrail.summary?.totalFirecrawlActions || 0}</p>
                          </div>
                        </div>
                        {(assessment.auditTrail.summary?.totalTokensUsed || assessment.auditTrail.totalInputTokens) && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="font-semibold mb-2">Token Usage</p>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Input</p>
                                <p className="font-medium">{(assessment.auditTrail.summary?.totalTokensUsed?.input || assessment.auditTrail.totalInputTokens || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Output</p>
                                <p className="font-medium">{(assessment.auditTrail.summary?.totalTokensUsed?.output || assessment.auditTrail.totalOutputTokens || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Thinking</p>
                                <p className="font-medium">{(assessment.auditTrail.summary?.totalTokensUsed?.thinking || assessment.auditTrail.totalThinkingTokens || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-medium">
                                  {(
                                    (assessment.auditTrail.summary?.totalTokensUsed?.input || assessment.auditTrail.totalInputTokens || 0) +
                                    (assessment.auditTrail.summary?.totalTokensUsed?.output || assessment.auditTrail.totalOutputTokens || 0) +
                                    (assessment.auditTrail.summary?.totalTokensUsed?.thinking || assessment.auditTrail.totalThinkingTokens || 0)
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Detailed Entries */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {(assessment.auditTrail.reportGeneration?.entries || assessment.auditTrail.actions || []).map((entry: any, index: number) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                entry.type === 'error'
                                  ? 'border-red-200 bg-red-50'
                                  : entry.type === 'claude_query'
                                  ? 'border-blue-200 bg-blue-50'
                                  : entry.type === 'atlas_query'
                                  ? 'border-purple-200 bg-purple-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-sm">
                                    {index + 1}. {entry.action || entry.description || 'Action'}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {entry.type || 'action'} • {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                                    {(entry.duration || entry.durationMs) && ` • ${entry.duration || entry.durationMs}ms`}
                                  </p>
                                </div>
                                {entry.details?.response?.success !== undefined && (
                                  <Badge variant={entry.details.response.success ? 'default' : 'destructive'}>
                                    {entry.details.response.success ? 'Success' : 'Error'}
                                  </Badge>
                                )}
                                {entry.error && (
                                  <Badge variant="destructive">Error</Badge>
                                )}
                              </div>
                              {entry.details?.prompt && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt:</p>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                                    {entry.details.prompt.substring(0, 500)}
                                    {entry.details.prompt.length > 500 && '...'}
                                  </pre>
                                </div>
                              )}
                              {entry.details?.query && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Query:</p>
                                  <p className="text-xs bg-white p-2 rounded border">{entry.details.query}</p>
                                </div>
                              )}
                              {entry.details?.sources && entry.details.sources.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Sources:</p>
                                  <ul className="list-disc list-inside space-y-1 text-xs">
                                    {entry.details.sources.map((source: any, idx: number) => (
                                      <li key={idx}>
                                        <span className="font-medium">{source.type}:</span>{' '}
                                        {source.description || source.identifier || source.url || 'N/A'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No audit trail available. Report may not have been generated yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pain Points */}
        {assessment.section2?.painPoints && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Top Pain Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {assessment.section2.painPoints.map((pain: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{pain}</span>
                  </li>
                ))}
              </ul>
              {assessment.section2.magicWand && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Biggest Challenge:</p>
                  <p className="italic">"{assessment.section2.magicWand}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ROI Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ROI Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Time Cost/Year</p>
                  <p className="text-lg font-semibold">${roi.timeCostPerYear.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Savings</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${roi.timeSavings.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin Loss</p>
                  <p className="text-lg font-semibold">${roi.profitMarginLoss.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Improvement</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${roi.profitImprovement.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        <div className="space-y-6 mb-8">
          {/* Internal Admin Report - Consolidated */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Report</CardTitle>
              <CardDescription>
                Comprehensive research, sales intelligence, and recommendations for your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminReport ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Report generated automatically on submission</span>
                  </div>
                  <Link href={`/admin/reports/${submissionId}`}>
                    <Button className="w-full" size="lg">
                      View Internal Report
                    </Button>
                  </Link>
                  {adminDerivation && (
                    <Link href={`#admin-derivation`}>
                      <Button variant="outline" className="w-full">
                        View How Report Was Derived
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">Report not yet generated</p>
                  <p className="text-xs text-muted-foreground">Reports are generated automatically on submission</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Report - Separate */}
          <Card>
            <CardHeader>
              <CardTitle>Customer-Facing Report</CardTitle>
              <CardDescription>
                This is what the customer sees after completing the assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customerReport ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Report generated automatically on submission</span>
                  </div>
                  {assessment.customerReportGeneratedAt && (
                    <p className="text-xs text-muted-foreground">
                      Generated: {new Date(assessment.customerReportGeneratedAt).toLocaleString()}
                    </p>
                  )}
                  <Link href={`/assessment/report/${submissionId}`} target="_blank">
                    <Button className="w-full" variant="outline">
                      View Customer Report
                    </Button>
                  </Link>
                  {customerDerivation && (
                    <Link href={`#customer-derivation`}>
                      <Button variant="outline" className="w-full">
                        View How Report Was Derived
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">Report not yet generated</p>
                  <Link href={`/assessment/report/${submissionId}`} target="_blank">
                    <Button variant="outline" size="sm">
                      Generate Now
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Derivation Transparency */}
        {(customerDerivation || adminDerivation) && (
          <Card id="report-derivation" className="mb-8">
            <CardHeader>
              <CardTitle>Report Derivation & Transparency</CardTitle>
              <CardDescription>
                Exactly how each report was generated - complete transparency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {customerDerivation && (
                <div id="customer-derivation" className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Report Derivation</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Generation Steps</h4>
                      <div className="space-y-2">
                        {customerDerivation.steps.map((step: any) => (
                          <div key={step.step} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={step.success ? 'default' : 'destructive'}>
                                  Step {step.step}
                                </Badge>
                                <span className="font-medium">{step.name}</span>
                              </div>
                              {step.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Inputs:</span> {step.inputs.join(', ')}
                              </div>
                              <div>
                                <span className="font-medium">Outputs:</span> {step.outputs.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">ROI Calculation</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Formula:</p>
                        <code className="text-xs">{customerDerivation.calculations.roi?.formula}</code>
                        <div className="mt-3 space-y-1 text-xs">
                          {Object.entries(customerDerivation.calculations.roi?.inputs || {}).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm font-medium">
                          Result: <span className="text-green-600">{customerDerivation.calculations.roi?.result.toFixed(1)}% ROI</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Opportunity Score Calculation</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Formula:</p>
                        <code className="text-xs">{customerDerivation.calculations.score?.formula}</code>
                        <div className="mt-3 space-y-1 text-xs">
                          {Object.entries(customerDerivation.calculations.score?.breakdown || {}).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {value} points
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm font-medium">
                          Total Score: <span className="text-blue-600">{customerDerivation.calculations.score?.total}/100</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">How ROI Was Calculated</h4>
                      <pre className="text-xs bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{customerDerivation.transparency.howROIWasCalculated.trim()}</pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">How Score Was Calculated</h4>
                      <pre className="text-xs bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{customerDerivation.transparency.howScoreWasCalculated.trim()}</pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Data Sources Used</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {customerDerivation.transparency.dataSourcesUsed.map((source: string, idx: number) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Assumptions Made</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {customerDerivation.transparency.assumptionsMade.map((assumption: string, idx: number) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {adminDerivation && (
                <div id="admin-derivation" className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Admin/Sales Report Derivation</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Research Steps</h4>
                      <div className="space-y-2">
                        {adminDerivation.steps.map((step: any) => (
                          <div key={step.step} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={step.success ? 'default' : 'destructive'}>
                                  Step {step.step}
                                </Badge>
                                <span className="font-medium">{step.name}</span>
                              </div>
                              {step.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Inputs:</span> {step.inputs.join(', ')}
                              </div>
                              <div>
                                <span className="font-medium">Outputs:</span> {step.outputs.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">How Recommendations Were Generated</h4>
                      <pre className="text-xs bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{adminDerivation.transparency.howRecommendationsWereGenerated.trim()}</pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Data Sources Used</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {adminDerivation.transparency.dataSourcesUsed.map((source: string, idx: number) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Assumptions Made</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {adminDerivation.transparency.assumptionsMade.map((assumption: string, idx: number) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
                    </div>
                    {adminDerivation.aiQueries && adminDerivation.aiQueries.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">AI Queries Executed</h4>
                        <div className="space-y-2">
                          {adminDerivation.aiQueries.map((query: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{query.type.toUpperCase()}</Badge>
                                <span className="font-medium">{query.purpose}</span>
                                {query.tokens && <span className="text-muted-foreground">({query.tokens} tokens)</span>}
                              </div>
                              <code className="text-xs bg-gray-50 p-2 rounded block mt-1">{query.query.substring(0, 200)}...</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

