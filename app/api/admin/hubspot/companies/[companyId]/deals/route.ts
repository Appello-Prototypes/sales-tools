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

    // Fetch deals associated with the company
    const url = `https://api.hubapi.com/crm/v4/objects/deals/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'associatedcompanyid',
                operator: 'EQ',
                value: companyId,
              },
            ],
          },
        ],
        properties: ['dealname', 'dealstage', 'amount', 'closedate', 'pipeline'],
        limit: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `HubSpot API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const deals = data.results?.map((deal: any) => ({
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



