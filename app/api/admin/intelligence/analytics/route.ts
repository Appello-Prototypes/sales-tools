import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import Deal from '@/models/Deal';
import Company from '@/models/Company';
import { calculateDealScore, getStageLabel, formatDealAmount } from '@/lib/scoring/dealScorer';

interface PipelineStageMetrics {
  stage: string;
  stageLabel: string;
  pipeline: string;
  pipelineLabel: string;
  displayOrder: number;
  count: number;
  totalValue: number;
  avgScore: number;
  avgGrade: string;
  deals: {
    id: string;
    name: string;
    amount: number;
    score: number;
    grade: string;
    priority: string;
  }[];
}

interface PipelineInfo {
  id: string;
  label: string;
  stages: {
    id: string;
    label: string;
    displayOrder: number;
  }[];
}

interface PriorityDistribution {
  hot: number;
  warm: number;
  cool: number;
  cold: number;
  hotValue: number;
  warmValue: number;
  coolValue: number;
  coldValue: number;
}

interface AggregatedInsight {
  type: 'risk' | 'opportunity' | 'action' | 'insight';
  text: string;
  count: number;
  dealNames: string[];
  priority: 'high' | 'medium' | 'low';
}

interface PerformanceMetric {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * GET /api/admin/intelligence/analytics
 * Returns aggregated analytics across all intelligence jobs
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[ANALYTICS API] GET /api/admin/intelligence/analytics - Starting request');
  
  try {
    const user = verifyAuth(request);
    if (!user) {
      console.log('[ANALYTICS API] ❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[ANALYTICS API] ✅ Authenticated user:', user.userId);

    console.log('[ANALYTICS API] Connecting to database...');
    try {
      await connectDB();
      console.log('[ANALYTICS API] ✅ Database connected');
    } catch (dbError: any) {
      console.error('[ANALYTICS API] ❌ Database connection failed:', dbError.message);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: dbError.message,
          details: 'Unable to connect to MongoDB. Please check your database connection.',
        },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, all

    // Calculate date filter
    const getDateFilter = () => {
      const now = new Date();
      switch (timeRange) {
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
          return null;
      }
    };

    const dateFilter = getDateFilter();
    const dateQuery = dateFilter ? { completedAt: { $gte: dateFilter } } : {};

    // Fetch pipeline data from HubSpot for proper stage labels
    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;

    let pipelinesData: PipelineInfo[] = [];
    const stageLabelMap: Record<string, string> = {};
    const stageOrderMap: Record<string, number> = {};
    const pipelineLabelMap: Record<string, string> = {};
    const stagePipelineMap: Record<string, string> = {};

    // Fetch HubSpot pipelines with timeout to prevent blocking
    if (hubspotApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const pipelineResponse = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (pipelineResponse.ok) {
          const pipelineData = await pipelineResponse.json();
          pipelinesData = (pipelineData.results || []).map((p: any) => ({
            id: p.id,
            label: p.label || p.id,
            stages: (p.stages || []).map((s: any, idx: number) => ({
              id: s.id,
              label: s.label || s.id,
              displayOrder: s.displayOrder ?? idx,
            })).sort((a: any, b: any) => a.displayOrder - b.displayOrder),
          }));

          // Build lookup maps
          pipelinesData.forEach(pipeline => {
            pipelineLabelMap[pipeline.id] = pipeline.label;
            pipeline.stages.forEach((stage, idx) => {
              stageLabelMap[stage.id] = stage.label;
              stageOrderMap[stage.id] = idx;
              stagePipelineMap[stage.id] = pipeline.id;
            });
          });
        }
      } catch (e) {
        // Silently fail - continue without pipeline labels
        console.warn('HubSpot pipeline fetch timed out or failed, continuing without labels');
      }
    }

    // Fetch completed intelligence jobs - only select fields needed for analytics
    // Exclude large fields: history, logs
    const analyticsProjection = {
      _id: 1,
      entityType: 1,
      entityId: 1,
      entityName: 1,
      status: 1,
      startedAt: 1,
      completedAt: 1,
      stats: 1,
      // Only get result fields needed for analytics
      'result.insights': 1,
      'result.riskFactors': 1,
      'result.opportunitySignals': 1,
      'result.recommendedActions': 1,
      'result.dealScore': 1,
      'result.healthScore': 1,
      'result.engagementScore': 1,
    };
    
    const jobs = await Promise.race([
      IntelligenceJob.find({
        status: 'complete',
        ...dateQuery,
      })
        .select(analyticsProjection)
        .sort({ completedAt: -1 })
        .limit(100)
        .lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Jobs query timeout')), 10000)
      )
    ]) as any[];
    
    if (!jobs || jobs.length === 0) {
      // Return empty analytics if no jobs found
      return NextResponse.json({
        overview: {
          totalAnalyzed: 0,
          totalPipelineValue: 0,
          avgJobDuration: 0,
          totalInsights: 0,
        },
        priorityDistribution: [],
        pipelineData: [],
        insights: {
          risks: [],
          opportunities: [],
          actions: [],
        },
        activity: [],
      });
    }

    // Fetch all deals that have been analyzed
    const dealIds = jobs
      .filter(j => j.entityType === 'deal')
      .map(j => j.entityId);

    const companyIds = jobs
      .filter(j => j.entityType === 'company')
      .map(j => j.entityId);

    // Fetch deals and companies with timeout protection - only select needed fields
    let deals: any[] = [];
    let companies: any[] = [];
    
    const dealProjection = {
      hubspotId: 1,
      dealname: 1,
      amount: 1,
      dealstage: 1,
      pipeline: 1,
      closedate: 1,
      dealtype: 1,
      isClosed: 1,
      isWon: 1,
      isLost: 1,
      companyIds: 1,
      contactIds: 1,
      updatedAt: 1,
    };
    
    const companyProjection = {
      hubspotId: 1,
      name: 1,
      industry: 1,
      domain: 1,
      city: 1,
      state: 1,
    };
    
    if (dealIds.length > 0) {
      try {
        deals = await Promise.race([
          Deal.find({ hubspotId: { $in: dealIds } }).select(dealProjection).limit(100).lean(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Deal query timeout')), 8000)
          )
        ]) as any[];
      } catch (dealError: any) {
        console.warn('Deal query failed or timed out, continuing without deal data:', dealError.message);
        deals = [];
      }
    }
    
    if (companyIds.length > 0) {
      try {
        companies = await Promise.race([
          Company.find({ hubspotId: { $in: companyIds } }).select(companyProjection).limit(100).lean(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Company query timeout')), 8000)
          )
        ]) as any[];
      } catch (companyError: any) {
        console.warn('Company query failed or timed out, continuing without company data:', companyError.message);
        companies = [];
      }
    }

    // Build deal lookup
    const dealsById: Record<string, any> = {};
    deals.forEach(deal => {
      dealsById[deal.hubspotId] = deal;
    });

    // Build company lookup
    const companiesById: Record<string, any> = {};
    companies.forEach(company => {
      companiesById[company.hubspotId] = company;
    });

    // ============================================
    // STRATEGIC METRICS CALCULATION
    // ============================================

    // 1. Overview Stats
    const totalAnalyzedDeals = jobs.filter(j => j.entityType === 'deal').length;
    const totalAnalyzedCompanies = jobs.filter(j => j.entityType === 'company').length;
    const totalAnalyzedContacts = jobs.filter(j => j.entityType === 'contact').length;
    const avgJobDuration = jobs.reduce((sum, j) => sum + (j.stats?.duration || 0), 0) / jobs.length / 1000; // seconds

    // 2. Pipeline Value Analysis
    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    const dealScores: any[] = [];

    jobs
      .filter(j => j.entityType === 'deal' && dealsById[j.entityId])
      .forEach(job => {
        const deal = dealsById[job.entityId];
        const amount = parseFloat(deal.amount || '0');
        totalPipelineValue += amount;

        // Calculate deal score
        const dealScore = calculateDealScore({
          dealId: deal.hubspotId,
          dealname: deal.dealname,
          amount: deal.amount,
          dealstage: deal.dealstage,
          pipeline: deal.pipeline,
          closedate: deal.closedate,
          dealtype: deal.dealtype,
          isClosed: deal.isClosed,
          isWon: deal.isWon,
          isLost: deal.isLost,
          companyIds: deal.companyIds,
          contactIds: deal.contactIds,
          properties: deal.properties,
          updatedAt: deal.updatedAt,
        });

        // Use HubSpot stage label if available, otherwise fallback to scorer's label
        const stageId = deal.dealstage || '';
        const pipelineId = deal.pipeline || '';
        const realStageLabel = stageLabelMap[stageId] || getStageLabel(stageId);
        const realPipelineLabel = pipelineLabelMap[pipelineId] || pipelineId;

        dealScores.push({
          jobId: job._id.toString(),
          dealId: deal.hubspotId,
          dealName: deal.dealname || job.entityName,
          amount,
          amountFormatted: formatDealAmount(deal.amount),
          stage: stageId,
          stageLabel: realStageLabel,
          pipeline: pipelineId,
          pipelineLabel: realPipelineLabel,
          stageOrder: stageOrderMap[stageId] ?? 999,
          dealtype: deal.dealtype || '',
          score: dealScore.totalScore,
          grade: dealScore.grade,
          priority: dealScore.priority,
          health: dealScore.healthIndicator,
          percentage: dealScore.percentage,
          breakdown: dealScore.breakdown,
          recommendations: dealScore.recommendations,
          isClosed: deal.isClosed,
          isWon: deal.isWon,
          isLost: deal.isLost,
          result: job.result,
        });

        // Weighted pipeline value (based on probability/score)
        weightedPipelineValue += amount * (dealScore.percentage / 100);
      });

    // 3. Priority Distribution
    const priorityDistribution: PriorityDistribution = {
      hot: 0,
      warm: 0,
      cool: 0,
      cold: 0,
      hotValue: 0,
      warmValue: 0,
      coolValue: 0,
      coldValue: 0,
    };

    dealScores.forEach(ds => {
      const priority = ds.priority.toLowerCase() as 'hot' | 'warm' | 'cool' | 'cold';
      priorityDistribution[priority]++;
      priorityDistribution[`${priority}Value` as keyof PriorityDistribution] += ds.amount;
    });

    // 4. Grade Distribution
    const gradeDistribution: Record<string, { count: number; value: number }> = {};
    dealScores.forEach(ds => {
      if (!gradeDistribution[ds.grade]) {
        gradeDistribution[ds.grade] = { count: 0, value: 0 };
      }
      gradeDistribution[ds.grade].count++;
      gradeDistribution[ds.grade].value += ds.amount;
    });

    // 5. Pipeline Stage Analysis
    const stageMetrics: Record<string, PipelineStageMetrics> = {};
    dealScores.forEach(ds => {
      const stage = ds.stage || 'unknown';
      const pipelineId = ds.pipeline || 'unknown';
      const stageKey = `${pipelineId}:${stage}`;
      
      if (!stageMetrics[stageKey]) {
        stageMetrics[stageKey] = {
          stage,
          stageLabel: ds.stageLabel || stage,
          pipeline: pipelineId,
          pipelineLabel: ds.pipelineLabel || pipelineId,
          displayOrder: ds.stageOrder ?? 999,
          count: 0,
          totalValue: 0,
          avgScore: 0,
          avgGrade: '',
          deals: [],
        };
      }
      stageMetrics[stageKey].count++;
      stageMetrics[stageKey].totalValue += ds.amount;
      stageMetrics[stageKey].deals.push({
        id: ds.dealId,
        name: ds.dealName,
        amount: ds.amount,
        score: ds.score,
        grade: ds.grade,
        priority: ds.priority,
      });
    });

    // Calculate averages for each stage
    Object.values(stageMetrics).forEach(sm => {
      const totalScore = sm.deals.reduce((sum, d) => sum + d.score, 0);
      sm.avgScore = Math.round(totalScore / sm.deals.length);
      // Determine avg grade based on avg score
      if (sm.avgScore >= 90) sm.avgGrade = 'A+';
      else if (sm.avgScore >= 80) sm.avgGrade = 'A';
      else if (sm.avgScore >= 70) sm.avgGrade = 'B+';
      else if (sm.avgScore >= 60) sm.avgGrade = 'B';
      else if (sm.avgScore >= 50) sm.avgGrade = 'C+';
      else if (sm.avgScore >= 40) sm.avgGrade = 'C';
      else if (sm.avgScore >= 30) sm.avgGrade = 'D';
      else sm.avgGrade = 'F';
    });

    // 6. Aggregate Insights from all jobs
    const insightCounts: Record<string, { count: number; deals: string[]; type: string }> = {};
    const riskCounts: Record<string, { count: number; deals: string[] }> = {};
    const opportunityCounts: Record<string, { count: number; deals: string[] }> = {};
    const actionCounts: Record<string, { count: number; deals: string[] }> = {};

    dealScores.forEach(ds => {
      const result = ds.result;
      if (!result) return;

      const dealName = ds.dealName;

      // Aggregate insights
      (result.insights || []).forEach((insight: string) => {
        const normalized = normalizeInsight(insight);
        if (!insightCounts[normalized]) {
          insightCounts[normalized] = { count: 0, deals: [], type: 'insight' };
        }
        insightCounts[normalized].count++;
        if (!insightCounts[normalized].deals.includes(dealName)) {
          insightCounts[normalized].deals.push(dealName);
        }
      });

      // Aggregate risks
      (result.riskFactors || []).forEach((risk: string) => {
        const normalized = normalizeInsight(risk);
        if (!riskCounts[normalized]) {
          riskCounts[normalized] = { count: 0, deals: [] };
        }
        riskCounts[normalized].count++;
        if (!riskCounts[normalized].deals.includes(dealName)) {
          riskCounts[normalized].deals.push(dealName);
        }
      });

      // Aggregate opportunities
      (result.opportunitySignals || []).forEach((opp: string) => {
        const normalized = normalizeInsight(opp);
        if (!opportunityCounts[normalized]) {
          opportunityCounts[normalized] = { count: 0, deals: [] };
        }
        opportunityCounts[normalized].count++;
        if (!opportunityCounts[normalized].deals.includes(dealName)) {
          opportunityCounts[normalized].deals.push(dealName);
        }
      });

      // Aggregate recommended actions
      (result.recommendedActions || []).forEach((action: string) => {
        const normalized = normalizeInsight(action);
        if (!actionCounts[normalized]) {
          actionCounts[normalized] = { count: 0, deals: [] };
        }
        actionCounts[normalized].count++;
        if (!actionCounts[normalized].deals.includes(dealName)) {
          actionCounts[normalized].deals.push(dealName);
        }
      });

      // Also aggregate from recommendations in deal score
      (ds.recommendations || []).forEach((rec: string) => {
        const normalized = normalizeInsight(rec);
        if (!actionCounts[normalized]) {
          actionCounts[normalized] = { count: 0, deals: [] };
        }
        actionCounts[normalized].count++;
        if (!actionCounts[normalized].deals.includes(dealName)) {
          actionCounts[normalized].deals.push(dealName);
        }
      });
    });

    // Convert to sorted arrays
    const topInsights: AggregatedInsight[] = Object.entries(insightCounts)
      .map(([text, data]) => ({
        type: 'insight' as const,
        text,
        count: data.count,
        dealNames: data.deals,
        priority: data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topRisks: AggregatedInsight[] = Object.entries(riskCounts)
      .map(([text, data]) => ({
        type: 'risk' as const,
        text,
        count: data.count,
        dealNames: data.deals,
        priority: data.count >= 3 ? 'high' : data.count >= 2 ? 'medium' : 'low' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topOpportunities: AggregatedInsight[] = Object.entries(opportunityCounts)
      .map(([text, data]) => ({
        type: 'opportunity' as const,
        text,
        count: data.count,
        dealNames: data.deals,
        priority: data.count >= 3 ? 'high' : data.count >= 2 ? 'medium' : 'low' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topActions: AggregatedInsight[] = Object.entries(actionCounts)
      .map(([text, data]) => ({
        type: 'action' as const,
        text,
        count: data.count,
        dealNames: data.deals,
        priority: data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Top Deals (by value and score)
    const topDealsByValue = [...dealScores]
      .filter(d => !d.isClosed)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topDealsByScore = [...dealScores]
      .filter(d => !d.isClosed)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const atRiskDeals = dealScores
      .filter(d => !d.isClosed && d.health === 'At Risk' || d.health === 'Critical')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // 8. Health Distribution
    const healthDistribution: Record<string, { count: number; value: number }> = {
      Excellent: { count: 0, value: 0 },
      Good: { count: 0, value: 0 },
      Fair: { count: 0, value: 0 },
      'At Risk': { count: 0, value: 0 },
      Critical: { count: 0, value: 0 },
    };

    dealScores.forEach(ds => {
      if (!ds.isClosed && healthDistribution[ds.health]) {
        healthDistribution[ds.health].count++;
        healthDistribution[ds.health].value += ds.amount;
      }
    });

    // 9. Company Intelligence Aggregation
    const companyIntelligence = jobs
      .filter(j => j.entityType === 'company' && companiesById[j.entityId])
      .map(job => {
        const company = companiesById[job.entityId];
        return {
          jobId: job._id.toString(),
          companyId: company.hubspotId,
          companyName: company.name || job.entityName,
          industry: company.industry,
          domain: company.domain,
          city: company.city,
          state: company.state,
          result: job.result,
          completedAt: job.completedAt,
        };
      })
      .slice(0, 20);

    // 10. Performance Metrics
    const avgDealScore = dealScores.length > 0
      ? Math.round(dealScores.reduce((sum, d) => sum + d.score, 0) / dealScores.length)
      : 0;

    const openDeals = dealScores.filter(d => !d.isClosed);
    const avgOpenDealScore = openDeals.length > 0
      ? Math.round(openDeals.reduce((sum, d) => sum + d.score, 0) / openDeals.length)
      : 0;

    const hotDealsValue = dealScores
      .filter(d => !d.isClosed && d.priority === 'Hot')
      .reduce((sum, d) => sum + d.amount, 0);

    const performanceMetrics: PerformanceMetric[] = [
      {
        label: 'Average Deal Score',
        value: avgDealScore,
        trend: 'stable',
      },
      {
        label: 'Pipeline Coverage',
        value: Math.round((weightedPipelineValue / totalPipelineValue) * 100) || 0,
        trend: 'stable',
      },
      {
        label: 'Hot Deals %',
        value: Math.round((priorityDistribution.hot / openDeals.length) * 100) || 0,
        trend: 'up',
      },
      {
        label: 'At Risk Pipeline',
        value: Math.round(((healthDistribution['At Risk'].value + healthDistribution['Critical'].value) / totalPipelineValue) * 100) || 0,
        trend: 'down',
      },
    ];

    // 11. Activity Timeline (last 30 days)
    const activityTimeline: { date: string; count: number; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayJobs = jobs.filter(j => {
        const jobDate = new Date(j.completedAt || j.startedAt);
        return jobDate.toISOString().split('T')[0] === dateStr;
      });

      let dayValue = 0;
      dayJobs.forEach(j => {
        if (j.entityType === 'deal' && dealsById[j.entityId]) {
          dayValue += parseFloat(dealsById[j.entityId].amount || '0');
        }
      });

      activityTimeline.push({
        date: dateStr,
        count: dayJobs.length,
        value: dayValue,
      });
    }

    // Sort pipeline stages by displayOrder (pipeline progression order)
    const sortedStages = Object.values(stageMetrics).sort((a, b) => {
      // First sort by pipeline
      if (a.pipeline !== b.pipeline) {
        return a.pipeline.localeCompare(b.pipeline);
      }
      // Then by display order within the pipeline
      return a.displayOrder - b.displayOrder;
    });

    return NextResponse.json({
      overview: {
        totalAnalyzedDeals,
        totalAnalyzedCompanies,
        totalAnalyzedContacts,
        totalPipelineValue,
        weightedPipelineValue,
        avgDealScore,
        avgOpenDealScore,
        avgJobDuration: Math.round(avgJobDuration),
        hotDealsValue,
        openDealsCount: openDeals.length,
      },
      priorityDistribution,
      gradeDistribution,
      healthDistribution,
      pipelineStages: sortedStages,
      pipelines: pipelinesData, // Include full pipeline data for frontend
      topDealsByValue,
      topDealsByScore,
      atRiskDeals,
      aggregatedInsights: {
        insights: topInsights,
        risks: topRisks,
        opportunities: topOpportunities,
        actions: topActions,
      },
      companyIntelligence,
      performanceMetrics,
      activityTimeline,
      dealScores: dealScores.slice(0, 50), // Include top 50 for detail view
    });
  } catch (error: any) {
    console.error('Error fetching intelligence analytics:', error);
    
    // Return minimal empty response instead of error to prevent UI from breaking
    if (error.message?.includes('timeout')) {
      console.warn('Analytics query timed out, returning empty data');
      return NextResponse.json({
        overview: {
          totalAnalyzed: 0,
          totalPipelineValue: 0,
          avgJobDuration: 0,
          totalInsights: 0,
        },
        priorityDistribution: [],
        pipelineData: [],
        insights: {
          risks: [],
          opportunities: [],
          actions: [],
        },
        activity: [],
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch intelligence analytics' },
      { status: 500 }
    );
  }
}

// Helper function to normalize insights for grouping
function normalizeInsight(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

