/**
 * Utility functions for generating HubSpot UI links
 */

/**
 * Get HubSpot portal ID from environment variable or fetch from API
 * Falls back to a generic link format if portal ID is not available
 */
async function getPortalId(): Promise<string | null> {
  // Check environment variable first
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  if (portalId) {
    return portalId;
  }

  // Try to fetch from HubSpot API
  try {
    const hubspotApiKey = 
      process.env.HUBSPOT_API_KEY || 
      process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN ||
      process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!hubspotApiKey) {
      return null;
    }

    // Fetch account info to get portal ID
    const response = await fetch('https://api.hubapi.com/integrations/v1/me', {
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.portalId?.toString() || null;
    }
  } catch (error) {
    console.error('Error fetching HubSpot portal ID:', error);
  }

  return null;
}

/**
 * Generate HubSpot company detail page URL
 * Format: https://app.hubspot.com/contacts/{portalId}/record/0-2/{companyId}
 * Object type ID: 0-2 for companies
 */
export function getCompanyLink(companyId: string, portalId?: string | null): string {
  // If portal ID is provided, use it
  if (portalId) {
    return `https://app.hubspot.com/contacts/${portalId}/record/0-2/${companyId}`;
  }
  
  // Fallback: use a format that redirects (HubSpot will handle it)
  return `https://app.hubspot.com/contacts/_/record/0-2/${companyId}`;
}

/**
 * Generate HubSpot contact detail page URL
 * Format: https://app.hubspot.com/contacts/{portalId}/record/0-1/{contactId}
 * Object type ID: 0-1 for contacts
 */
export function getContactLink(contactId: string, portalId?: string | null): string {
  // If portal ID is provided, use it
  if (portalId) {
    return `https://app.hubspot.com/contacts/${portalId}/record/0-1/${contactId}`;
  }
  
  // Fallback: use a format that redirects (HubSpot will handle it)
  return `https://app.hubspot.com/contacts/_/record/0-1/${contactId}`;
}

/**
 * Generate HubSpot deal detail page URL
 * Format: https://app.hubspot.com/sales/{portalId}/record/0-3/{dealId}
 * Object type ID: 0-3 for deals
 */
export function getDealLink(dealId: string, portalId?: string | null): string {
  // If portal ID is provided, use it
  if (portalId) {
    return `https://app.hubspot.com/sales/${portalId}/record/0-3/${dealId}`;
  }
  
  // Fallback: use a format that redirects (HubSpot will handle it)
  return `https://app.hubspot.com/sales/_/record/0-3/${dealId}`;
}

/**
 * Client-side version that doesn't require async portal ID fetching
 * Uses environment variable or fallback format
 */
export function getCompanyLinkClient(companyId: string): string {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  return getCompanyLink(companyId, portalId || null);
}

export function getContactLinkClient(contactId: string): string {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  return getContactLink(contactId, portalId || null);
}

export function getDealLinkClient(dealId: string): string {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  return getDealLink(dealId, portalId || null);
}

