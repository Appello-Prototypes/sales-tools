'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, DollarSign, TrendingUp, Target, Zap } from 'lucide-react';

interface ReportData {
  report: {
    // Base report fields
    companyName?: string;
    trade: string;
    fieldWorkers: string;
    topPainPoints: string[];
    magicWand: string;
    urgency: number;
    totalCost: number;
    annualSavings: number;
    roiPercentage: number;
    paybackMonths: number;
    vision: {
      title: string;
      before: string[];
      after: string[];
      impact: string;
    };
    recommendedDemoFocus: string[];
    timeline: string;
    // AI-enhanced fields
    industryBenchmarks?: {
      fieldWorkersPercentile?: string;
      typicalROI?: string;
      averageSavings?: string;
      commonPainPoints?: string[];
    };
    peerComparison?: {
      similarCompaniesCount?: number;
      averageROI?: number;
      commonOutcomes?: string[];
      typicalTimeline?: string;
    };
    successStories?: Array<{
      companyProfile: string;
      challenge: string;
      solution: string;
      outcome: string;
    }>;
    personalizedInsights?: string[];
    nextSteps?: {
      immediateActions?: string[];
      demoFocus?: string[];
      timelineGuidance?: string;
    };
  };
  roi: any;
  score: any;
}

export default function ReportPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [submissionId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/assessments/${submissionId}/report`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating your personalized report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Report not found or assessment not completed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, roi, score } = reportData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#0046AD]">
            Your Personalized Assessment Report
          </h1>
          <p className="text-xl text-muted-foreground">
            {report.trade} • {report.fieldWorkers} field workers
          </p>
        </div>

        {/* Opportunity Score */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Opportunity Score</CardTitle>
            <CardDescription>Based on your responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{score.percentage}%</span>
                <span className="text-2xl font-semibold text-primary">Grade: {score.grade}</span>
              </div>
              <Progress value={score.percentage} className="h-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="font-semibold">{score.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-semibold">{score.breakdown.urgency}/20</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pain Severity</p>
                  <p className="font-semibold">{score.breakdown.painSeverity}/20</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Likelihood</p>
                  <p className="font-semibold">{score.breakdown.likelihood}/15</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Biggest Challenge */}
        {report.magicWand && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Biggest Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic text-muted-foreground">"{report.magicWand}"</p>
            </CardContent>
          </Card>
        )}

        {/* Cost of Current Pain */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-2xl text-red-900">The Cost of Your Current Pain</CardTitle>
            <CardDescription>What inefficiency is costing you right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Time Lost</span>
                </div>
                <p className="text-3xl font-bold text-red-900">
                  {(report as any).timeCost.hoursPerWeek} hrs/week
                </p>
                <p className="text-sm text-muted-foreground">
                  {(report as any).timeCost.hoursPerYear.toLocaleString()} hours annually
                </p>
                <p className="text-lg font-semibold text-red-900">
                  ${(report as any).timeCost.costPerYear.toLocaleString()}/year in lost productivity
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Money Lost</span>
                </div>
                <p className="text-3xl font-bold text-red-900">
                  ${((report as any).moneyCost.total / 1000).toFixed(0)}K/year
                </p>
                <div className="text-sm space-y-1">
                  {(report as any).moneyCost.profitMarginLoss > 0 && (
                    <p>• ${((report as any).moneyCost.profitMarginLoss / 1000).toFixed(0)}K from margin erosion</p>
                  )}
                  {(report as any).moneyCost.changeOrderLoss > 0 && (
                    <p>• ${((report as any).moneyCost.changeOrderLoss / 1000).toFixed(0)}K from missed change orders</p>
                  )}
                  {(report as any).moneyCost.complianceCosts > 0 && (
                    <p>• ${((report as any).moneyCost.complianceCosts / 1000).toFixed(0)}K in compliance costs</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Annual Cost:</span>
                <span className="text-3xl font-bold text-red-900">
                  ${(report.totalCost / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Appello Helps */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-2xl text-green-900 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              How Appello Solves Your Challenges
            </CardTitle>
            <CardDescription>Solutions tailored to your specific pain points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(report as any).appelloSolutions.map((solution: any, index: number) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-muted-foreground mb-1">
                        {solution.painPoint}
                      </p>
                      <p className="text-base">{solution.solution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${(solution.savings / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">saved/year</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ROI Summary */}
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Return on Investment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Appello Investment</p>
                <p className="text-2xl font-bold">${((report as any).appelloInvestment / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground mt-1">first year</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Annual Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(report.annualSavings / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">with Appello</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Net Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${((report as any).netValue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">per year</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ROI</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.round(report.roiPercentage)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.round(report.paybackMonths)} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Enhanced: Industry Benchmarks */}
        {(report as any).industryBenchmarks && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-500" />
                Industry Benchmarks
              </CardTitle>
              <CardDescription>How you compare to similar companies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {(report as any).industryBenchmarks.fieldWorkersPercentile && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Company Size</p>
                    <p className="font-semibold">{(report as any).industryBenchmarks.fieldWorkersPercentile}</p>
                  </div>
                )}
                {(report as any).industryBenchmarks.typicalROI && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Typical ROI</p>
                    <p className="font-semibold">{(report as any).industryBenchmarks.typicalROI}</p>
                  </div>
                )}
                {(report as any).industryBenchmarks.averageSavings && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Savings</p>
                    <p className="font-semibold">{(report as any).industryBenchmarks.averageSavings}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI-Enhanced: Peer Comparison */}
        {(report as any).peerComparison && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Peer Comparison</CardTitle>
              <CardDescription>
                Based on {(report as any).peerComparison.similarCompaniesCount || 0} similar companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(report as any).peerComparison.averageROI && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Average ROI for Similar Companies</span>
                    <span className="text-2xl font-bold text-primary">
                      {(report as any).peerComparison.averageROI}%
                    </span>
                  </div>
                )}
                {(report as any).peerComparison.commonOutcomes && (report as any).peerComparison.commonOutcomes.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Common Outcomes:</p>
                    <ul className="space-y-1">
                      {(report as any).peerComparison.commonOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI-Enhanced: Success Stories */}
        {(report as any).successStories && (report as any).successStories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Success Stories</CardTitle>
              <CardDescription>Companies similar to yours achieving results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(report as any).successStories.map((story, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p className="font-semibold text-primary mb-2">{story.companyProfile}</p>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Challenge:</span> {story.challenge}</p>
                      <p><span className="font-semibold">Solution:</span> {story.solution}</p>
                      <p className="text-green-600 font-semibold">
                        <span className="font-semibold">Outcome:</span> {story.outcome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI-Enhanced: Personalized Insights */}
        {report.personalizedInsights && report.personalizedInsights.length > 0 && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-500" />
                Personalized Insights
              </CardTitle>
              <CardDescription>Key insights based on your assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.personalizedInsights.map((insightItem: any, index: number) => {
                  // Handle both string and object formats
                  const insight = typeof insightItem === 'string' ? insightItem : insightItem.insight || insightItem;
                  return (
                    <li key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-500 mt-1">💡</span>
                      <span>{insight}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Vision - The Carrot */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl">What Life Could Be Like</CardTitle>
            <CardDescription>Your transformation with Appello</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">❌</span> Today
                </h3>
                <ul className="space-y-2">
                  {(report as any).vision.before.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  With Appello
                </h3>
                <ul className="space-y-2">
                  {(report as any).vision.after.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-lg font-semibold text-center">
                {(report as any).vision.impact}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className={(report as any).nextSteps ? "border-2 border-primary" : ""}>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              {(report as any).nextSteps ? "Personalized action plan based on your assessment" : "Your personalized demo will focus on:"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(report as any).nextSteps ? (
              <div className="space-y-6">
                {(report as any).nextSteps.immediateActions && (report as any).nextSteps.immediateActions.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3">Immediate Actions:</p>
                    <ul className="space-y-2">
                      {(report as any).nextSteps.immediateActions.map((action, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(report as any).nextSteps.timelineGuidance && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold mb-2">Timeline Guidance:</p>
                    <p>{(report as any).nextSteps.timelineGuidance}</p>
                  </div>
                )}
                {(report as any).recommendedDemoFocus && (report as any).recommendedDemoFocus.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Demo Focus Areas:</p>
                    <ul className="space-y-2">
                      {(report as any).recommendedDemoFocus.map((focus: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {(report as any).recommendedDemoFocus.map((focus: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>{focus}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

