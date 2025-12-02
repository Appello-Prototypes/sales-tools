import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import { HubSpotSyncService } from '@/lib/hubspot/syncService';

// Field projection for list queries - only fetch what's needed
const LIST_PROJECTION = {
  hubspotId: 1,
  name: 1,
  domain: 1,
  website: 1,
  phone: 1,
  address: 1,
  city: 1,
  state: 1,
  zip: 1,
  industry: 1,
  employees: 1,
  lat: 1,
  lng: 1,
  geocodedAt: 1,
  geocodeError: 1,
  lastSyncedAt: 1,
};

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const fetchAll = searchParams.get('fetchAll') === 'true';
    // Default limit to 50 for better performance, max 500
    const limit = fetchAll ? 500 : Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const useSync = searchParams.get('useSync') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    // For fetching just industries list
    const industriesOnly = searchParams.get('industriesOnly') === 'true';

    // Try to use synced data from MongoDB if useSync is true
    if (useSync) {
      try {
        await connectDB();
        
        // Special endpoint to get unique industries efficiently
        if (industriesOnly) {
          const industries = await Company.distinct('industry', { 
            industry: { $ne: null, $ne: '' } 
          });
          return NextResponse.json({ 
            industries: industries.filter(Boolean).sort(),
            source: 'mongodb' 
          });
        }
        
        const query: any = {};
        
        // Apply search filter if provided
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { domain: { $regex: search, $options: 'i' } },
            { website: { $regex: search, $options: 'i' } },
            { industry: { $regex: search, $options: 'i' } },
          ];
        }
        
        // Apply industry filter if provided
        if (industry) {
          query.industry = industry;
        }

        // Get total count for pagination (with timeout)
        const countPromise = Company.countDocuments(query).maxTimeMS(5000);
        const totalCount = await countPromise;
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Use field projection and lean() for faster queries
        const companies = await Company.find(query)
          .select(LIST_PROJECTION)
          .skip(skip)
          .limit(limit)
          .sort({ lastSyncedAt: -1 })
          .lean()
          .maxTimeMS(10000);

        const formattedCompanies = companies.map((company: any) => ({
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
          lastSyncedAt: company.lastSyncedAt,
        }));

        // If MongoDB has results, return them and trigger background sync
        if (formattedCompanies.length > 0 || totalCount > 0) {
          // Trigger incremental sync in background (non-blocking) - only if not searching
          if (!search && !industry) {
            try {
              const syncService = new HubSpotSyncService();
              syncService.triggerIncrementalSync(24);
            } catch (syncError) {
              console.warn('Failed to trigger background sync:', syncError);
            }
          }

          return NextResponse.json({ 
            companies: formattedCompanies,
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
        const needsSync = await syncService.needsFullSync('companies');
        if (needsSync) {
          syncService.syncCompanies().catch(err => console.error('Background sync failed:', err));
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
        { error: 'HubSpot API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    // Fetch ALL companies using pagination
    const pageSize = 100;
    const allCompanies: any[] = [];
    let after: string | undefined;
    const maxRecordsToFetch = fetchAll ? Infinity : (limit || 100);

    do {
      let url: string;
      let requestBody: any = null;

      if (search) {
        url = 'https://api.hubapi.com/crm/v3/objects/companies/search';
        requestBody = {
          query: search,
          limit: pageSize,
          properties: ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'industry', 'numberofemployees', 'website'],
          ...(after && { after }),
        };
      } else {
        url = 'https://api.hubapi.com/crm/v3/objects/companies';
        const urlObj = new URL(url);
        urlObj.searchParams.append('limit', pageSize.toString());
        urlObj.searchParams.append('properties', 'name,domain,phone,address,city,state,zip,industry,numberofemployees,website');
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
        const errorText = await response.text();
        console.error('HubSpot API Error:', response.status, errorText);
        return NextResponse.json(
          { 
            error: `HubSpot API error: ${response.status}`,
            details: errorText,
            message: 'Please verify your HubSpot Private App Access Token has the correct scopes (crm.objects.companies.read)'
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      const companies = data.results?.map((company: any) => ({
        id: company.id,
        name: company.properties.name || 'Unnamed Company',
        domain: company.properties.domain || '',
        website: company.properties.website || company.properties.domain || '',
        phone: company.properties.phone || '',
        address: company.properties.address || '',
        city: company.properties.city || '',
        state: company.properties.state || '',
        zip: company.properties.zip || '',
        industry: company.properties.industry || '',
        employees: company.properties.numberofemployees || '',
      })) || [];

      allCompanies.push(...companies);
      after = data.paging?.next?.after;
      
      // Stop if we've reached the limit (when not fetching all)
      if (!fetchAll && allCompanies.length >= maxRecordsToFetch) {
        break;
      }
    } while (after);

    // Apply limit if not fetching all
    const finalCompanies = fetchAll ? allCompanies : allCompanies.slice(0, limit || 100);

    return NextResponse.json({ 
      companies: finalCompanies,
      source: 'hubspot',
      synced: false,
      total: allCompanies.length,
      fetchedAll: fetchAll,
      pagination: fetchAll ? undefined : {
        page: 1,
        limit: limit || 100,
        total: allCompanies.length,
        pages: Math.ceil(allCompanies.length / (limit || 100)),
        hasMore: !!after,
      },
    });
  } catch (error: any) {
    console.error('Error fetching HubSpot companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
