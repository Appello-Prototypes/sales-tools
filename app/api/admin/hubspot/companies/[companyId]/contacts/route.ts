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

    // Step 1: Get associated contact IDs
    const assocUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/contacts`;
    
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
        return NextResponse.json({ contacts: [] });
      }
      return NextResponse.json(
        { error: `HubSpot API error: ${assocResponse.status}`, details: errorText },
        { status: assocResponse.status }
      );
    }

    const assocData = await assocResponse.json();
    const contactIds = assocData.results?.map((r: any) => r.id) || [];

    if (contactIds.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    // Step 2: Batch read contact details
    const batchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/batch/read`;
    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: contactIds.map((id: string) => ({ id })),
        properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone'],
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
    
    const contacts = batchData.results?.map((contact: any) => ({
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



