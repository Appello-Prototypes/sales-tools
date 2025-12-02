import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import Contact from '@/models/Contact';
import Deal from '@/models/Deal';
import { verifyAuth } from '@/lib/auth';

/**
 * Load all HubSpot data from MongoDB into the global store
 * This endpoint is used by the frontend to populate the Zustand store
 */
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10000');
    
    // Fetch all data from MongoDB
    const [companies, contacts, deals] = await Promise.all([
      Company.find({})
        .limit(limit)
        .lean()
        .sort({ lastSyncedAt: -1 }),
      Contact.find({})
        .limit(limit)
        .lean()
        .sort({ lastSyncedAt: -1 }),
      Deal.find({})
        .limit(limit)
        .lean()
        .sort({ lastSyncedAt: -1 }),
    ]);
    
    // Transform to match store interface
    const companiesData = companies.map(c => ({
      id: c._id.toString(),
      hubspotId: c.hubspotId,
      name: c.name,
      domain: c.domain,
      website: c.website,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      industry: c.industry,
      employees: c.employees,
      properties: c.properties || {},
      lastSyncedAt: c.lastSyncedAt,
      syncStatus: c.syncStatus,
    }));
    
    const contactsData = contacts.map(c => ({
      id: c._id.toString(),
      hubspotId: c.hubspotId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      jobTitle: c.jobTitle,
      phone: c.phone,
      company: c.company,
      companyId: c.companyId,
      fullName: c.fullName,
      properties: c.properties || {},
      lastSyncedAt: c.lastSyncedAt,
      syncStatus: c.syncStatus,
    }));
    
    const dealsData = deals.map(d => ({
      id: d._id.toString(),
      hubspotId: d.hubspotId,
      dealname: d.dealname,
      amount: d.amount,
      dealstage: d.dealstage,
      pipeline: d.pipeline,
      closedate: d.closedate,
      dealtype: d.dealtype,
      ownerId: d.ownerId,
      companyIds: d.companyIds || [],
      contactIds: d.contactIds || [],
      isClosed: d.isClosed,
      isWon: d.isWon,
      isLost: d.isLost,
      properties: d.properties || {},
      lastSyncedAt: d.lastSyncedAt,
      syncStatus: d.syncStatus,
    }));
    
    return NextResponse.json({
      companies: companiesData,
      contacts: contactsData,
      deals: dealsData,
      stats: {
        totalCompanies: companies.length,
        totalContacts: contacts.length,
        totalDeals: deals.length,
        lastUpdated: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error loading HubSpot store data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load HubSpot data' },
      { status: 500 }
    );
  }
}


