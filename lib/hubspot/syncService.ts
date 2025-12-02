import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Company from '@/models/Company';
import Deal from '@/models/Deal';
import SyncMetadata from '@/models/SyncMetadata';

interface SyncResult {
  success: boolean;
  synced: number;
  updated: number;
  errors: number;
  totalRecords?: number;
  errorMessages?: string[];
}

// In-memory lock to prevent concurrent syncs
const syncLocks: Record<string, boolean> = {
  contacts: false,
  companies: false,
  deals: false,
};

export class HubSpotSyncService {
  private hubspotApiKey: string;
  private baseUrl = 'https://api.hubapi.com/crm/v3';

  constructor() {
    this.hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_HUBSPOT_API_KEY ||
      process.env.HUBSPOT_ACCESS_TOKEN || '';
    
    if (!this.hubspotApiKey) {
      throw new Error('HubSpot API key not configured');
    }
  }

  /**
   * Check if a full sync is needed (no data or data is older than maxAgeHours)
   */
  async needsFullSync(entityType: 'contacts' | 'companies' | 'deals', maxAgeHours: number = 24): Promise<boolean> {
    await connectDB();
    
    const metadata = await SyncMetadata.findOne({ entityType });
    
    // No metadata means never synced
    if (!metadata || !metadata.lastFullSyncAt) {
      return true;
    }
    
    // Check if last full sync is older than maxAgeHours
    const syncAge = Date.now() - metadata.lastFullSyncAt.getTime();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    return syncAge > maxAge;
  }

  /**
   * Get sync status for all entity types
   */
  async getSyncStatus(): Promise<{
    contacts: { lastFullSync: Date | null; totalRecords: number; needsSync: boolean };
    companies: { lastFullSync: Date | null; totalRecords: number; needsSync: boolean };
    deals: { lastFullSync: Date | null; totalRecords: number; needsSync: boolean };
  }> {
    await connectDB();
    
    const [contactsMeta, companiesMeta, dealsMeta] = await Promise.all([
      SyncMetadata.findOne({ entityType: 'contacts' }),
      SyncMetadata.findOne({ entityType: 'companies' }),
      SyncMetadata.findOne({ entityType: 'deals' }),
    ]);

    const [contactsCount, companiesCount, dealsCount] = await Promise.all([
      Contact.countDocuments(),
      Company.countDocuments(),
      Deal.countDocuments(),
    ]);

    return {
      contacts: {
        lastFullSync: contactsMeta?.lastFullSyncAt || null,
        totalRecords: contactsCount,
        needsSync: await this.needsFullSync('contacts'),
      },
      companies: {
        lastFullSync: companiesMeta?.lastFullSyncAt || null,
        totalRecords: companiesCount,
        needsSync: await this.needsFullSync('companies'),
      },
      deals: {
        lastFullSync: dealsMeta?.lastFullSyncAt || null,
        totalRecords: dealsCount,
        needsSync: await this.needsFullSync('deals'),
      },
    };
  }

  /**
   * Sync ALL contacts from HubSpot with optimized bulk operations
   */
  async syncContacts(limit?: number): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (syncLocks.contacts) {
      console.log('Contacts sync already in progress, skipping...');
      return { success: true, synced: 0, updated: 0, errors: 0, errorMessages: ['Sync already in progress'] };
    }

    syncLocks.contacts = true;
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      // Mark sync as in progress
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'contacts' },
        { syncInProgress: true },
        { upsert: true }
      );

      const properties = ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'];
      const pageSize = 100; // HubSpot max per page
      let after: string | undefined;
      let totalProcessed = 0;
      const bulkOps: any[] = [];
      const BULK_BATCH_SIZE = 500; // Batch size for MongoDB bulk operations

      do {
        const url = new URL(`${this.baseUrl}/objects/contacts`);
        url.searchParams.append('limit', pageSize.toString());
        url.searchParams.append('properties', properties.join(','));
        if (after) {
          url.searchParams.append('after', after);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const contacts = data.results || [];

        for (const contact of contacts) {
          if (limit && totalProcessed >= limit) break;

          const hubspotId = contact.id;
          const firstName = contact.properties.firstname || '';
          const lastName = contact.properties.lastname || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Contact';

          const contactData = {
            hubspotId,
            firstName,
            lastName,
            email: contact.properties.email || '',
            jobTitle: contact.properties.jobtitle || '',
            phone: contact.properties.phone || '',
            company: contact.properties.company || '',
            fullName,
            properties: contact.properties,
            lastSyncedAt: new Date(),
            syncStatus: 'synced' as const,
          };

          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: { $set: contactData },
              upsert: true,
            },
          });

          totalProcessed++;
        }

        // Execute bulk operations in batches
        if (bulkOps.length >= BULK_BATCH_SIZE) {
          try {
            const bulkResult = await Contact.bulkWrite(bulkOps, { ordered: false });
            result.synced += bulkResult.upsertedCount;
            result.updated += bulkResult.modifiedCount;
          } catch (bulkError: any) {
            result.errors += bulkOps.length;
            result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
          }
          bulkOps.length = 0;
        }

        after = data.paging?.next?.after;
        
        if (limit && totalProcessed >= limit) break;
      } while (after);

      // Process remaining bulk operations
      if (bulkOps.length > 0) {
        try {
          const bulkResult = await Contact.bulkWrite(bulkOps, { ordered: false });
          result.synced += bulkResult.upsertedCount;
          result.updated += bulkResult.modifiedCount;
        } catch (bulkError: any) {
          result.errors += bulkOps.length;
          result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
        }
      }

      result.totalRecords = totalProcessed;

      // Update sync metadata
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'contacts' },
        { 
          lastFullSyncAt: limit ? undefined : new Date(),
          lastIncrementalSyncAt: new Date(),
          totalRecords: totalProcessed,
          syncInProgress: false,
          lastSyncError: undefined,
        },
        { upsert: true }
      );

      // Mark stale contacts as pending (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Contact.updateMany(
        { lastSyncedAt: { $lt: oneDayAgo }, syncStatus: 'synced' },
        { syncStatus: 'pending' }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error syncing contacts:', error);
      
      // Update sync metadata with error
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'contacts' },
        { 
          syncInProgress: false,
          lastSyncError: error.message,
        },
        { upsert: true }
      );
    } finally {
      syncLocks.contacts = false;
    }

    return result;
  }

  /**
   * Sync ALL companies from HubSpot with optimized bulk operations
   */
  async syncCompanies(limit?: number): Promise<SyncResult> {
    if (syncLocks.companies) {
      console.log('Companies sync already in progress, skipping...');
      return { success: true, synced: 0, updated: 0, errors: 0, errorMessages: ['Sync already in progress'] };
    }

    syncLocks.companies = true;
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'companies' },
        { syncInProgress: true },
        { upsert: true }
      );

      const properties = ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'industry', 'numberofemployees', 'website'];
      const pageSize = 100;
      let after: string | undefined;
      let totalProcessed = 0;
      const bulkOps: any[] = [];
      const BULK_BATCH_SIZE = 500;

      do {
        const url = new URL(`${this.baseUrl}/objects/companies`);
        url.searchParams.append('limit', pageSize.toString());
        url.searchParams.append('properties', properties.join(','));
        if (after) {
          url.searchParams.append('after', after);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const companies = data.results || [];

        for (const company of companies) {
          if (limit && totalProcessed >= limit) break;

          const hubspotId = company.id;
          const name = company.properties.name || 'Unnamed Company';

          const companyData = {
            hubspotId,
            name,
            domain: company.properties.domain || '',
            website: company.properties.website || company.properties.domain || '',
            phone: company.properties.phone || '',
            address: company.properties.address || '',
            city: company.properties.city || '',
            state: company.properties.state || '',
            zip: company.properties.zip || '',
            industry: company.properties.industry || '',
            employees: company.properties.numberofemployees || '',
            properties: company.properties,
            lastSyncedAt: new Date(),
            syncStatus: 'synced' as const,
          };

          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: { 
                $set: companyData,
                // Preserve geocode data - don't overwrite if it exists
                $setOnInsert: {
                  lat: null,
                  lng: null,
                  geocodedAt: null,
                  geocodeError: null,
                },
              },
              upsert: true,
            },
          });

          totalProcessed++;
        }

        if (bulkOps.length >= BULK_BATCH_SIZE) {
          try {
            const bulkResult = await Company.bulkWrite(bulkOps, { ordered: false });
            result.synced += bulkResult.upsertedCount;
            result.updated += bulkResult.modifiedCount;
          } catch (bulkError: any) {
            result.errors += bulkOps.length;
            result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
          }
          bulkOps.length = 0;
        }

        after = data.paging?.next?.after;
        
        if (limit && totalProcessed >= limit) break;
      } while (after);

      if (bulkOps.length > 0) {
        try {
          const bulkResult = await Company.bulkWrite(bulkOps, { ordered: false });
          result.synced += bulkResult.upsertedCount;
          result.updated += bulkResult.modifiedCount;
        } catch (bulkError: any) {
          result.errors += bulkOps.length;
          result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
        }
      }

      result.totalRecords = totalProcessed;

      await SyncMetadata.findOneAndUpdate(
        { entityType: 'companies' },
        { 
          lastFullSyncAt: limit ? undefined : new Date(),
          lastIncrementalSyncAt: new Date(),
          totalRecords: totalProcessed,
          syncInProgress: false,
          lastSyncError: undefined,
        },
        { upsert: true }
      );

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Company.updateMany(
        { lastSyncedAt: { $lt: oneDayAgo }, syncStatus: 'synced' },
        { syncStatus: 'pending' }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error syncing companies:', error);
      
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'companies' },
        { syncInProgress: false, lastSyncError: error.message },
        { upsert: true }
      );
    } finally {
      syncLocks.companies = false;
    }

    return result;
  }

  /**
   * Sync ALL deals from HubSpot with optimized bulk operations
   */
  async syncDeals(limit?: number): Promise<SyncResult> {
    if (syncLocks.deals) {
      console.log('Deals sync already in progress, skipping...');
      return { success: true, synced: 0, updated: 0, errors: 0, errorMessages: ['Sync already in progress'] };
    }

    syncLocks.deals = true;
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'deals' },
        { syncInProgress: true },
        { upsert: true }
      );

      const properties = [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'dealtype',
        'hubspot_owner_id',
      ];
      const pageSize = 100;
      let after: string | undefined;
      let totalProcessed = 0;
      const bulkOps: any[] = [];
      const BULK_BATCH_SIZE = 100; // Smaller batch for deals due to association fetching

      do {
        const url = new URL(`${this.baseUrl}/objects/deals`);
        url.searchParams.append('limit', pageSize.toString());
        url.searchParams.append('properties', properties.join(','));
        if (after) {
          url.searchParams.append('after', after);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const deals = data.results || [];

        // Batch fetch associations for all deals in this page
        const dealIds = deals.map((d: any) => d.id);
        const associationsMap = await this.batchFetchAssociations(dealIds);

        for (const deal of deals) {
          if (limit && totalProcessed >= limit) break;

          const hubspotId = deal.id;
          const dealstage = deal.properties.dealstage || '';
          const isWon = dealstage === 'closedwon';
          const isLost = dealstage === 'closedlost';
          const isClosed = isWon || isLost;

          const associations = associationsMap.get(hubspotId) || { companyIds: [], contactIds: [] };

          const dealData = {
            hubspotId,
            dealname: deal.properties.dealname || 'Unnamed Deal',
            amount: deal.properties.amount || '0',
            dealstage,
            pipeline: deal.properties.pipeline || 'default',
            closedate: deal.properties.closedate ? new Date(deal.properties.closedate) : undefined,
            dealtype: deal.properties.dealtype || '',
            ownerId: deal.properties.hubspot_owner_id || '',
            companyIds: associations.companyIds,
            contactIds: associations.contactIds,
            isClosed,
            isWon,
            isLost,
            properties: deal.properties,
            lastSyncedAt: new Date(),
            syncStatus: 'synced' as const,
          };

          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: { $set: dealData },
              upsert: true,
            },
          });

          totalProcessed++;
        }

        if (bulkOps.length >= BULK_BATCH_SIZE) {
          try {
            const bulkResult = await Deal.bulkWrite(bulkOps, { ordered: false });
            result.synced += bulkResult.upsertedCount;
            result.updated += bulkResult.modifiedCount;
          } catch (bulkError: any) {
            result.errors += bulkOps.length;
            result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
          }
          bulkOps.length = 0;
        }

        after = data.paging?.next?.after;
        
        if (limit && totalProcessed >= limit) break;
      } while (after);

      if (bulkOps.length > 0) {
        try {
          const bulkResult = await Deal.bulkWrite(bulkOps, { ordered: false });
          result.synced += bulkResult.upsertedCount;
          result.updated += bulkResult.modifiedCount;
        } catch (bulkError: any) {
          result.errors += bulkOps.length;
          result.errorMessages?.push(`Bulk operation error: ${bulkError.message}`);
        }
      }

      result.totalRecords = totalProcessed;

      await SyncMetadata.findOneAndUpdate(
        { entityType: 'deals' },
        { 
          lastFullSyncAt: limit ? undefined : new Date(),
          lastIncrementalSyncAt: new Date(),
          totalRecords: totalProcessed,
          syncInProgress: false,
          lastSyncError: undefined,
        },
        { upsert: true }
      );

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Deal.updateMany(
        { lastSyncedAt: { $lt: oneDayAgo }, syncStatus: 'synced' },
        { syncStatus: 'pending' }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error syncing deals:', error);
      
      await SyncMetadata.findOneAndUpdate(
        { entityType: 'deals' },
        { syncInProgress: false, lastSyncError: error.message },
        { upsert: true }
      );
    } finally {
      syncLocks.deals = false;
    }

    return result;
  }

  /**
   * Batch fetch associations for multiple deals
   */
  private async batchFetchAssociations(dealIds: string[]): Promise<Map<string, { companyIds: string[]; contactIds: string[] }>> {
    const result = new Map<string, { companyIds: string[]; contactIds: string[] }>();
    
    // Initialize empty associations for all deals
    dealIds.forEach(id => result.set(id, { companyIds: [], contactIds: [] }));

    try {
      // Fetch company associations in batch
      const companyAssocResponse = await fetch(`${this.baseUrl}/associations/deals/companies/batch/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: dealIds.map(id => ({ id })),
        }),
      });

      if (companyAssocResponse.ok) {
        const companyAssocData = await companyAssocResponse.json();
        companyAssocData.results?.forEach((item: any) => {
          const dealId = item.from?.id;
          if (dealId && result.has(dealId)) {
            const existing = result.get(dealId)!;
            existing.companyIds = item.to?.map((t: any) => t.id) || [];
          }
        });
      }

      // Fetch contact associations in batch
      const contactAssocResponse = await fetch(`${this.baseUrl}/associations/deals/contacts/batch/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: dealIds.map(id => ({ id })),
        }),
      });

      if (contactAssocResponse.ok) {
        const contactAssocData = await contactAssocResponse.json();
        contactAssocData.results?.forEach((item: any) => {
          const dealId = item.from?.id;
          if (dealId && result.has(dealId)) {
            const existing = result.get(dealId)!;
            existing.contactIds = item.to?.map((t: any) => t.id) || [];
          }
        });
      }
    } catch (error) {
      console.warn('Error fetching batch associations:', error);
    }

    return result;
  }

  async syncAll(limit?: number): Promise<{
    contacts: SyncResult;
    companies: SyncResult;
    deals: SyncResult;
  }> {
    const [contacts, companies, deals] = await Promise.all([
      this.syncContacts(limit),
      this.syncCompanies(limit),
      this.syncDeals(limit),
    ]);

    return { contacts, companies, deals };
  }

  /**
   * Incremental sync - only syncs records modified since the last sync
   */
  async syncContactsIncremental(maxAgeHours: number = 24): Promise<SyncResult> {
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      const mostRecentSync = await Contact.findOne()
        .sort({ lastSyncedAt: -1 })
        .select('lastSyncedAt')
        .lean();

      let sinceDate: Date;
      if (mostRecentSync?.lastSyncedAt) {
        sinceDate = new Date(mostRecentSync.lastSyncedAt);
      } else {
        sinceDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      }

      const timestamp = sinceDate.getTime();
      const properties = ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company', 'hs_lastmodifieddate'];
      const pageSize = 100;
      let after: string | undefined;
      const bulkOps: any[] = [];

      do {
        const requestBody = {
          filterGroups: [{
            filters: [{
              propertyName: 'hs_lastmodifieddate',
              operator: 'GTE',
              value: timestamp.toString(),
            }],
          }],
          properties,
          limit: pageSize,
          ...(after && { after }),
        };

        const response = await fetch(`${this.baseUrl}/objects/contacts/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const contacts = data.results || [];

        if (contacts.length === 0) break;

        for (const contact of contacts) {
          const hubspotId = contact.id;
          const firstName = contact.properties.firstname || '';
          const lastName = contact.properties.lastname || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Contact';

          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: {
                $set: {
                  hubspotId,
                  firstName,
                  lastName,
                  email: contact.properties.email || '',
                  jobTitle: contact.properties.jobtitle || '',
                  phone: contact.properties.phone || '',
                  company: contact.properties.company || '',
                  fullName,
                  properties: contact.properties,
                  lastSyncedAt: new Date(),
                  syncStatus: 'synced' as const,
                },
              },
              upsert: true,
            },
          });
        }

        after = data.paging?.next?.after;
      } while (after);

      if (bulkOps.length > 0) {
        const bulkResult = await Contact.bulkWrite(bulkOps, { ordered: false });
        result.synced = bulkResult.upsertedCount;
        result.updated = bulkResult.modifiedCount;
      }

      await SyncMetadata.findOneAndUpdate(
        { entityType: 'contacts' },
        { lastIncrementalSyncAt: new Date() },
        { upsert: true }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error in incremental sync contacts:', error);
    }

    return result;
  }

  async syncCompaniesIncremental(maxAgeHours: number = 24): Promise<SyncResult> {
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      const mostRecentSync = await Company.findOne()
        .sort({ lastSyncedAt: -1 })
        .select('lastSyncedAt')
        .lean();

      let sinceDate: Date;
      if (mostRecentSync?.lastSyncedAt) {
        sinceDate = new Date(mostRecentSync.lastSyncedAt);
      } else {
        sinceDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      }

      const timestamp = sinceDate.getTime();
      const properties = ['name', 'domain', 'phone', 'address', 'city', 'state', 'zip', 'industry', 'numberofemployees', 'website', 'hs_lastmodifieddate'];
      const pageSize = 100;
      let after: string | undefined;
      const bulkOps: any[] = [];

      do {
        const requestBody = {
          filterGroups: [{
            filters: [{
              propertyName: 'hs_lastmodifieddate',
              operator: 'GTE',
              value: timestamp.toString(),
            }],
          }],
          properties,
          limit: pageSize,
          ...(after && { after }),
        };

        const response = await fetch(`${this.baseUrl}/objects/companies/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const companies = data.results || [];

        if (companies.length === 0) break;

        for (const company of companies) {
          const hubspotId = company.id;
          
          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: {
                $set: {
                  hubspotId,
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
                  properties: company.properties,
                  lastSyncedAt: new Date(),
                  syncStatus: 'synced' as const,
                },
                // Preserve geocode data - don't overwrite if it exists
                $setOnInsert: {
                  lat: null,
                  lng: null,
                  geocodedAt: null,
                  geocodeError: null,
                },
              },
              upsert: true,
            },
          });
        }

        after = data.paging?.next?.after;
      } while (after);

      if (bulkOps.length > 0) {
        const bulkResult = await Company.bulkWrite(bulkOps, { ordered: false });
        result.synced = bulkResult.upsertedCount;
        result.updated = bulkResult.modifiedCount;
      }

      await SyncMetadata.findOneAndUpdate(
        { entityType: 'companies' },
        { lastIncrementalSyncAt: new Date() },
        { upsert: true }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error in incremental sync companies:', error);
    }

    return result;
  }

  async syncDealsIncremental(maxAgeHours: number = 24): Promise<SyncResult> {
    await connectDB();
    
    const result: SyncResult = {
      success: true,
      synced: 0,
      updated: 0,
      errors: 0,
      errorMessages: [],
    };

    try {
      const mostRecentSync = await Deal.findOne()
        .sort({ lastSyncedAt: -1 })
        .select('lastSyncedAt')
        .lean();

      let sinceDate: Date;
      if (mostRecentSync?.lastSyncedAt) {
        sinceDate = new Date(mostRecentSync.lastSyncedAt);
      } else {
        sinceDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      }

      const timestamp = sinceDate.getTime();
      const properties = [
        'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
        'dealtype', 'hubspot_owner_id', 'hs_lastmodifieddate',
      ];
      const pageSize = 100;
      let after: string | undefined;
      const bulkOps: any[] = [];
      const allDealIds: string[] = [];

      do {
        const requestBody = {
          filterGroups: [{
            filters: [{
              propertyName: 'hs_lastmodifieddate',
              operator: 'GTE',
              value: timestamp.toString(),
            }],
          }],
          properties,
          limit: pageSize,
          ...(after && { after }),
        };

        const response = await fetch(`${this.baseUrl}/objects/deals/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const deals = data.results || [];

        if (deals.length === 0) break;

        allDealIds.push(...deals.map((d: any) => d.id));
        
        // Batch fetch associations
        const associationsMap = await this.batchFetchAssociations(deals.map((d: any) => d.id));

        for (const deal of deals) {
          const hubspotId = deal.id;
          const dealstage = deal.properties.dealstage || '';
          const isWon = dealstage === 'closedwon';
          const isLost = dealstage === 'closedlost';
          const isClosed = isWon || isLost;
          const associations = associationsMap.get(hubspotId) || { companyIds: [], contactIds: [] };

          bulkOps.push({
            updateOne: {
              filter: { hubspotId },
              update: {
                $set: {
                  hubspotId,
                  dealname: deal.properties.dealname || 'Unnamed Deal',
                  amount: deal.properties.amount || '0',
                  dealstage,
                  pipeline: deal.properties.pipeline || 'default',
                  closedate: deal.properties.closedate ? new Date(deal.properties.closedate) : undefined,
                  dealtype: deal.properties.dealtype || '',
                  ownerId: deal.properties.hubspot_owner_id || '',
                  companyIds: associations.companyIds,
                  contactIds: associations.contactIds,
                  isClosed,
                  isWon,
                  isLost,
                  properties: deal.properties,
                  lastSyncedAt: new Date(),
                  syncStatus: 'synced' as const,
                },
              },
              upsert: true,
            },
          });
        }

        after = data.paging?.next?.after;
      } while (after);

      if (bulkOps.length > 0) {
        const bulkResult = await Deal.bulkWrite(bulkOps, { ordered: false });
        result.synced = bulkResult.upsertedCount;
        result.updated = bulkResult.modifiedCount;
      }

      await SyncMetadata.findOneAndUpdate(
        { entityType: 'deals' },
        { lastIncrementalSyncAt: new Date() },
        { upsert: true }
      );

    } catch (error: any) {
      result.success = false;
      result.errorMessages?.push(error.message);
      console.error('Error in incremental sync deals:', error);
    }

    return result;
  }

  async syncAllIncremental(maxAgeHours: number = 24): Promise<{
    contacts: SyncResult;
    companies: SyncResult;
    deals: SyncResult;
  }> {
    const [contacts, companies, deals] = await Promise.all([
      this.syncContactsIncremental(maxAgeHours),
      this.syncCompaniesIncremental(maxAgeHours),
      this.syncDealsIncremental(maxAgeHours),
    ]);

    return { contacts, companies, deals };
  }

  /**
   * Trigger incremental sync in the background (non-blocking)
   */
  triggerIncrementalSync(maxAgeHours: number = 24): void {
    this.syncAllIncremental(maxAgeHours).catch((error) => {
      console.error('Background incremental sync failed:', error);
    });
  }

  /**
   * Ensure data is synced, trigger full sync if needed
   * Returns true if sync was triggered, false if data was already up to date
   */
  async ensureDataSynced(maxAgeHours: number = 24): Promise<{
    triggered: boolean;
    entities: ('contacts' | 'companies' | 'deals')[];
  }> {
    const entitiesToSync: ('contacts' | 'companies' | 'deals')[] = [];

    const [needsContacts, needsCompanies, needsDeals] = await Promise.all([
      this.needsFullSync('contacts', maxAgeHours),
      this.needsFullSync('companies', maxAgeHours),
      this.needsFullSync('deals', maxAgeHours),
    ]);

    if (needsContacts) entitiesToSync.push('contacts');
    if (needsCompanies) entitiesToSync.push('companies');
    if (needsDeals) entitiesToSync.push('deals');

    if (entitiesToSync.length === 0) {
      return { triggered: false, entities: [] };
    }

    // Trigger syncs for entities that need it (non-blocking)
    Promise.all([
      needsContacts ? this.syncContacts() : Promise.resolve(null),
      needsCompanies ? this.syncCompanies() : Promise.resolve(null),
      needsDeals ? this.syncDeals() : Promise.resolve(null),
    ]).catch((error) => {
      console.error('Background full sync failed:', error);
    });

    return { triggered: true, entities: entitiesToSync };
  }
}
