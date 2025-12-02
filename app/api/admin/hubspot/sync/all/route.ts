import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { HubSpotSyncService } from '@/lib/hubspot/syncService';

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    // No limit by default - sync ALL records
    const limit = body.limit ? parseInt(body.limit) : undefined;
    const incremental = body.incremental === true;

    const syncService = new HubSpotSyncService();
    
    let results;
    if (incremental) {
      const maxAgeHours = body.maxAgeHours || 24;
      results = await syncService.syncAllIncremental(maxAgeHours);
    } else {
      results = await syncService.syncAll(limit);
    }

    const totalSynced = results.contacts.synced + results.companies.synced + results.deals.synced;
    const totalUpdated = results.contacts.updated + results.companies.updated + results.deals.updated;
    const totalErrors = results.contacts.errors + results.companies.errors + results.deals.errors;

    return NextResponse.json({
      success: results.contacts.success && results.companies.success && results.deals.success,
      summary: {
        totalSynced,
        totalUpdated,
        totalErrors,
        totalRecords: (results.contacts.totalRecords || 0) + (results.companies.totalRecords || 0) + (results.deals.totalRecords || 0),
      },
      contacts: {
        synced: results.contacts.synced,
        updated: results.contacts.updated,
        errors: results.contacts.errors,
        totalRecords: results.contacts.totalRecords,
        errorMessages: results.contacts.errorMessages,
      },
      companies: {
        synced: results.companies.synced,
        updated: results.companies.updated,
        errors: results.companies.errors,
        totalRecords: results.companies.totalRecords,
        errorMessages: results.companies.errorMessages,
      },
      deals: {
        synced: results.deals.synced,
        updated: results.deals.updated,
        errors: results.deals.errors,
        totalRecords: results.deals.totalRecords,
        errorMessages: results.deals.errorMessages,
      },
    });
  } catch (error: any) {
    console.error('Error syncing all:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync all data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    // No limit by default - sync ALL records
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const incremental = searchParams.get('incremental') === 'true';
    const maxAgeHours = parseInt(searchParams.get('maxAgeHours') || '24');

    const syncService = new HubSpotSyncService();
    
    let results;
    if (incremental) {
      results = await syncService.syncAllIncremental(maxAgeHours);
    } else {
      results = await syncService.syncAll(limit);
    }

    const totalSynced = results.contacts.synced + results.companies.synced + results.deals.synced;
    const totalUpdated = results.contacts.updated + results.companies.updated + results.deals.updated;
    const totalErrors = results.contacts.errors + results.companies.errors + results.deals.errors;

    return NextResponse.json({
      success: results.contacts.success && results.companies.success && results.deals.success,
      summary: {
        totalSynced,
        totalUpdated,
        totalErrors,
        totalRecords: (results.contacts.totalRecords || 0) + (results.companies.totalRecords || 0) + (results.deals.totalRecords || 0),
      },
      contacts: {
        synced: results.contacts.synced,
        updated: results.contacts.updated,
        errors: results.contacts.errors,
        totalRecords: results.contacts.totalRecords,
        errorMessages: results.contacts.errorMessages,
      },
      companies: {
        synced: results.companies.synced,
        updated: results.companies.updated,
        errors: results.companies.errors,
        totalRecords: results.companies.totalRecords,
        errorMessages: results.companies.errorMessages,
      },
      deals: {
        synced: results.deals.synced,
        updated: results.deals.updated,
        errors: results.deals.errors,
        totalRecords: results.deals.totalRecords,
        errorMessages: results.deals.errorMessages,
      },
    });
  } catch (error: any) {
    console.error('Error syncing all:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync all data' },
      { status: 500 }
    );
  }
}
