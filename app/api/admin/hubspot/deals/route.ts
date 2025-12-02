import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import { HubSpotSyncService } from '@/lib/hubspot/syncService';

// Field projection for list queries - only fetch what's needed
const LIST_PROJECTION = {
  hubspotId: 1,
  dealname: 1,
  amount: 1,
  dealstage: 1,
  pipeline: 1,
  closedate: 1,
  dealtype: 1,
  ownerId: 1,
  isClosed: 1,
  isWon: 1,
  isLost: 1,
  companyIds: 1,
  contactIds: 1,
  lastSyncedAt: 1,
  createdAt: 1,
  updatedAt: 1,
};

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fetchAll = searchParams.get('fetchAll') === 'true';
    // Default limit to 50 for better performance, max 500
    const limit = fetchAll ? 500 : Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const page = parseInt(searchParams.get('page') || '1');
    const pipeline = searchParams.get('pipeline');
    const dealstage = searchParams.get('dealstage');
    const search = searchParams.get('search');
    const useSync = searchParams.get('useSync') !== 'false';

    // Try to use synced data from MongoDB if useSync is true
    if (useSync) {
      try {
        await connectDB();
        
        const query: any = {};
        
        if (pipeline) {
          query.pipeline = pipeline;
        }
        if (dealstage) {
          query.dealstage = dealstage;
        }
        if (search) {
          query.$or = [
            { dealname: { $regex: search, $options: 'i' } },
            { dealtype: { $regex: search, $options: 'i' } },
          ];
        }

        // Get total count for pagination (with timeout)
        const totalCount = await Deal.countDocuments(query).maxTimeMS(5000);

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Use field projection and lean() for faster queries
        const deals = await Deal.find(query)
          .select(LIST_PROJECTION)
          .skip(skip)
          .limit(limit)
          .sort({ lastSyncedAt: -1 })
          .lean()
          .maxTimeMS(10000);

        const formattedDeals = deals.map((deal: any) => ({
          id: deal.hubspotId || deal._id?.toString(),
          dealname: deal.dealname || 'Unnamed Deal',
          amount: deal.amount || '0',
          dealstage: deal.dealstage || '',
          pipeline: deal.pipeline || 'default',
          closedate: deal.closedate || null,
          dealtype: deal.dealtype || '',
          ownerId: deal.ownerId || '',
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          isClosed: deal.isClosed || false,
          isWon: deal.isWon || false,
          isLost: deal.isLost || false,
          companyIds: deal.companyIds || [],
          contactIds: deal.contactIds || [],
          lastSyncedAt: deal.lastSyncedAt,
        }));

        // Only return MongoDB results if we have deals, otherwise fall through to HubSpot API
        if (formattedDeals.length > 0 || totalCount > 0) {
          // Trigger incremental sync in background (non-blocking) - only if not searching
          if (!search && !pipeline && !dealstage) {
            try {
              const syncService = new HubSpotSyncService();
              syncService.triggerIncrementalSync(24);
            } catch (syncError) {
              console.warn('Failed to trigger background sync:', syncError);
            }
          }

          return NextResponse.json({
            deals: formattedDeals,
            source: 'mongodb',
            synced: true,
            total: totalCount,
            pagination: {
              page,
              limit,
              total: totalCount,
              pages: Math.ceil(totalCount / limit),
              hasMore: page * limit < totalCount,
            },
          });
        }
        
        // Check if we need to trigger a full sync
        const syncService = new HubSpotSyncService();
        const needsSync = await syncService.needsFullSync('deals');
        if (needsSync) {
          syncService.syncDeals().catch(err => console.error('Background sync failed:', err));
        }
        
        console.log('MongoDB returned empty results, falling back to HubSpot API');
      } catch (dbError: any) {
        console.warn('Failed to fetch from MongoDB, falling back to HubSpot API:', dbError.message);
      }
    }

    // Fallback to HubSpot API with full pagination
    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      console.error('HubSpot API key not found in environment variables');
      return NextResponse.json(
        { 
          error: 'HubSpot API key not configured',
          message: 'Please set HUBSPOT_API_KEY in your .env.local file',
        },
        { status: 500 }
      );
    }

    const properties = [
      'dealname',
      'amount',
      'dealstage',
      'pipeline',
      'closedate',
      'dealtype',
      'hubspot_owner_id',
      'createdate',
      'hs_lastmodifieddate',
    ];

    const allDeals: any[] = [];
    const pageSize = 100;
    let after: string | undefined;
    const maxRecordsToFetch = fetchAll ? Infinity : (limit || 100);
    const hasFilters = !!(pipeline || dealstage);

    do {
      let url: string;
      let requestBody: any = null;

      if (search || hasFilters) {
        url = 'https://api.hubapi.com/crm/v3/objects/deals/search';
        requestBody = {
          limit: pageSize,
          properties: properties,
          ...(after && { after }),
        };
        
        if (search) {
          requestBody.query = search;
        }
        
        if (hasFilters) {
          const filters: any[] = [];
          if (pipeline) {
            filters.push({
              propertyName: 'pipeline',
              operator: 'EQ',
              value: pipeline,
            });
          }
          if (dealstage) {
            filters.push({
              propertyName: 'dealstage',
              operator: 'EQ',
              value: dealstage,
            });
          }
          requestBody.filterGroups = [{ filters }];
        }
      } else {
        url = 'https://api.hubapi.com/crm/v3/objects/deals';
        const urlObj = new URL(url);
        urlObj.searchParams.append('limit', pageSize.toString());
        urlObj.searchParams.append('properties', properties.join(','));
        if (after) {
          urlObj.searchParams.append('after', after);
        }
        url = urlObj.toString();
      }

      const fetchOptions: RequestInit = {
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      };

      if (requestBody) {
        fetchOptions.method = 'POST';
        fetchOptions.body = JSON.stringify(requestBody);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorText: string;
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData, null, 2);
        } catch {
          errorText = await response.text();
        }
        console.error('HubSpot Deals API Error:', response.status, errorText);
        return NextResponse.json(
          { 
            error: `HubSpot API error: ${response.status}`,
            details: errorText,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      const deals = data.results?.map((deal: any) => {
        const stage = deal.properties.dealstage || '';
        const isWon = stage === 'closedwon';
        const isLost = stage === 'closedlost';
        const isClosed = isWon || isLost;
        
        return {
          id: deal.id,
          dealname: deal.properties.dealname || 'Unnamed Deal',
          amount: deal.properties.amount || '0',
          dealstage: stage,
          pipeline: deal.properties.pipeline || 'default',
          closedate: deal.properties.closedate || null,
          dealtype: deal.properties.dealtype || '',
          ownerId: deal.properties.hubspot_owner_id || '',
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          isClosed,
          isWon,
          isLost,
        };
      }) || [];

      allDeals.push(...deals);
      after = data.paging?.next?.after;
      
      // Stop if we've reached the limit (when not fetching all)
      if (!fetchAll && allDeals.length >= maxRecordsToFetch) {
        break;
      }
    } while (after);

    // Apply limit if not fetching all
    const finalDeals = fetchAll ? allDeals : allDeals.slice(0, limit || 100);

    return NextResponse.json({
      deals: finalDeals,
      source: 'hubspot',
      synced: false,
      total: allDeals.length,
      fetchedAll: fetchAll,
      pagination: fetchAll ? undefined : {
        page: 1,
        limit: limit || 100,
        total: allDeals.length,
        pages: Math.ceil(allDeals.length / (limit || 100)),
        hasMore: !!after,
      },
    });
  } catch (error: any) {
    console.error('Error fetching HubSpot deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dealId, dealstage, pipeline } = body;

    if (!dealId || !dealstage) {
      return NextResponse.json(
        { error: 'dealId and dealstage are required' },
        { status: 400 }
      );
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

    const updateUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
    const updateBody: any = {
      properties: {
        dealstage,
      },
    };

    if (pipeline) {
      updateBody.properties.pipeline = pipeline;
    }

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot Update Deal API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const updatedDeal = await response.json();

    // Update local MongoDB record
    try {
      await connectDB();
      await Deal.updateOne(
        { hubspotId: dealId },
        { 
          $set: { 
            dealstage,
            ...(pipeline && { pipeline }),
            lastSyncedAt: new Date(),
          }
        }
      );
    } catch (dbError) {
      console.warn('Failed to update local deal record:', dbError);
    }

    return NextResponse.json({
      success: true,
      deal: {
        id: updatedDeal.id,
        dealstage: updatedDeal.properties?.dealstage,
        pipeline: updatedDeal.properties?.pipeline,
      },
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal', details: error.message },
      { status: 500 }
    );
  }
}
