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
    const limit = body.limit ? parseInt(body.limit) : undefined;

    const syncService = new HubSpotSyncService();
    const result = await syncService.syncCompanies(limit);

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      updated: result.updated,
      errors: result.errors,
      errorMessages: result.errorMessages,
    });
  } catch (error: any) {
    console.error('Error syncing companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync companies' },
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const syncService = new HubSpotSyncService();
    const result = await syncService.syncCompanies(limit);

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      updated: result.updated,
      errors: result.errors,
      errorMessages: result.errorMessages,
    });
  } catch (error: any) {
    console.error('Error syncing companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync companies' },
      { status: 500 }
    );
  }
}

