import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { queryATLAS } from '@/lib/mcp/atlasClient';
import { analyzeWithClaude } from '@/lib/ai/claude';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    // Fetch all open deals
    const dealsUrl = 'https://api.hubapi.com/crm/v3/objects/deals';
    const dealsResponse = await fetch(
      `${dealsUrl}?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,dealtype,hs_is_closed,hs_is_won,hs_is_lost`,
      {
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!dealsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch deals' },
        { status: dealsResponse.status }
      );
    }

    const dealsData = await dealsResponse.json();
    const allDeals = dealsData.results || [];

    // Filter to open deals only
    const openDeals = allDeals
      .filter((deal: any) => {
        const props = deal.properties || {};
        return !props.hs_is_closed && !props.hs_is_won && !props.hs_is_lost;
      })
      .map((deal: any) => {
        const props = deal.properties || {};
        return {
          id: deal.id,
          dealname: props.dealname || 'Unnamed Deal',
          amount: parseFloat(props.amount || '0'),
          dealstage: props.dealstage || '',
          pipeline: props.pipeline || '',
          closedate: props.closedate || null,
          dealtype: props.dealtype || '',
        };
      });

    // Query ATLAS for deal patterns and recommendations
    const atlasQuery = `Find patterns in successful deals, deal stages that convert best, and recommendations for prioritizing deals based on amount, stage, and timing`;
    let atlasResults: any = { results: [] };
    
    try {
      atlasResults = await queryATLAS(atlasQuery);
    } catch (error) {
      console.error('ATLAS query failed:', error);
    }

    // Use Claude to analyze all deals and generate recommendations
    const prompt = `Analyze these ${openDeals.length} open deals and provide prioritized recommendations:

Open Deals:
${JSON.stringify(openDeals.slice(0, 50), null, 2)}

${atlasResults.results?.length > 0 ? `\nHistorical Deal Patterns from Database:\n${JSON.stringify(atlasResults.results.slice(0, 5), null, 2)}` : ''}

Generate a comprehensive recommendations report:

1. **Top Priority Deals** (5-10 deals): Deals that should be worked on immediately with reasons
2. **Deal Prioritization Strategy**: Overall approach for prioritizing deals
3. **Stage-Based Recommendations**: Recommendations for each deal stage
4. **Amount-Based Insights**: Patterns and recommendations based on deal value
5. **Timing Recommendations**: Deals that need immediate attention based on close dates
6. **Risk Assessment**: Deals that may be at risk and need attention
7. **Quick Wins**: Deals that are close to closing and need a push

For each priority deal, include:
- Deal ID and name
- Priority score (1-10)
- Reason for priority
- Recommended next action
- Expected outcome

Return as JSON:
{
  "topPriorityDeals": [
    {
      "dealId": "string",
      "dealName": "string",
      "priorityScore": number,
      "reason": "string",
      "recommendedAction": "string",
      "expectedOutcome": "string"
    }
  ],
  "prioritizationStrategy": "strategy text",
  "stageRecommendations": {
    "stage1": "recommendations",
    "stage2": "recommendations"
  },
  "amountInsights": "insights text",
  "timingRecommendations": ["recommendation 1", ...],
  "riskDeals": ["deal name - risk reason", ...],
  "quickWins": ["deal name - why it's a quick win", ...]
}`;

    try {
      const analysis = await analyzeWithClaude(
        prompt,
        'You are an expert sales strategist who provides actionable deal prioritization recommendations. Return ONLY valid JSON, no markdown code blocks or explanations.',
        { temperature: 0.8 }
      );

      // Parse Claude response
      let recommendations;
      try {
        const jsonMatch = analysis.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/s);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[1]);
        } else {
          recommendations = JSON.parse(analysis);
        }
      } catch (parseError) {
        // Fallback if parsing fails
        recommendations = {
          topPriorityDeals: [],
          prioritizationStrategy: 'Unable to generate strategy',
          stageRecommendations: {},
          amountInsights: 'Analysis unavailable',
          timingRecommendations: [],
          riskDeals: [],
          quickWins: [],
        };
      }

      return NextResponse.json({
        totalDeals: openDeals.length,
        recommendations,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate recommendations' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in recommendations endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


