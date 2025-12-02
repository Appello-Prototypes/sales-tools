/**
 * HubSpot Full Sync Script
 * 
 * This script syncs ALL contacts, companies, and deals from HubSpot to MongoDB.
 * Run this script:
 * - Initially to populate the database with all HubSpot data
 * - Periodically (e.g., via cron) to ensure data stays fresh
 * 
 * Usage:
 *   npx tsx scripts/sync-hubspot.ts
 *   npx tsx scripts/sync-hubspot.ts --incremental  # Only sync recent changes
 * 
 * Note: Requires the following environment variables:
 *   - MONGODB_URI
 *   - HUBSPOT_API_KEY or HUBSPOT_PRIVATE_APP_ACCESS_TOKEN
 */

import 'dotenv/config';
import { HubSpotSyncService } from '../lib/hubspot/syncService';
import connectDB from '../lib/mongodb';

async function main() {
  const startTime = Date.now();
  const isIncremental = process.argv.includes('--incremental');
  
  console.log('='.repeat(60));
  console.log(`HubSpot ${isIncremental ? 'Incremental' : 'Full'} Sync`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Create sync service
    const syncService = new HubSpotSyncService();

    // Check current status
    console.log('\n📊 Current sync status:');
    const status = await syncService.getSyncStatus();
    console.log(`  Contacts: ${status.contacts.totalRecords} records, last full sync: ${status.contacts.lastFullSync || 'never'}`);
    console.log(`  Companies: ${status.companies.totalRecords} records, last full sync: ${status.companies.lastFullSync || 'never'}`);
    console.log(`  Deals: ${status.deals.totalRecords} records, last full sync: ${status.deals.lastFullSync || 'never'}`);

    // Perform sync
    let results;
    if (isIncremental) {
      console.log('\n🔄 Starting incremental sync (last 24 hours)...');
      results = await syncService.syncAllIncremental(24);
    } else {
      console.log('\n🔄 Starting full sync (this may take a while for large datasets)...');
      results = await syncService.syncAll();
    }

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('SYNC RESULTS');
    console.log('='.repeat(60));

    console.log('\n📇 Contacts:');
    console.log(`  ✓ New records synced: ${results.contacts.synced}`);
    console.log(`  ↻ Records updated: ${results.contacts.updated}`);
    console.log(`  ✗ Errors: ${results.contacts.errors}`);
    if (results.contacts.totalRecords) {
      console.log(`  📊 Total records processed: ${results.contacts.totalRecords}`);
    }
    if (results.contacts.errors > 0 && results.contacts.errorMessages?.length) {
      console.log(`  Error messages: ${results.contacts.errorMessages.slice(0, 3).join(', ')}${results.contacts.errorMessages.length > 3 ? '...' : ''}`);
    }

    console.log('\n🏢 Companies:');
    console.log(`  ✓ New records synced: ${results.companies.synced}`);
    console.log(`  ↻ Records updated: ${results.companies.updated}`);
    console.log(`  ✗ Errors: ${results.companies.errors}`);
    if (results.companies.totalRecords) {
      console.log(`  📊 Total records processed: ${results.companies.totalRecords}`);
    }
    if (results.companies.errors > 0 && results.companies.errorMessages?.length) {
      console.log(`  Error messages: ${results.companies.errorMessages.slice(0, 3).join(', ')}${results.companies.errorMessages.length > 3 ? '...' : ''}`);
    }

    console.log('\n💰 Deals:');
    console.log(`  ✓ New records synced: ${results.deals.synced}`);
    console.log(`  ↻ Records updated: ${results.deals.updated}`);
    console.log(`  ✗ Errors: ${results.deals.errors}`);
    if (results.deals.totalRecords) {
      console.log(`  📊 Total records processed: ${results.deals.totalRecords}`);
    }
    if (results.deals.errors > 0 && results.deals.errorMessages?.length) {
      console.log(`  Error messages: ${results.deals.errorMessages.slice(0, 3).join(', ')}${results.deals.errorMessages.length > 3 ? '...' : ''}`);
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total new records: ${results.contacts.synced + results.companies.synced + results.deals.synced}`);
    console.log(`Total updated: ${results.contacts.updated + results.companies.updated + results.deals.updated}`);
    console.log(`Total errors: ${results.contacts.errors + results.companies.errors + results.deals.errors}`);
    console.log(`Duration: ${durationMin}m ${durationSec}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    
    // Get final status
    const finalStatus = await syncService.getSyncStatus();
    console.log('\n📊 Final sync status:');
    console.log(`  Contacts: ${finalStatus.contacts.totalRecords} records`);
    console.log(`  Companies: ${finalStatus.companies.totalRecords} records`);
    console.log(`  Deals: ${finalStatus.deals.totalRecords} records`);

    const success = results.contacts.success && results.companies.success && results.deals.success;
    process.exit(success ? 0 : 1);

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();


