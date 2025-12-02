# HubSpot Global Data Store

## Overview

The HubSpot Global Data Store provides a single source of truth for all HubSpot data (companies, contacts, deals) across the entire application. All components reference this store to ensure data consistency and eliminate duplicate API calls.

## Architecture

### Store (`lib/store/hubspotStore.ts`)

- **Technology**: Zustand with persistence
- **Storage**: LocalStorage (persisted across sessions)
- **Data Types**: Companies, Contacts, Deals
- **Features**: 
  - Automatic persistence
  - Search and filtering utilities
  - Real-time updates
  - Sync status tracking

### Provider (`components/admin/HubSpotDataProvider.tsx`)

- Wraps the admin layout
- Automatically loads data on mount
- Can optionally auto-sync with HubSpot
- Shows loading state during initialization

### API Endpoint (`app/api/admin/hubspot/store/load/route.ts`)

- Loads all HubSpot data from MongoDB
- Returns data in store-compatible format
- Used by the store to populate data

## Usage

### Basic Usage

```typescript
import { useHubSpotStore } from '@/lib/store/hubspotStore';

function MyComponent() {
  const store = useHubSpotStore();
  
  // Access data
  const companies = store.getAllCompanies();
  const contacts = store.getAllContacts();
  const deals = store.getAllDeals();
  
  // Access stats
  const { totalCompanies, totalContacts, totalDeals } = store.stats;
  
  // Check sync status
  const lastSync = store.lastSyncAt;
  const isSyncing = store.isSyncing;
}
```

### Using Sync Hook

```typescript
import { useHubSpotSync } from '@/lib/store/hubspotStore';

function MyComponent() {
  const { syncAll, loadFromDatabase, isSyncing, syncError } = useHubSpotSync();
  
  const handleSync = async () => {
    try {
      await syncAll(); // Syncs with HubSpot and loads data
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };
  
  const handleReload = async () => {
    await loadFromDatabase(); // Just loads from MongoDB
  };
}
```

### Search and Filter

```typescript
const store = useHubSpotStore();

// Search companies
const results = store.searchCompanies('construction');

// Get companies by industry
const constructionCompanies = store.getCompaniesByIndustry('Construction');

// Get contacts for a company
const companyContacts = store.getContactsByCompany(companyId);

// Get deals for a company
const companyDeals = store.getDealsByCompany(companyId);
```

### Update Data

```typescript
const store = useHubSpotStore();

// Update a single company
store.updateCompany({
  ...company,
  industry: 'Updated Industry',
});

// Set all companies (replaces existing)
store.setCompanies(newCompaniesArray);
```

## Integration

### Provider Setup

The provider is already integrated in `app/admin/layout.tsx`:

```typescript
<HubSpotDataProvider autoLoad={true} autoSync={false}>
  <AdminLayout>{children}</AdminLayout>
</HubSpotDataProvider>
```

### Options

- `autoLoad`: Automatically load data from MongoDB on mount (default: true)
- `autoSync`: Automatically sync with HubSpot if data is stale (default: false)

## Data Flow

1. **Initial Load**: Provider loads data from MongoDB via `/api/admin/hubspot/store/load`
2. **Store Population**: Data is stored in Zustand store with persistence
3. **Component Access**: Components access data directly from store (no API calls)
4. **Sync**: When needed, sync with HubSpot updates MongoDB, then reloads store

## Benefits

1. **Single Source of Truth**: All components reference the same data
2. **Performance**: No duplicate API calls, data cached in memory
3. **Consistency**: Data is always synchronized across components
4. **Persistence**: Data persists across page refreshes
5. **Real-time Updates**: Store updates propagate to all components automatically

## Migration Guide

### Before (Direct API Calls)

```typescript
// ❌ Old way - direct API calls
const [companies, setCompanies] = useState([]);

useEffect(() => {
  fetch('/api/admin/hubspot/companies')
    .then(res => res.json())
    .then(data => setCompanies(data.companies));
}, []);
```

### After (Using Store)

```typescript
// ✅ New way - use global store
const store = useHubSpotStore();
const companies = store.getAllCompanies();
```

## Best Practices

1. **Always use the store** instead of direct API calls for HubSpot data
2. **Use selectors** (`getAllCompanies`, `searchCompanies`, etc.) instead of accessing Maps directly
3. **Sync when needed** - use `syncAll()` when you need fresh data from HubSpot
4. **Check sync status** - show loading states based on `isSyncing`
5. **Handle errors** - check `syncError` for sync failures

## API Reference

See `lib/store/hubspotStore.ts` for complete API documentation.


