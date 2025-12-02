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
    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!hubspotApiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key not configured' },
        { status: 500 }
      );
    }

    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Fetch company details
    const companyUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=name,domain,industry,city,state,website,phone,numberofemployees`;
    const companyResponse = await fetch(companyUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!companyResponse.ok) {
      throw new Error(`Failed to fetch company: ${companyResponse.status}`);
    }

    const companyData = await companyResponse.json();
    const company = companyData.properties;

    // Fetch contacts via associations
    let contacts: any[] = [];
    const contactAssocUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/contacts`;
    const contactAssocResponse = await fetch(contactAssocUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (contactAssocResponse.ok) {
      const contactAssocData = await contactAssocResponse.json();
      const contactIds = contactAssocData.results?.map((r: any) => r.id).slice(0, 10) || [];
      
      if (contactIds.length > 0) {
        const contactBatchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: contactIds.map((id: string) => ({ id })),
            properties: ['firstname', 'lastname', 'email', 'jobtitle'],
          }),
        });
        if (contactBatchResponse.ok) {
          const contactBatchData = await contactBatchResponse.json();
          contacts = contactBatchData.results || [];
        }
      }
    }

    // Fetch deals via associations
    let deals: any[] = [];
    const dealAssocUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/deals`;
    const dealAssocResponse = await fetch(dealAssocUrl, {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (dealAssocResponse.ok) {
      const dealAssocData = await dealAssocResponse.json();
      const dealIds = dealAssocData.results?.map((r: any) => r.id).slice(0, 10) || [];
      
      if (dealIds.length > 0) {
        const dealBatchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals/batch/read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: dealIds.map((id: string) => ({ id })),
            properties: ['dealname', 'dealstage', 'amount', 'closedate'],
          }),
        });
        if (dealBatchResponse.ok) {
          const dealBatchData = await dealBatchResponse.json();
          deals = dealBatchData.results || [];
        }
      }
    }

    // Build prompt for AI summary
    const prompt = `Analyze the following HubSpot company data and provide a comprehensive business intelligence summary:

Company: ${company.name || 'Unknown'}
Industry: ${company.industry || 'Not specified'}
Location: ${company.city ? `${company.city}, ${company.state || ''}` : 'Not specified'}
Website: ${company.website || company.domain || 'Not specified'}
Employees: ${company.numberofemployees || 'Not specified'}

Key Contacts:
${contacts.map((c: any) => `- ${c.properties.firstname || ''} ${c.properties.lastname || ''} (${c.properties.jobtitle || 'No title'}) - ${c.properties.email || 'No email'}`).join('\n') || 'No contacts found'}

Active Deals:
${deals.map((d: any) => `- ${d.properties.dealname || 'Unnamed'} - Stage: ${d.properties.dealstage || 'Unknown'} - Value: ${d.properties.amount ? `$${d.properties.amount}` : 'Not specified'}`).join('\n') || 'No deals found'}

Provide a concise summary (2-3 paragraphs) covering:
1. Company profile and business context
2. Key decision-makers and their roles
3. Sales opportunities and deal status
4. Strategic insights for outreach

Format as plain text suitable for use in a personalized cold call letter.`;

    // Call Anthropic API
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API Error:', aiResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate AI summary', details: errorText },
        { status: aiResponse.status }
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.content[0]?.text || '';

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}



