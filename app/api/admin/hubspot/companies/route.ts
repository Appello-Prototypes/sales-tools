import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get HubSpot Private App Access Token from environment
    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    
    if (!hubspotApiKey) {
      console.error('HubSpot API key not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('HUBSPOT')));
      return NextResponse.json(
        { error: 'HubSpot API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }
    
    console.log('HubSpot API key found, length:', hubspotApiKey.length);
    console.log('HubSpot API key prefix:', hubspotApiKey.substring(0, 10) + '...');

    let url: string;
    let requestBody: any = null;

    // Use search API if search query provided, otherwise use list API
    if (search) {
      url = 'https://api.hubapi.com/crm/v3/objects/companies/search';
      requestBody = {
        query: search,
        limit: limit,
        properties: ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'industry', 'numberofemployees', 'website'],
      };
    } else {
      url = 'https://api.hubapi.com/crm/v3/objects/companies';
      const urlObj = new URL(url);
      urlObj.searchParams.append('limit', limit.toString());
      urlObj.searchParams.append('properties', 'name,domain,phone,address,city,state,zip,industry,numberofemployees,website');
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
      console.error('Request URL:', url);
      console.error('Request headers:', JSON.stringify(fetchOptions.headers, null, 2));
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
    
    // Transform HubSpot data to simpler format
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

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error('Error fetching HubSpot companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

