'use client';

import { useEffect, useState } from 'react';
import { useHubSpotStore, useHubSpotSync } from '@/lib/store/hubspotStore';
import { Loader2 } from 'lucide-react';

interface HubSpotDataProviderProps {
  children: React.ReactNode;
  autoLoad?: boolean;
  autoSync?: boolean;
}

/**
 * HubSpot Data Provider
 * 
 * Initializes and manages the global HubSpot data store.
 * Automatically loads data from MongoDB on mount and can sync with HubSpot.
 */
export function HubSpotDataProvider({ 
  children, 
  autoLoad = true,
  autoSync = false 
}: HubSpotDataProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const { loadFromDatabase, syncAll, isSyncing } = useHubSpotSync();
  const store = useHubSpotStore();
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we have data in the store
        const hasData = store.stats.totalCompanies > 0 || 
                       store.stats.totalContacts > 0 || 
                       store.stats.totalDeals > 0;
        
        // If autoSync is enabled and we don't have recent data, sync first
        if (autoSync && (!hasData || !store.lastSyncAt || 
            Date.now() - store.lastSyncAt.getTime() > 24 * 60 * 60 * 1000)) {
          await syncAll();
        } else if (autoLoad && !hasData) {
          // Otherwise just load from database
          await loadFromDatabase();
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing HubSpot data:', error);
        setInitialized(true); // Still set initialized to show UI
      }
    };
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, autoSync]);
  
  // Show loading state only if we're syncing and have no data
  if (!initialized && (isSyncing || store.stats.totalCompanies === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-violet-400" />
          <p className="text-slate-400">
            {isSyncing ? 'Syncing HubSpot data...' : 'Loading HubSpot data...'}
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

