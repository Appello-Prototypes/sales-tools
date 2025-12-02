/**
 * HubSpot Global Data Store
 * 
 * Single source of truth for all HubSpot data (companies, contacts, deals)
 * All components reference this store to ensure data consistency
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface HubSpotCompany {
  id: string;
  hubspotId: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  employees?: string;
  properties: Record<string, any>;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface HubSpotContact {
  id: string;
  hubspotId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  phone?: string;
  company?: string;
  companyId?: string;
  fullName: string;
  properties: Record<string, any>;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface HubSpotDeal {
  id: string;
  hubspotId: string;
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline: string;
  closedate?: Date;
  dealtype?: string;
  ownerId?: string;
  companyIds?: string[];
  contactIds?: string[];
  isClosed: boolean;
  isWon: boolean;
  isLost: boolean;
  properties: Record<string, any>;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface HubSpotStore {
  // Data
  companies: Map<string, HubSpotCompany>;
  contacts: Map<string, HubSpotContact>;
  deals: Map<string, HubSpotDeal>;
  
  // Metadata
  lastSyncAt: Date | null;
  isSyncing: boolean;
  syncError: string | null;
  
  // Stats
  stats: {
    totalCompanies: number;
    totalContacts: number;
    totalDeals: number;
    lastUpdated: Date | null;
  };
  
  // Actions
  setCompanies: (companies: HubSpotCompany[]) => void;
  setContacts: (contacts: HubSpotContact[]) => void;
  setDeals: (deals: HubSpotDeal[]) => void;
  updateCompany: (company: HubSpotCompany) => void;
  updateContact: (contact: HubSpotContact) => void;
  updateDeal: (deal: HubSpotDeal) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (date: Date) => void;
  clearData: () => void;
  
  // Selectors
  getCompany: (hubspotId: string) => HubSpotCompany | undefined;
  getContact: (hubspotId: string) => HubSpotContact | undefined;
  getDeal: (hubspotId: string) => HubSpotDeal | undefined;
  getCompaniesByIndustry: (industry: string) => HubSpotCompany[];
  getContactsByCompany: (companyId: string) => HubSpotContact[];
  getDealsByCompany: (companyId: string) => HubSpotDeal[];
  getAllCompanies: () => HubSpotCompany[];
  getAllContacts: () => HubSpotContact[];
  getAllDeals: () => HubSpotDeal[];
  searchCompanies: (query: string) => HubSpotCompany[];
  searchContacts: (query: string) => HubSpotContact[];
  searchDeals: (query: string) => HubSpotDeal[];
}

// ============================================================================
// Store
// ============================================================================

export const useHubSpotStore = create<HubSpotStore>()(
  persist(
    (set, get) => ({
      companies: new Map(),
      contacts: new Map(),
      deals: new Map(),
      lastSyncAt: null,
      isSyncing: false,
      syncError: null,
      stats: {
        totalCompanies: 0,
        totalContacts: 0,
        totalDeals: 0,
        lastUpdated: null,
      },
      
      setCompanies: (companies) => {
        const companiesMap = new Map<string, HubSpotCompany>();
        companies.forEach(company => {
          companiesMap.set(company.hubspotId, company);
        });
        
        set({
          companies: companiesMap,
          stats: {
            ...get().stats,
            totalCompanies: companies.length,
            lastUpdated: new Date(),
          },
        });
      },
      
      setContacts: (contacts) => {
        const contactsMap = new Map<string, HubSpotContact>();
        contacts.forEach(contact => {
          contactsMap.set(contact.hubspotId, contact);
        });
        
        set({
          contacts: contactsMap,
          stats: {
            ...get().stats,
            totalContacts: contacts.length,
            lastUpdated: new Date(),
          },
        });
      },
      
      setDeals: (deals) => {
        const dealsMap = new Map<string, HubSpotDeal>();
        deals.forEach(deal => {
          dealsMap.set(deal.hubspotId, deal);
        });
        
        set({
          deals: dealsMap,
          stats: {
            ...get().stats,
            totalDeals: deals.length,
            lastUpdated: new Date(),
          },
        });
      },
      
      updateCompany: (company) => {
        set((state) => {
          const newCompanies = new Map(state.companies);
          newCompanies.set(company.hubspotId, company);
          return { companies: newCompanies };
        });
      },
      
      updateContact: (contact) => {
        set((state) => {
          const newContacts = new Map(state.contacts);
          newContacts.set(contact.hubspotId, contact);
          return { contacts: newContacts };
        });
      },
      
      updateDeal: (deal) => {
        set((state) => {
          const newDeals = new Map(state.deals);
          newDeals.set(deal.hubspotId, deal);
          return { deals: newDeals };
        });
      },
      
      setSyncing: (isSyncing) => set({ isSyncing }),
      
      setSyncError: (error) => set({ syncError: error }),
      
      setLastSyncAt: (date) => set({ lastSyncAt: date }),
      
      clearData: () => {
        set({
          companies: new Map(),
          contacts: new Map(),
          deals: new Map(),
          lastSyncAt: null,
          syncError: null,
          stats: {
            totalCompanies: 0,
            totalContacts: 0,
            totalDeals: 0,
            lastUpdated: null,
          },
        });
      },
      
      // Selectors
      getCompany: (hubspotId) => get().companies.get(hubspotId),
      
      getContact: (hubspotId) => get().contacts.get(hubspotId),
      
      getDeal: (hubspotId) => get().deals.get(hubspotId),
      
      getCompaniesByIndustry: (industry) => {
        const companies = Array.from(get().companies.values());
        return companies.filter(c => 
          c.industry?.toLowerCase().includes(industry.toLowerCase())
        );
      },
      
      getContactsByCompany: (companyId) => {
        const contacts = Array.from(get().contacts.values());
        return contacts.filter(c => c.companyId === companyId);
      },
      
      getDealsByCompany: (companyId) => {
        const deals = Array.from(get().deals.values());
        return deals.filter(d => 
          d.companyIds?.includes(companyId)
        );
      },
      
      getAllCompanies: () => Array.from(get().companies.values()),
      
      getAllContacts: () => Array.from(get().contacts.values()),
      
      getAllDeals: () => Array.from(get().deals.values()),
      
      searchCompanies: (query) => {
        const companies = Array.from(get().companies.values());
        const lowerQuery = query.toLowerCase();
        return companies.filter(c =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.domain?.toLowerCase().includes(lowerQuery) ||
          c.industry?.toLowerCase().includes(lowerQuery) ||
          c.city?.toLowerCase().includes(lowerQuery)
        );
      },
      
      searchContacts: (query) => {
        const contacts = Array.from(get().contacts.values());
        const lowerQuery = query.toLowerCase();
        return contacts.filter(c =>
          c.fullName.toLowerCase().includes(lowerQuery) ||
          c.email?.toLowerCase().includes(lowerQuery) ||
          c.jobTitle?.toLowerCase().includes(lowerQuery) ||
          c.company?.toLowerCase().includes(lowerQuery)
        );
      },
      
      searchDeals: (query) => {
        const deals = Array.from(get().deals.values());
        const lowerQuery = query.toLowerCase();
        return deals.filter(d =>
          d.dealname.toLowerCase().includes(lowerQuery) ||
          d.pipeline?.toLowerCase().includes(lowerQuery) ||
          d.dealstage?.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'hubspot-data-storage',
      // Custom serialization for Maps
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert arrays back to Maps
          if (parsed?.state) {
            if (parsed.state.companies) {
              parsed.state.companies = new Map(parsed.state.companies);
            }
            if (parsed.state.contacts) {
              parsed.state.contacts = new Map(parsed.state.contacts);
            }
            if (parsed.state.deals) {
              parsed.state.deals = new Map(parsed.state.deals);
            }
            // Convert date strings back to Date objects
            if (parsed.state.lastSyncAt) {
              parsed.state.lastSyncAt = new Date(parsed.state.lastSyncAt);
            }
            if (parsed.state.stats?.lastUpdated) {
              parsed.state.stats.lastUpdated = new Date(parsed.state.stats.lastUpdated);
            }
          }
          return parsed;
        },
        setItem: (name, value: any) => {
          // Convert Maps to arrays for serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              companies: Array.from(value.state.companies.entries()),
              contacts: Array.from(value.state.contacts.entries()),
              deals: Array.from(value.state.deals.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// ============================================================================
// Sync Hook
// ============================================================================

export function useHubSpotSync() {
  const store = useHubSpotStore();
  
  const syncAll = async () => {
    if (store.isSyncing) {
      console.warn('Sync already in progress');
      return;
    }
    
    try {
      store.setSyncing(true);
      store.setSyncError(null);
      
      // Sync all data from API
      const response = await fetch('/api/admin/hubspot/sync/all');
      if (!response.ok) {
        throw new Error('Failed to sync HubSpot data');
      }
      
      const result = await response.json();
      
      // Load synced data from MongoDB
      await loadFromDatabase();
      
      store.setLastSyncAt(new Date());
    } catch (error: any) {
      store.setSyncError(error.message || 'Failed to sync');
      throw error;
    } finally {
      store.setSyncing(false);
    }
  };
  
  const loadFromDatabase = async () => {
    try {
      // Use the dedicated store load endpoint
      const response = await fetch('/api/admin/hubspot/store/load?limit=10000');
      if (!response.ok) {
        console.warn('Could not load HubSpot data (status ' + response.status + '), continuing without CRM data');
        return; // Don't throw, just return gracefully
      }
      
      const data = await response.json();
      
      // Transform and set data
      const companies = (data.companies || []).map((c: any) => ({
        id: c.id,
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
        lastSyncedAt: new Date(c.lastSyncedAt),
        syncStatus: c.syncStatus || 'synced',
      }));
      
      const contacts = (data.contacts || []).map((c: any) => ({
        id: c.id,
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
        lastSyncedAt: new Date(c.lastSyncedAt),
        syncStatus: c.syncStatus || 'synced',
      }));
      
      const deals = (data.deals || []).map((d: any) => ({
        id: d.id,
        hubspotId: d.hubspotId,
        dealname: d.dealname,
        amount: d.amount || '0',
        dealstage: d.dealstage || '',
        pipeline: d.pipeline || '',
        closedate: d.closedate ? new Date(d.closedate) : undefined,
        dealtype: d.dealtype,
        ownerId: d.ownerId,
        companyIds: d.companyIds || [],
        contactIds: d.contactIds || [],
        isClosed: d.isClosed || false,
        isWon: d.isWon || false,
        isLost: d.isLost || false,
        properties: d.properties || {},
        lastSyncedAt: new Date(d.lastSyncedAt),
        syncStatus: d.syncStatus || 'synced',
      }));
      
      store.setCompanies(companies);
      store.setContacts(contacts);
      store.setDeals(deals);
    } catch (error) {
      console.error('Error loading from database:', error);
      throw error;
    }
  };
  
  return {
    syncAll,
    loadFromDatabase,
    isSyncing: store.isSyncing,
    syncError: store.syncError,
    lastSyncAt: store.lastSyncAt,
  };
}

