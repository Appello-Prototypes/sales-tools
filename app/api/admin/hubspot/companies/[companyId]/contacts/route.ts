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

    // Fetch contacts associated with the company
    const url = `https://api.hubapi.com/crm/v4/objects/contacts/search`;
    
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
        properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone'],
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
    
    const contacts = data.results?.map((contact: any) => ({
      id: contact.id,
      firstName: contact.properties.firstname || '',
      lastName: contact.properties.lastname || '',
      email: contact.properties.email || '',
      jobTitle: contact.properties.jobtitle || '',
      phone: contact.properties.phone || '',
      fullName: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
    })) || [];

    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}



