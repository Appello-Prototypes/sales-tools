import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import IntelligenceJob from '@/models/IntelligenceJob';
import Deal from '@/models/Deal';
import Company from '@/models/Company';
import { calculateDealScore, formatDealAmount, getStageLabel } from '@/lib/scoring/dealScorer';

export interface MapDealData {
  jobId: string;
  entityName: string;
  entityId: string;
  entityType: 'contact' | 'company' | 'deal';
  status: string;
  startedAt: Date;
  completedAt?: Date;
  // Location
  lat: number;
  lng: number;
  companyName: string;
  companyId: string;
  address?: string;
  city?: string;
  state?: string;
  // Deal details
  amount?: string;
  amountFormatted?: string;
  dealstage?: string;
  stageLabel?: string;
  pipeline?: string;
  // Score
  dealScore?: {
    totalScore: number;
    percentage: number;
    grade: string;
    priority: string;
    healthIndicator: string;
  };
}

/**
 * GET /api/admin/intelligence/map - Get intelligence jobs with location data for map display
 * Returns only jobs that have associated company locations
 */
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    // Build query - default to completed deal jobs
    const query: any = {
      entityType: entityType || 'deal',
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch intelligence jobs
    const jobs = await IntelligenceJob.find(query)
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    if (jobs.length === 0) {
      return NextResponse.json({ deals: [], count: 0 });
    }

    // Get all deal IDs from jobs
    const dealIds = jobs
      .filter(j => j.entityType === 'deal')
      .map(j => j.entityId);

    // Fetch deals
    const deals = await Deal.find({ hubspotId: { $in: dealIds } }).lean();
    const dealsMap = new Map(deals.map(d => [d.hubspotId, d]));

    // Get all company IDs from deals
    const allCompanyIds = new Set<string>();
    deals.forEach(deal => {
      deal.companyIds?.forEach((id: string) => allCompanyIds.add(id));
    });

    // Fetch companies with location data
    const companies = await Company.find({
      hubspotId: { $in: Array.from(allCompanyIds) },
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
      geocodeError: { $ne: true },
    }).lean();
    const companiesMap = new Map(companies.map(c => [c.hubspotId, c]));

    // Build the map data
    const mapDeals: MapDealData[] = [];

    for (const job of jobs) {
      if (job.entityType !== 'deal') continue;

      const deal = dealsMap.get(job.entityId);
      if (!deal || !deal.companyIds?.length) continue;

      // Find the first company with valid location
      let company = null;
      for (const companyId of deal.companyIds) {
        const c = companiesMap.get(companyId);
        if (c && c.lat && c.lng) {
          company = c;
          break;
        }
      }

      if (!company) continue;

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

      mapDeals.push({
        jobId: job._id.toString(),
        entityName: job.entityName,
        entityId: job.entityId,
        entityType: job.entityType,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        // Location
        lat: company.lat!,
        lng: company.lng!,
        companyName: company.name,
        companyId: company.hubspotId,
        address: company.address,
        city: company.city,
        state: company.state,
        // Deal details
        amount: deal.amount,
        amountFormatted: formatDealAmount(deal.amount),
        dealstage: deal.dealstage,
        stageLabel: getStageLabel(deal.dealstage || ''),
        pipeline: deal.pipeline,
        // Score
        dealScore: dealScore ? {
          totalScore: dealScore.totalScore,
          percentage: dealScore.percentage,
          grade: dealScore.grade,
          priority: dealScore.priority,
          healthIndicator: dealScore.healthIndicator,
        } : undefined,
      });
    }

    return NextResponse.json({
      deals: mapDeals,
      count: mapDeals.length,
      totalJobs: jobs.length,
    });
  } catch (error: any) {
    console.error('Error fetching intelligence map data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}

