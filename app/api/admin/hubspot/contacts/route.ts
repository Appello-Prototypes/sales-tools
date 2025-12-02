import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { HubSpotSyncService } from '@/lib/hubspot/syncService';

// Field projection for list queries - only fetch what's needed
const LIST_PROJECTION = {
  hubspotId: 1,
  firstName: 1,
  lastName: 1,
  email: 1,
  jobTitle: 1,
  phone: 1,
  company: 1,
  companyId: 1,
  fullName: 1,
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
    const companyId = searchParams.get('companyId') || '';
    const dealId = searchParams.get('dealId') || '';
    const useSync = searchParams.get('useSync') !== 'false'; // Default to true
    const fetchAll = searchParams.get('fetchAll') === 'true'; // Option to fetch all records
    // Default limit to 50 for better performance, max 500
    const limit = fetchAll ? 500 : Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const page = parseInt(searchParams.get('page') || '1');

    // Try to use synced data from MongoDB if useSync is true
    if (useSync) {
      try {
        await connectDB();
        
        const query: any = {};
        
        // Apply search filter if provided
        if (search) {
          query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
          ];
        }

        // Filter by companyId if provided
        if (companyId) {
          query.companyId = companyId;
        }

        // Get total count for pagination (with timeout)
        const totalCount = await Contact.countDocuments(query).maxTimeMS(5000);
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Use field projection and lean() for faster queries
        const contacts = await Contact.find(query)
          .select(LIST_PROJECTION)
          .skip(skip)
          .limit(limit)
          .sort({ lastSyncedAt: -1 })
          .lean()
          .maxTimeMS(10000);

        const formattedContacts = contacts.map((contact: any) => ({
          id: contact.hubspotId,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email || '',
          jobTitle: contact.jobTitle || '',
          phone: contact.phone || '',
          company: contact.company || '',
          fullName: contact.fullName || '',
          lastSyncedAt: contact.lastSyncedAt,
        }));

        // If MongoDB has results, return them and trigger background sync
        if (formattedContacts.length > 0 || totalCount > 0) {
          // Trigger incremental sync in background (non-blocking) - only if not searching
          if (!search && !companyId) {
            try {
              const syncService = new HubSpotSyncService();
              syncService.triggerIncrementalSync(24);
            } catch (syncError) {
              console.warn('Failed to trigger background sync:', syncError);
            }
          }

          return NextResponse.json({ 
            contacts: formattedContacts,
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
        const needsSync = await syncService.needsFullSync('contacts');
        if (needsSync) {
          // Trigger full sync in background
          syncService.syncContacts().catch(err => console.error('Background sync failed:', err));
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
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    const allContacts: any[] = [];
    const properties = ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'];

    // If filtering by company or deal, use associations API
    if (companyId || dealId) {
      let contactIds: string[] = [];

      if (companyId) {
        const assocUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/contacts`;
        let after: string | undefined;
        
        // Paginate through all associations
        do {
          const url = new URL(assocUrl);
          if (after) url.searchParams.append('after', after);
          
          const assocResponse = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (assocResponse.ok) {
            const assocData = await assocResponse.json();
            const ids = assocData.results?.map((r: any) => r.id) || [];
            contactIds.push(...ids);
            after = assocData.paging?.next?.after;
          } else if (assocResponse.status !== 404) {
            const errorText = await assocResponse.text();
            console.error('HubSpot Company Associations API Error:', assocResponse.status, errorText);
            return NextResponse.json(
              { error: `HubSpot API error: ${assocResponse.status}`, details: errorText },
              { status: assocResponse.status }
            );
          } else {
            break;
          }
        } while (after);
      }

      if (dealId) {
        const assocUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts`;
        let after: string | undefined;
        const dealContactIds: string[] = [];
        
        do {
          const url = new URL(assocUrl);
          if (after) url.searchParams.append('after', after);
          
          const assocResponse = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (assocResponse.ok) {
            const assocData = await assocResponse.json();
            const ids = assocData.results?.map((r: any) => r.id) || [];
            dealContactIds.push(...ids);
            after = assocData.paging?.next?.after;
          } else if (assocResponse.status !== 404) {
            const errorText = await assocResponse.text();
            console.error('HubSpot Deal Associations API Error:', assocResponse.status, errorText);
            return NextResponse.json(
              { error: `HubSpot API error: ${assocResponse.status}`, details: errorText },
              { status: assocResponse.status }
            );
          } else {
            break;
          }
        } while (after);
        
        if (companyId) {
          contactIds = contactIds.filter(id => dealContactIds.includes(id));
        } else {
          contactIds = dealContactIds;
        }
      }

      if (contactIds.length === 0) {
        return NextResponse.json({ 
          contacts: [],
          source: 'hubspot',
          synced: false,
          total: 0,
        });
      }

      // Batch read contact details (HubSpot allows up to 100 per batch)
      const batchSize = 100;
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize);
        const batchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/batch/read';
        const batchResponse = await fetch(batchUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: batch.map((id: string) => ({ id })),
            properties: properties,
          }),
        });

        if (!batchResponse.ok) {
          const errorText = await batchResponse.text();
          console.error('HubSpot Batch Contacts API Error:', batchResponse.status, errorText);
          return NextResponse.json(
            { error: `HubSpot API error: ${batchResponse.status}`, details: errorText },
            { status: batchResponse.status }
          );
        }

        const batchData = await batchResponse.json();
        const contacts = batchData.results?.map((contact: any) => ({
          id: contact.id,
          firstName: contact.properties.firstname || '',
          lastName: contact.properties.lastname || '',
          email: contact.properties.email || '',
          jobTitle: contact.properties.jobtitle || '',
          phone: contact.properties.phone || '',
          company: contact.properties.company || '',
          fullName: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        })) || [];

        allContacts.push(...contacts);
      }

      let filteredContacts = allContacts;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredContacts = allContacts.filter(contact => 
          contact.fullName.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower) ||
          contact.company.toLowerCase().includes(searchLower)
        );
      }

      return NextResponse.json({ 
        contacts: filteredContacts,
        source: 'hubspot',
        synced: false,
        total: filteredContacts.length,
      });
    }

    // Regular pagination for all contacts - fetch ALL pages
    const pageSize = 100;
    let after: string | undefined;
    const maxRecordsToFetch = fetchAll ? Infinity : (limit || 100);

    do {
      let url: string;
      let requestBody: any = null;

      if (search) {
        url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
        requestBody = {
          query: search,
          limit: pageSize,
          properties: properties,
          ...(after && { after }),
        };
      } else {
        url = 'https://api.hubapi.com/crm/v3/objects/contacts';
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
        const errorText = await response.text();
        console.error('HubSpot Contacts API Error:', response.status, errorText);
        return NextResponse.json(
          { error: `HubSpot API error: ${response.status}`, details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      const contacts = data.results?.map((contact: any) => ({
        id: contact.id,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        email: contact.properties.email || '',
        jobTitle: contact.properties.jobtitle || '',
        phone: contact.properties.phone || '',
        company: contact.properties.company || '',
        fullName: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
      })) || [];

      allContacts.push(...contacts);
      after = data.paging?.next?.after;
      
      // Stop if we've reached the limit (when not fetching all)
      if (!fetchAll && allContacts.length >= maxRecordsToFetch) {
        break;
      }
    } while (after);

    // Apply limit if not fetching all
    const finalContacts = fetchAll ? allContacts : allContacts.slice(0, limit || 100);

    return NextResponse.json({ 
      contacts: finalContacts,
      source: 'hubspot',
      synced: false,
      total: allContacts.length,
      fetchedAll: fetchAll,
      pagination: fetchAll ? undefined : {
        page: 1,
        limit: limit || 100,
        total: allContacts.length,
        pages: Math.ceil(allContacts.length / (limit || 100)),
        hasMore: !!after,
      },
    });
  } catch (error: any) {
    console.error('Error fetching HubSpot contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
