import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await params;
    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Get associated deal IDs
    const assocUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/deals`;
    
    const assocResponse = await fetch(assocUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!assocResponse.ok) {
      const errorText = await assocResponse.text();
      console.error('HubSpot Associations API Error:', assocResponse.status, errorText);
      // Return empty if no associations found
      if (assocResponse.status === 404) {
        return NextResponse.json({ deals: [] });
      }
      return NextResponse.json(
        { error: `HubSpot API error: ${assocResponse.status}`, details: errorText },
        { status: assocResponse.status }
      );
    }

    const assocData = await assocResponse.json();
    const dealIds = assocData.results?.map((r: any) => r.id) || [];

    if (dealIds.length === 0) {
      return NextResponse.json({ deals: [] });
    }

    // Step 2: Batch read deal details
    const batchUrl = `https://api.hubapi.com/crm/v3/objects/deals/batch/read`;
    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: dealIds.map((id: string) => ({ id })),
        properties: ['dealname', 'dealstage', 'amount', 'closedate', 'pipeline'],
      }),
    });

    if (!batchResponse.ok) {
      const errorText = await batchResponse.text();
      console.error('HubSpot Batch API Error:', batchResponse.status, errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${batchResponse.status}`, details: errorText },
        { status: batchResponse.status }
      );
    }

    const batchData = await batchResponse.json();
    
    const deals = batchData.results?.map((deal: any) => ({
      id: deal.id,
      name: deal.properties.dealname || 'Unnamed Deal',
      stage: deal.properties.dealstage || '',
      amount: deal.properties.amount || null,
      closeDate: deal.properties.closedate || null,
      pipeline: deal.properties.pipeline || '',
    })) || [];

    return NextResponse.json({ deals });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}



