'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Recommendation {
  dealId: string;
  dealName: string;
  priorityScore: number;
  reason: string;
  recommendedAction: string;
  expectedOutcome: string;
}

interface RecommendationsData {
  topPriorityDeals: Recommendation[];
  prioritizationStrategy: string;
  stageRecommendations: Record<string, string>;
  amountInsights: string;
  timingRecommendations: string[];
  riskDeals: string[];
  quickWins: string[];
}

export default function DealRecommendationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/hubspot/deals/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load recommendations');
      }
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      setError(error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 8) return 'High Priority';
    if (score >= 6) return 'Medium Priority';
    return 'Standard Priority';
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Deal Recommendations Report
            </h1>
            <p className="text-gray-600 text-xs mt-0.5">
              AI-powered deal prioritization and recommendations
            </p>
          </div>
        </div>
        <Button onClick={loadRecommendations} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            Analyzing deals with AI and ATLAS...
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold mb-2">Error Loading Recommendations</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
            <Button onClick={loadRecommendations} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </Card>
      ) : recommendations ? (
        <div className="space-y-3">
          {/* Prioritization Strategy */}
          {recommendations.prioritizationStrategy && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Prioritization Strategy
              </h2>
              <p className="text-sm text-gray-700">{recommendations.prioritizationStrategy}</p>
            </Card>
          )}

          {/* Top Priority Deals */}
          {recommendations.topPriorityDeals?.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                Top Priority Deals ({recommendations.topPriorityDeals.length})
              </h2>
              <div className="space-y-3">
                {recommendations.topPriorityDeals.map((deal, idx) => (
                  <div
                    key={deal.dealId}
                    className={`p-3 rounded-lg border ${getPriorityColor(deal.priorityScore)}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{deal.dealName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(deal.priorityScore)}`}>
                            {getPriorityBadge(deal.priorityScore)}
                          </span>
                          <span className="text-xs font-bold">Score: {deal.priorityScore}/10</span>
                        </div>
                        <p className="text-xs mb-2">{deal.reason}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/crm/deals?dealId=${deal.dealId}`)}
                        className="text-xs h-6"
                      >
                        View Deal
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">Recommended Action:</span>{' '}
                        <span>{deal.recommendedAction}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Expected Outcome:</span>{' '}
                        <span>{deal.expectedOutcome}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Wins */}
          {recommendations.quickWins?.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Quick Wins ({recommendations.quickWins.length})
              </h2>
              <ul className="space-y-1">
                {recommendations.quickWins.map((win, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Risk Deals */}
          {recommendations.riskDeals?.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Deals at Risk ({recommendations.riskDeals.length})
              </h2>
              <ul className="space-y-1">
                {recommendations.riskDeals.map((risk, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Timing Recommendations */}
          {recommendations.timingRecommendations?.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Timing Recommendations
              </h2>
              <ul className="space-y-1">
                {recommendations.timingRecommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Amount Insights */}
          {recommendations.amountInsights && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Amount-Based Insights
              </h2>
              <p className="text-sm text-gray-700">{recommendations.amountInsights}</p>
            </Card>
          )}

          {/* Stage Recommendations */}
          {recommendations.stageRecommendations && Object.keys(recommendations.stageRecommendations).length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                Stage-Based Recommendations
              </h2>
              <div className="space-y-2">
                {Object.entries(recommendations.stageRecommendations).map(([stage, rec]) => (
                  <div key={stage} className="p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="font-medium text-xs text-gray-900 mb-1">{stage}</div>
                    <p className="text-xs text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}


