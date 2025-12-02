import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Deal from '@/models/Deal';
import SyncMetadata from '@/models/SyncMetadata';
import { HubSpotSyncService } from '@/lib/hubspot/syncService';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get status counts for each entity type
    const [contacts, companies, deals] = await Promise.all([
      Contact.aggregate([
        {
          $group: {
            _id: '$syncStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Company.aggregate([
        {
          $group: {
            _id: '$syncStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Deal.aggregate([
        {
          $group: {
            _id: '$syncStatus',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Get total counts
    const [totalContacts, totalCompanies, totalDeals] = await Promise.all([
      Contact.countDocuments(),
      Company.countDocuments(),
      Deal.countDocuments(),
    ]);

    // Get last synced records
    const [lastSyncedContact, lastSyncedCompany, lastSyncedDeal] = await Promise.all([
      Contact.findOne().sort({ lastSyncedAt: -1 }).select('lastSyncedAt').lean(),
      Company.findOne().sort({ lastSyncedAt: -1 }).select('lastSyncedAt').lean(),
      Deal.findOne().sort({ lastSyncedAt: -1 }).select('lastSyncedAt').lean(),
    ]);

    // Get sync metadata
    const [contactsMeta, companiesMeta, dealsMeta] = await Promise.all([
      SyncMetadata.findOne({ entityType: 'contacts' }).lean(),
      SyncMetadata.findOne({ entityType: 'companies' }).lean(),
      SyncMetadata.findOne({ entityType: 'deals' }).lean(),
    ]);

    // Check if sync is needed
    const syncService = new HubSpotSyncService();
    const [needsContactsSync, needsCompaniesSync, needsDealsSync] = await Promise.all([
      syncService.needsFullSync('contacts'),
      syncService.needsFullSync('companies'),
      syncService.needsFullSync('deals'),
    ]);

    const formatStatus = (statusArray: any[]) => {
      const statusMap: Record<string, number> = {};
      statusArray.forEach((item) => {
        statusMap[item._id || 'unknown'] = item.count;
      });
      return {
        synced: statusMap.synced || 0,
        pending: statusMap.pending || 0,
        error: statusMap.error || 0,
      };
    };

    return NextResponse.json({
      contacts: {
        total: totalContacts,
        status: formatStatus(contacts),
        lastSyncedAt: lastSyncedContact?.lastSyncedAt || null,
        lastFullSyncAt: (contactsMeta as any)?.lastFullSyncAt || null,
        lastIncrementalSyncAt: (contactsMeta as any)?.lastIncrementalSyncAt || null,
        syncInProgress: (contactsMeta as any)?.syncInProgress || false,
        needsSync: needsContactsSync,
      },
      companies: {
        total: totalCompanies,
        status: formatStatus(companies),
        lastSyncedAt: lastSyncedCompany?.lastSyncedAt || null,
        lastFullSyncAt: (companiesMeta as any)?.lastFullSyncAt || null,
        lastIncrementalSyncAt: (companiesMeta as any)?.lastIncrementalSyncAt || null,
        syncInProgress: (companiesMeta as any)?.syncInProgress || false,
        needsSync: needsCompaniesSync,
      },
      deals: {
        total: totalDeals,
        status: formatStatus(deals),
        lastSyncedAt: lastSyncedDeal?.lastSyncedAt || null,
        lastFullSyncAt: (dealsMeta as any)?.lastFullSyncAt || null,
        lastIncrementalSyncAt: (dealsMeta as any)?.lastIncrementalSyncAt || null,
        syncInProgress: (dealsMeta as any)?.syncInProgress || false,
        needsSync: needsDealsSync,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger a sync check and optionally force a full sync
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const forceFullSync = body.forceFullSync === true;

    const syncService = new HubSpotSyncService();

    if (forceFullSync) {
      // Trigger full sync for all entity types
      const results = await syncService.syncAll();
      return NextResponse.json({
        message: 'Full sync completed',
        results,
      });
    }

    // Check if sync is needed and trigger if so
    const syncResult = await syncService.ensureDataSynced();
    
    if (syncResult.triggered) {
      return NextResponse.json({
        message: 'Sync triggered for stale entities',
        entities: syncResult.entities,
      });
    }

    return NextResponse.json({
      message: 'All data is up to date',
      entities: [],
    });
  } catch (error: any) {
    console.error('Error triggering sync:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}
