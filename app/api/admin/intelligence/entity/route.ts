import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import Deal from '@/models/Deal';
import Company from '@/models/Company';
import Contact from '@/models/Contact';
import { calculateDealScore, formatDealAmount, getStageLabel } from '@/lib/scoring/dealScorer';

/**
 * GET /api/admin/intelligence/entity - Get all intelligence jobs for an entity
 * Query params:
 * - entityType: 'contact' | 'company' | 'deal' (required)
 * - entityId: HubSpot ID (required)
 * - limit: max results (default: 50)
 * 
 * Returns the full timeline of all analyses for this entity, including
 * change detection between runs.
 */
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType') as 'contact' | 'company' | 'deal';
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    if (!['contact', 'company', 'deal'].includes(entityType)) {
      return NextResponse.json(
        { error: 'entityType must be contact, company, or deal' },
        { status: 400 }
      );
    }

    // Fetch all completed jobs for this entity, sorted by completion date
    const jobs = await IntelligenceJob.find({
      entityType,
      entityId,
      status: { $in: ['complete', 'error'] },
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean();

    // Fetch entity details
    let entityDetails: any = null;
    
    if (entityType === 'deal') {
      const deal = await Deal.findOne({ hubspotId: entityId }).lean();
      if (deal) {
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
        
        entityDetails = {
          id: deal.hubspotId,
          name: deal.dealname,
          type: 'deal',
          dealstage: deal.dealstage,
          stageLabel: getStageLabel(deal.dealstage || ''),
          amount: deal.amount,
          amountFormatted: formatDealAmount(deal.amount),
          pipeline: deal.pipeline,
          closedate: deal.closedate,
          isClosed: deal.isClosed,
          isWon: deal.isWon,
          isLost: deal.isLost,
          currentScore: dealScore,
        };
      }
    } else if (entityType === 'company') {
      const company = await Company.findOne({ hubspotId: entityId }).lean();
      if (company) {
        entityDetails = {
          id: company.hubspotId,
          name: company.name,
          type: 'company',
          domain: company.domain,
          industry: company.industry,
          city: company.city,
          state: company.state,
        };
      }
    } else if (entityType === 'contact') {
      const contact = await Contact.findOne({ hubspotId: entityId }).lean();
      if (contact) {
        entityDetails = {
          id: contact.hubspotId,
          name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || contact.email,
          type: 'contact',
          email: contact.email,
          company: contact.company,
          jobtitle: contact.jobtitle,
        };
      }
    }

    // Build timeline entries
    const timeline = jobs.map((job, index) => {
      // Get the next job (previous in time) for comparison
      const previousJob = jobs[index + 1];
      
      return {
        id: job._id.toString(),
        analysisId: job.analysisId,
        version: job.version || 1,
        status: job.status,
        completedAt: job.completedAt,
        startedAt: job.startedAt,
        duration: job.stats?.duration,
        toolCalls: job.stats?.toolCalls,
        iterations: job.stats?.iterations,
        userId: job.userId,
        error: job.error,
        // Results summary
        result: job.result ? {
          hasIntelligence: !!job.result.intelligence,
          insightsCount: job.result.insights?.length || job.result.intelligence?.insights?.length || 0,
          risksCount: job.result.riskFactors?.length || job.result.intelligence?.riskFactors?.length || 0,
          opportunitiesCount: job.result.opportunitySignals?.length || job.result.intelligence?.opportunitySignals?.length || 0,
          actionsCount: job.result.recommendedActions?.length || job.result.intelligence?.recommendedActions?.length || 0,
          score: job.result.dealScore || job.result.healthScore || job.result.engagementScore ||
                 job.result.intelligence?.dealScore || job.result.intelligence?.healthScore,
          // Full result for detailed view
          full: job.result,
        } : null,
        // Change detection
        changeDetection: job.changeDetection,
        // Previous job reference
        previousJobId: previousJob ? previousJob._id.toString() : null,
      };
    });

    // Calculate aggregate stats
    const stats = {
      totalAnalyses: jobs.length,
      completedAnalyses: jobs.filter(j => j.status === 'complete').length,
      erroredAnalyses: jobs.filter(j => j.status === 'error').length,
      firstAnalysis: jobs.length > 0 ? jobs[jobs.length - 1].completedAt : null,
      latestAnalysis: jobs.length > 0 ? jobs[0].completedAt : null,
      averageDuration: jobs.length > 0
        ? Math.round(
            jobs
              .filter(j => j.stats?.duration)
              .reduce((sum, j) => sum + (j.stats?.duration || 0), 0) /
            jobs.filter(j => j.stats?.duration).length
          )
        : null,
    };

    // Calculate trend data (score over time)
    const scoreTrend = jobs
      .filter(j => j.status === 'complete')
      .map(j => ({
        date: j.completedAt,
        score: j.result?.dealScore || j.result?.healthScore || j.result?.engagementScore ||
               j.result?.intelligence?.dealScore || j.result?.intelligence?.healthScore ||
               j.result?.dealScoreData?.totalScore,
        version: j.version || 1,
      }))
      .filter(t => t.score !== undefined)
      .reverse(); // Oldest first for charting

    return NextResponse.json({
      entity: entityDetails,
      timeline,
      stats,
      scoreTrend,
      hasHistory: jobs.length > 1,
    });
  } catch (error: any) {
    console.error('Error fetching entity intelligence history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entity intelligence history' },
      { status: 500 }
    );
  }
}


