# HubSpot Sync System

This document describes the HubSpot sync system that keeps contacts, companies, and deals synchronized with HubSpot.

## Overview

The sync system stores HubSpot data in MongoDB for fast access and keeps it synchronized with HubSpot. All contacts, companies, and deals are automatically synced and remain up-to-date.

## Models

Three MongoDB models store synced data:

- **Contact** (`models/Contact.ts`) - Stores contact information
- **Company** (`models/Company.ts`) - Stores company information  
- **Deal** (`models/Deal.ts`) - Stores deal information

Each model includes:
- HubSpot ID (unique identifier)
- All relevant properties
- Sync tracking (`lastSyncedAt`, `syncStatus`)
- Full property object for extensibility

## API Endpoints

### Sync Endpoints

#### Sync All Data
```
POST /api/admin/hubspot/sync/all
GET /api/admin/hubspot/sync/all?limit=100
```
Syncs all contacts, companies, and deals from HubSpot.

#### Sync Contacts
```
POST /api/admin/hubspot/sync/contacts
GET /api/admin/hubspot/sync/contacts?limit=100
```
Syncs contacts from HubSpot.

#### Sync Companies
```
POST /api/admin/hubspot/sync/companies
GET /api/admin/hubspot/sync/companies?limit=100
```
Syncs companies from HubSpot.

#### Sync Deals
```
POST /api/admin/hubspot/sync/deals
GET /api/admin/hubspot/sync/deals?limit=100
```
Syncs deals from HubSpot.

#### Sync Status
```
GET /api/admin/hubspot/sync/status
```
Returns sync status including:
- Total counts for each entity type
- Status breakdown (synced, pending, error)
- Last sync timestamp

### Data Fetch Endpoints

All existing endpoints now use synced data by default:

#### Get Contacts
```
GET /api/admin/hubspot/contacts?limit=50&useSync=true
```
- `useSync=true` (default): Returns data from MongoDB (synced data)
- `useSync=false`: Fetches directly from HubSpot API

#### Get Companies
```
GET /api/admin/hubspot/companies?limit=50&useSync=true
```
- `useSync=true` (default): Returns data from MongoDB (synced data)
- `useSync=false`: Fetches directly from HubSpot API

#### Get Deals
```
GET /api/admin/hubspot/deals?limit=100&useSync=true
```
- `useSync=true` (default): Returns data from MongoDB (synced data)
- `useSync=false`: Fetches directly from HubSpot API

## Usage

### Initial Sync

To sync all data for the first time:

```bash
# Using curl
curl -X POST http://localhost:3002/api/admin/hubspot/sync/all \
  -H "Cookie: your-auth-cookie"

# Or using fetch in your code
const response = await fetch('/api/admin/hubspot/sync/all', {
  method: 'POST',
  credentials: 'include',
});
const result = await response.json();
```

### Regular Sync

To keep data synchronized, call the sync endpoints periodically:

1. **Manual sync**: Call sync endpoints when needed
2. **Scheduled sync**: Set up a cron job or scheduled task to call sync endpoints
3. **On-demand sync**: Trigger sync when data is accessed and appears stale

### Checking Sync Status

```javascript
const response = await fetch('/api/admin/hubspot/sync/status', {
  credentials: 'include',
});
const status = await response.json();

console.log('Contacts:', status.contacts);
console.log('Companies:', status.companies);
console.log('Deals:', status.deals);
```

## Sync Service

The `HubSpotSyncService` (`lib/hubspot/syncService.ts`) handles all sync operations:

- Fetches data from HubSpot API
- Stores/updates data in MongoDB
- Handles pagination automatically
- Tracks sync status and errors
- Marks stale records (older than 24 hours) as pending

## Sync Behavior

1. **New records**: Created in MongoDB with `syncStatus: 'synced'`
2. **Existing records**: Updated with latest data from HubSpot
3. **Stale records**: Records not synced in 24+ hours are marked as `pending`
4. **Error handling**: Failed syncs are tracked with `syncStatus: 'error'` and error messages

## Automatic Sync Recommendations

To keep data always synced, consider:

1. **Cron Job**: Set up a cron job to call sync endpoints every hour or daily
2. **Next.js API Route**: Create a scheduled API route (requires external scheduler)
3. **Webhook Integration**: Set up HubSpot webhooks to trigger syncs on changes
4. **Background Worker**: Use a background job queue (e.g., Bull, BullMQ) for scheduled syncs

Example cron job (runs every hour):
```bash
0 * * * * curl -X POST http://localhost:3002/api/admin/hubspot/sync/all -H "Cookie: your-auth-cookie"
```

## Response Format

Sync endpoints return:
```json
{
  "success": true,
  "synced": 10,
  "updated": 5,
  "errors": 0,
  "errorMessages": []
}
```

Data fetch endpoints return:
```json
{
  "contacts": [...],
  "source": "mongodb",
  "synced": true
}
```

## Error Handling

- Sync errors are logged and tracked per record
- Failed syncs don't stop the entire process
- Individual record errors are included in `errorMessages`
- API routes fall back to HubSpot API if MongoDB query fails

## Performance

- MongoDB queries are indexed for fast lookups
- Sync operations use pagination to handle large datasets
- Data is stored locally for faster access
- Sync can be limited with `limit` parameter for testing

