import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;
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

    // Fetch deal details
    const dealUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
    const dealResponse = await fetch(dealUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!dealResponse.ok) {
      const errorText = await dealResponse.text();
      console.error('HubSpot Deal API Error:', dealResponse.status, errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${dealResponse.status}`, details: errorText },
        { status: dealResponse.status }
      );
    }

    const dealData = await dealResponse.json();
    const deal = dealData.properties || {};

    // Fetch associated companies
    let companies: any[] = [];
    const companyAssocUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/companies`;
    const companyAssocResponse = await fetch(companyAssocUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (companyAssocResponse.ok) {
      const companyAssocData = await companyAssocResponse.json();
      const companyIds = companyAssocData.results?.map((r: any) => r.id) || [];
      
      if (companyIds.length > 0) {
        const companyBatchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: companyIds.map((id: string) => ({ id })),
            properties: ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'country', 'industry'],
          }),
        });
        
        if (companyBatchResponse.ok) {
          const companyBatchData = await companyBatchResponse.json();
          companies = companyBatchData.results || [];
        }
      }
    }

    // Fetch associated contacts
    let contacts: any[] = [];
    const contactAssocUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts`;
    const contactAssocResponse = await fetch(contactAssocUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (contactAssocResponse.ok) {
      const contactAssocData = await contactAssocResponse.json();
      const contactIds = contactAssocData.results?.map((r: any) => r.id) || [];
      
      if (contactIds.length > 0) {
        const contactBatchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: contactIds.map((id: string) => ({ id })),
            properties: ['firstname', 'lastname', 'email', 'phone', 'jobtitle'],
          }),
        });
        
        if (contactBatchResponse.ok) {
          const contactBatchData = await contactBatchResponse.json();
          contacts = contactBatchData.results || [];
        }
      }
    }

    return NextResponse.json({
      deal: {
        id: dealId,
        dealname: deal.dealname || 'Unnamed Deal',
        amount: deal.amount || null,
        dealstage: deal.dealstage || '',
        pipeline: deal.pipeline || '',
        closedate: deal.closedate || null,
        dealtype: deal.dealtype || '',
      },
      companies: companies.map((c: any) => ({
        id: c.id,
        name: c.properties.name || '',
        domain: c.properties.domain || '',
        phone: c.properties.phone || '',
        address: c.properties.address || '',
        city: c.properties.city || '',
        state: c.properties.state || '',
        zip: c.properties.zip || '',
        country: c.properties.country || '',
        industry: c.properties.industry || '',
      })),
      contacts: contacts.map((c: any) => ({
        id: c.id,
        firstname: c.properties.firstname || '',
        lastname: c.properties.lastname || '',
        email: c.properties.email || '',
        phone: c.properties.phone || '',
        jobtitle: c.properties.jobtitle || '',
        fullName: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

