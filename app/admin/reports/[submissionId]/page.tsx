'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Globe,
  Search,
  Database,
  Brain,
  FileText,
  Briefcase,
  Lightbulb,
  Shield,
} from 'lucide-react';

export default function AdminReportPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [submissionId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else if (response.status === 401) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching admin report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sales intelligence report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Admin report not found or not yet generated</p>
            <Link href="/admin/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { adminReport, assessment } = report;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Internal Report</h1>
          <p className="text-muted-foreground">
            Comprehensive research, sales intelligence, and recommendations • {adminReport.contactInfo.companyName || adminReport.contactInfo.name} • {submissionId}
          </p>
        </div>

        {/* Priority Badge */}
        <div className="mb-6">
          <Badge
            className={
              adminReport.salesIntelligence.priority === 'High'
                ? 'bg-red-500 text-white text-lg px-4 py-2'
                : adminReport.salesIntelligence.priority === 'Medium'
                ? 'bg-yellow-500 text-white text-lg px-4 py-2'
                : 'bg-gray-500 text-white text-lg px-4 py-2'
            }
          >
            {adminReport.salesIntelligence.priority} Priority Opportunity
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Opportunity Score</p>
                  <p className="text-2xl font-bold">{adminReport.opportunityScore.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Grade: {adminReport.opportunityScore.grade}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Savings</p>
                  <p className="text-2xl font-bold">${adminReport.roi.totalAnnualSavings.toLocaleString()}</p>
                  <p className="text-xs text-green-600">ROI: {adminReport.roi.roiPercentage.toFixed(0)}%</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Field Workers</p>
                  <p className="text-2xl font-bold">{adminReport.assessmentSummary.fieldWorkers}</p>
                  <p className="text-xs text-muted-foreground">{adminReport.assessmentSummary.trade}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="text-2xl font-bold">{adminReport.assessmentSummary.urgency}/10</p>
                  <p className="text-xs text-muted-foreground">Timeline: {adminReport.assessmentSummary.timeline}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Research */}
        {adminReport.companyResearch && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Intelligence
              </CardTitle>
              <CardDescription>Comprehensive research on this company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Info */}
              {adminReport.companyResearch.companyInfo && (
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {adminReport.companyResearch.companyInfo.description && (
                      <div>
                        <p className="text-muted-foreground">Description</p>
                        <p>{adminReport.companyResearch.companyInfo.description}</p>
                      </div>
                    )}
                    {adminReport.companyResearch.companyInfo.location && (
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p>{adminReport.companyResearch.companyInfo.location}</p>
                      </div>
                    )}
                    {adminReport.companyResearch.companyInfo.size && (
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p>{adminReport.companyResearch.companyInfo.size}</p>
                      </div>
                    )}
                    {adminReport.companyResearch.website && (
                      <div>
                        <p className="text-muted-foreground">Website</p>
                        <a href={adminReport.companyResearch.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {adminReport.companyResearch.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Website Analysis */}
              {adminReport.companyResearch.websiteAnalysis && (
                <div>
                  <h3 className="font-semibold mb-2">Website Analysis</h3>
                  {adminReport.companyResearch.websiteAnalysis.technologies?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-1">Technologies Detected:</p>
                      <div className="flex flex-wrap gap-2">
                        {adminReport.companyResearch.websiteAnalysis.technologies.map((tech: string, idx: number) => (
                          <Badge key={idx} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminReport.companyResearch.websiteAnalysis.valuePropositions?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Value Propositions:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {adminReport.companyResearch.websiteAnalysis.valuePropositions.map((vp: string, idx: number) => (
                          <li key={idx}>{vp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tools Research */}
              {adminReport.companyResearch.toolsResearch && (
                <div>
                  <h3 className="font-semibold mb-2">Tools & Software Stack</h3>
                  {adminReport.companyResearch.toolsResearch.mentioned?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-1">Mentioned Tools:</p>
                      <div className="flex flex-wrap gap-2">
                        {adminReport.companyResearch.toolsResearch.mentioned.map((tool: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminReport.companyResearch.toolsResearch.likelyUsing?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-1">Likely Also Using:</p>
                      <div className="flex flex-wrap gap-2">
                        {adminReport.companyResearch.toolsResearch.likelyUsing.map((tool: string, idx: number) => (
                          <Badge key={idx} variant="outline">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminReport.companyResearch.toolsResearch.analysis && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">{adminReport.companyResearch.toolsResearch.analysis}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Consolidated Sales Intelligence */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sales Intelligence & Recommendations
            </CardTitle>
            <CardDescription>Comprehensive sales strategy with source-attributed insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Next Steps */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Recommended Next Steps
              </h3>
              <ul className="space-y-2">
                {adminReport.salesIntelligence.nextSteps.map((step: any, idx: number) => (
                  <li key={idx} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                    <div className="font-medium">{step.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">{step.rationale}</div>
                    {step.source && (
                      <div className="text-xs text-blue-600 mt-1">Source: {step.source}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Talking Points */}
            {adminReport.salesIntelligence.talkingPoints?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Talking Points
                </h3>
                <ul className="space-y-2">
                  {adminReport.salesIntelligence.talkingPoints.map((point: any, idx: number) => (
                    <li key={idx} className="text-sm p-2 bg-green-50 rounded border-l-4 border-green-500">
                      <div>{typeof point === 'string' ? point : point.point}</div>
                      {typeof point === 'object' && point.source && (
                        <div className="text-xs text-green-600 mt-1">Source: {point.source}</div>
                      )}
                      {typeof point === 'object' && point.evidence && (
                        <div className="text-xs text-muted-foreground mt-1">Evidence: {point.evidence}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitive Advantages */}
            {adminReport.salesIntelligence.competitiveAdvantages?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Our Competitive Advantages
                </h3>
                <ul className="space-y-2">
                  {adminReport.salesIntelligence.competitiveAdvantages.map((adv: any, idx: number) => (
                    <li key={idx} className="text-sm p-2 bg-purple-50 rounded border-l-4 border-purple-500">
                      <div>{typeof adv === 'string' ? adv : adv.advantage}</div>
                      {typeof adv === 'object' && adv.evidence && (
                        <div className="text-xs text-muted-foreground mt-1">Evidence: {adv.evidence}</div>
                      )}
                      {typeof adv === 'object' && adv.source && (
                        <div className="text-xs text-purple-600 mt-1">Source: {adv.source}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buying Signals */}
            {adminReport.salesIntelligence.buyingSignals?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Buying Signals
                </h3>
                <ul className="space-y-2">
                  {adminReport.salesIntelligence.buyingSignals.map((signal: any, idx: number) => (
                    <li key={idx} className="text-sm p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                      <div className="font-medium">{typeof signal === 'string' ? signal : signal.signal}</div>
                      {typeof signal === 'object' && signal.evidence && (
                        <div className="text-xs text-muted-foreground mt-1">Evidence: {signal.evidence}</div>
                      )}
                      {typeof signal === 'object' && signal.source && (
                        <div className="text-xs text-yellow-600 mt-1">Source: {signal.source}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Objections */}
            {adminReport.salesIntelligence.objections?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Potential Objections & Responses
                </h3>
                <ul className="space-y-2">
                  {adminReport.salesIntelligence.objections.map((obj: any, idx: number) => (
                    <li key={idx} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-500">
                      <div className="font-medium">{typeof obj === 'string' ? obj : obj.objection}</div>
                      {typeof obj === 'object' && obj.response && (
                        <div className="text-xs text-muted-foreground mt-1">Response: {obj.response}</div>
                      )}
                      {typeof obj === 'object' && obj.source && (
                        <div className="text-xs text-red-600 mt-1">Source: {obj.source}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {adminReport.salesIntelligence.risks?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Risks & Mitigations
                </h3>
                <ul className="space-y-2">
                  {adminReport.salesIntelligence.risks.map((risk: any, idx: number) => (
                    <li key={idx} className="text-sm p-2 bg-orange-50 rounded border-l-4 border-orange-500">
                      <div className="font-medium">{typeof risk === 'string' ? risk : risk.risk}</div>
                      {typeof risk === 'object' && risk.mitigation && (
                        <div className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</div>
                      )}
                      {typeof risk === 'object' && risk.source && (
                        <div className="text-xs text-orange-600 mt-1">Source: {risk.source}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitive Intelligence */}
        {adminReport.competitiveIntelligence.competitors?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Competitive Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminReport.competitiveIntelligence.competitors.map((competitor: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{competitor.name}</h4>
                        {competitor.website && (
                          <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {competitor.website}
                          </a>
                        )}
                        {competitor.description && (
                          <p className="text-sm text-muted-foreground mt-1">{competitor.description}</p>
                        )}
                        {competitor.differentiation && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Differentiation: </span>
                            {competitor.differentiation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ATLAS Intelligence Summary */}
        {adminReport.atlasSummary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                ATLAS Intelligence Summary
              </CardTitle>
              <CardDescription>Detailed insights from similar customers and case studies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Similar Customers</p>
                  <p className="text-2xl font-bold">{adminReport.atlasSummary.similarCustomersCount}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Case Studies</p>
                  <p className="text-2xl font-bold">{adminReport.atlasSummary.caseStudiesCount}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Key Insights</p>
                  <p className="text-2xl font-bold">{adminReport.atlasSummary.keyInsights?.length || 0}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Success Patterns</p>
                  <p className="text-2xl font-bold">{adminReport.atlasSummary.successPatterns?.length || 0}</p>
                </div>
              </div>
              
              {adminReport.atlasSummary.keyInsights && adminReport.atlasSummary.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Detailed Insights from ATLAS Database</h4>
                  <ul className="space-y-2">
                    {adminReport.atlasSummary.keyInsights.map((insight: string, idx: number) => (
                      <li key={idx} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-gray-400">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {adminReport.atlasSummary.successPatterns && adminReport.atlasSummary.successPatterns.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Success Patterns</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {adminReport.atlasSummary.successPatterns.map((pattern: string, idx: number) => (
                      <li key={idx} className="text-sm">{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Industry Context */}
        {adminReport.industryContext && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Industry Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminReport.industryContext.trends?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Industry Trends</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {adminReport.industryContext.trends.map((trend: string, idx: number) => (
                      <li key={idx} className="text-sm">{trend}</li>
                    ))}
                  </ul>
                </div>
              )}
              {adminReport.industryContext.challenges?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Industry Challenges</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {adminReport.industryContext.challenges.map((challenge: string, idx: number) => (
                      <li key={idx} className="text-sm">{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}
              {adminReport.industryContext.opportunities?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Opportunities</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {adminReport.industryContext.opportunities.map((opp: string, idx: number) => (
                      <li key={idx} className="text-sm">{opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Summary */}
        {adminReport.companyResearch && (
          <Card className="mb-8 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Analysis Summary
              </CardTitle>
              <CardDescription>Comprehensive AI-powered research and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Website Research</p>
                  <p className="text-lg font-semibold">
                    {adminReport.companyResearch.website ? '✅ Found' : '❌ Not Found'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Competitors Found</p>
                  <p className="text-lg font-semibold">
                    {adminReport.companyResearch.competitors?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ATLAS Matches</p>
                  <p className="text-lg font-semibold">
                    {adminReport.companyResearch.atlasIntelligence?.similarCustomers?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tools Research</p>
                  <p className="text-lg font-semibold">
                    {adminReport.companyResearch.toolsResearch ? '✅ Complete' : '❌ Incomplete'}
                  </p>
                </div>
              </div>
              
              {/* Sales Intelligence Summary */}
              {adminReport.companyResearch.salesIntelligence && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-3">Sales Intelligence Generated</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminReport.companyResearch.salesIntelligence.talkingPoints?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Talking Points ({adminReport.companyResearch.salesIntelligence.talkingPoints.length})
                        </p>
                        <ul className="text-xs space-y-1">
                          {adminReport.companyResearch.salesIntelligence.talkingPoints.slice(0, 3).map((point: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">• {point.substring(0, 80)}...</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {adminReport.companyResearch.salesIntelligence.competitiveAdvantages?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Competitive Advantages ({adminReport.companyResearch.salesIntelligence.competitiveAdvantages.length})
                        </p>
                        <ul className="text-xs space-y-1">
                          {adminReport.companyResearch.salesIntelligence.competitiveAdvantages.slice(0, 3).map((adv: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">• {adv.substring(0, 80)}...</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assessment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Top Pain Points</p>
                <ul className="list-disc list-inside mt-1">
                  {adminReport.assessmentSummary.topPainPoints.slice(0, 5).map((pain: string, idx: number) => (
                    <li key={idx}>{pain}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground">Demo Focus Areas</p>
                <ul className="list-disc list-inside mt-1">
                  {adminReport.assessmentSummary.demoFocus.map((focus: string, idx: number) => (
                    <li key={idx}>{focus}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

