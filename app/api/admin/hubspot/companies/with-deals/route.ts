import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import Deal from '@/models/Deal';

export interface CompanyWithDeals {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  employees?: string;
  lat?: number;
  lng?: number;
  geocodedAt?: string;
  geocodeError?: boolean;
  deals: {
    id: string;
    dealname: string;
    amount: string;
    dealstage: string;
    pipeline: string;
    closedate?: string;
    dealtype?: string;
    isClosed: boolean;
    isWon: boolean;
    isLost: boolean;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const industries = searchParams.getAll('industry');
    const pipelines = searchParams.getAll('pipeline');
    const dealStages = searchParams.getAll('dealstage');
    const hasDeals = searchParams.get('hasDeals');
    const dealAmountMin = searchParams.get('dealAmountMin');
    const dealAmountMax = searchParams.get('dealAmountMax');

    await connectDB();

    // Build company query
    const companyQuery: any = {};
    
    if (search) {
      companyQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (industries.length > 0) {
      companyQuery.industry = { $in: industries };
    }

    // Fetch companies
    const companies = await Company.find(companyQuery)
      .sort({ lastSyncedAt: -1 })
      .lean();

    // Get all company HubSpot IDs
    const companyHubspotIds = companies.map((c: any) => c.hubspotId);

    // Build deal query
    const dealQuery: any = {
      companyIds: { $in: companyHubspotIds }
    };
    
    if (pipelines.length > 0) {
      dealQuery.pipeline = { $in: pipelines };
    }
    
    if (dealStages.length > 0) {
      dealQuery.dealstage = { $in: dealStages };
    }
    
    if (dealAmountMin || dealAmountMax) {
      dealQuery.$and = dealQuery.$and || [];
      if (dealAmountMin) {
        dealQuery.$and.push({
          $expr: {
            $gte: [{ $toDouble: '$amount' }, parseFloat(dealAmountMin)]
          }
        });
      }
      if (dealAmountMax) {
        dealQuery.$and.push({
          $expr: {
            $lte: [{ $toDouble: '$amount' }, parseFloat(dealAmountMax)]
          }
        });
      }
    }

    // Fetch deals
    const deals = await Deal.find(dealQuery).lean();

    // Group deals by company ID
    const dealsByCompanyId: Record<string, any[]> = {};
    deals.forEach((deal: any) => {
      deal.companyIds?.forEach((companyId: string) => {
        if (!dealsByCompanyId[companyId]) {
          dealsByCompanyId[companyId] = [];
        }
        dealsByCompanyId[companyId].push({
          id: deal.hubspotId,
          dealname: deal.dealname,
          amount: deal.amount,
          dealstage: deal.dealstage,
          pipeline: deal.pipeline,
          closedate: deal.closedate,
          dealtype: deal.dealtype,
          isClosed: deal.isClosed,
          isWon: deal.isWon,
          isLost: deal.isLost,
        });
      });
    });

    // Format companies with their deals
    let companiesWithDeals: CompanyWithDeals[] = companies.map((company: any) => ({
      id: company.hubspotId,
      name: company.name || 'Unnamed Company',
      domain: company.domain || '',
      website: company.website || company.domain || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip: company.zip || '',
      industry: company.industry || '',
      employees: company.employees || '',
      lat: company.lat,
      lng: company.lng,
      geocodedAt: company.geocodedAt,
      geocodeError: company.geocodeError,
      deals: dealsByCompanyId[company.hubspotId] || [],
    }));

    // Filter by hasDeals
    if (hasDeals === 'true') {
      companiesWithDeals = companiesWithDeals.filter(c => c.deals.length > 0);
    } else if (hasDeals === 'false') {
      companiesWithDeals = companiesWithDeals.filter(c => c.deals.length === 0);
    }

    // Filter by pipeline/stage (only include companies that have matching deals)
    if (pipelines.length > 0 || dealStages.length > 0) {
      companiesWithDeals = companiesWithDeals.filter(c => {
        if (c.deals.length === 0) return false;
        return c.deals.some(deal => {
          const matchesPipeline = pipelines.length === 0 || pipelines.includes(deal.pipeline);
          const matchesStage = dealStages.length === 0 || dealStages.includes(deal.dealstage);
          return matchesPipeline && matchesStage;
        });
      });
    }

    return NextResponse.json({
      companies: companiesWithDeals,
      total: companiesWithDeals.length,
      dealsCount: deals.length,
    });
  } catch (error: any) {
    console.error('Error fetching companies with deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies with deals', details: error.message },
      { status: 500 }
    );
  }
}


