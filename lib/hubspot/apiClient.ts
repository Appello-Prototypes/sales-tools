/**
 * HubSpot API Client
 * 
 * Direct API implementation of HubSpot MCP tools for serverless environments.
 * This replaces the MCP stdio transport with direct HTTP API calls.
 * 
 * Provides the same functionality as @hubspot/mcp-server but works in Vercel/serverless.
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Get HubSpot API access token from environment
 */
function getAccessToken(): string {
  const token = 
    process.env.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN || 
    process.env.PRIVATE_APP_ACCESS_TOKEN ||
    process.env.HUBSPOT_API_KEY ||
    process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error('HubSpot access token not configured. Set HUBSPOT_PRIVATE_APP_ACCESS_TOKEN in environment.');
  }
  
  return token;
}

/**
 * Make authenticated request to HubSpot API
 */
async function hubspotRequest(
  method: string,
  endpoint: string,
  body?: any,
  params?: Record<string, string | number>
): Promise<any> {
  const token = getAccessToken();
  const url = new URL(`${HUBSPOT_API_BASE}${endpoint}`);
  
  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), options);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    throw new Error(
      `HubSpot API error (${response.status}): ${errorData.message || errorText}`
    );
  }
  
  return await response.json();
}

/**
 * HubSpot API Tool: Get User Details
 * Equivalent to hubspot-get-user-details
 */
export async function getHubspotUserDetails(): Promise<any> {
  try {
    const response = await hubspotRequest('GET', '/oauth/v1/access-tokens/me');
    return {
      userId: response.user_id,
      hubId: response.hub_id,
      appId: response.app_id,
      tokenType: response.token_type,
      scopes: response.scopes || [],
      user: response.user || {},
    };
  } catch (error: any) {
    throw new Error(`Failed to get user details: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: List Objects
 * Equivalent to hubspot-list-objects
 */
export async function listHubspotObjects(params: {
  objectType: string;
  limit?: number;
  after?: string;
  properties?: string[];
  associations?: string[];
  archived?: boolean;
}): Promise<any> {
  const { objectType, limit = 100, after, properties, associations, archived = false } = params;
  
  const queryParams: Record<string, string | number> = {
    limit: Math.min(limit, 100), // HubSpot max is 100
    archived: String(archived),
  };
  
  if (after) queryParams.after = after;
  if (properties) queryParams.properties = properties.join(',');
  if (associations) queryParams.associations = associations.join(',');
  
  try {
    const response = await hubspotRequest('GET', `/crm/v3/objects/${objectType}`, undefined, queryParams);
    return {
      results: response.results || [],
      paging: response.paging || {},
    };
  } catch (error: any) {
    throw new Error(`Failed to list ${objectType} objects: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Search Objects
 * Equivalent to hubspot-search-objects
 */
export async function searchHubspotObjects(params: {
  objectType: string;
  query?: string;
  filterGroups?: any[];
  properties?: string[];
  limit?: number;
  after?: string;
  sorts?: Array<{ propertyName: string; direction: 'ASCENDING' | 'DESCENDING' }>;
}): Promise<any> {
  const { objectType, query, filterGroups, properties, limit = 10, after, sorts } = params;
  
  const body: any = {
    limit: Math.min(limit, 100),
  };
  
  if (query) body.query = query;
  if (filterGroups) body.filterGroups = filterGroups;
  if (properties) body.properties = properties;
  if (sorts) body.sorts = sorts;
  if (after) body.after = after;
  
  try {
    const response = await hubspotRequest('POST', `/crm/v3/objects/${objectType}/search`, body);
    return {
      results: response.results || [],
      paging: response.paging || {},
    };
  } catch (error: any) {
    throw new Error(`Failed to search ${objectType} objects: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Batch Read Objects
 * Equivalent to hubspot-batch-read-objects
 */
export async function batchReadHubspotObjects(params: {
  objectType: string;
  inputs: Array<{ id: string }>;
  properties?: string[];
  propertiesWithHistory?: string[];
}): Promise<any> {
  const { objectType, inputs, properties, propertiesWithHistory } = params;
  
  if (inputs.length === 0) {
    return { results: [] };
  }
  
  if (inputs.length > 100) {
    throw new Error('Maximum 100 objects per batch read');
  }
  
  const body: any = {
    inputs: inputs.map(input => ({ id: input.id })),
  };
  
  if (properties) body.properties = properties;
  if (propertiesWithHistory) body.propertiesWithHistory = propertiesWithHistory;
  
  try {
    const response = await hubspotRequest('POST', `/crm/v3/objects/${objectType}/batch/read`, body);
    return {
      results: response.results || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to batch read ${objectType} objects: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: List Associations
 * Equivalent to hubspot-list-associations
 */
export async function listHubspotAssociations(params: {
  objectType: string;
  objectId: string;
  toObjectType: string;
  after?: string;
}): Promise<any> {
  const { objectType, objectId, toObjectType, after } = params;
  
  const queryParams: Record<string, string> = {};
  if (after) queryParams.after = after;
  
  try {
    // HubSpot uses v4 API for associations
    const response = await hubspotRequest(
      'GET',
      `/crm/v4/objects/${objectType}/${objectId}/associations/${toObjectType}`,
      undefined,
      queryParams
    );
    
    // Transform v4 response to match MCP format
    return {
      results: response.results?.map((r: any) => ({
        id: r.toObjectId,
        type: r.toObjectType,
        associationType: r.associationType,
        associationCategory: r.associationCategory,
      })) || [],
      paging: response.paging || {},
    };
  } catch (error: any) {
    throw new Error(`Failed to list associations: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: List Properties
 * Equivalent to hubspot-list-properties
 */
export async function listHubspotProperties(params: {
  objectType: string;
  archived?: boolean;
  includeHidden?: boolean;
}): Promise<any> {
  const { objectType, archived = false, includeHidden = false } = params;
  
  const queryParams: Record<string, string> = {
    archived: String(archived),
    includeHidden: String(includeHidden),
  };
  
  try {
    const response = await hubspotRequest('GET', `/crm/v3/properties/${objectType}`, undefined, queryParams);
    return response;
  } catch (error: any) {
    throw new Error(`Failed to list ${objectType} properties: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Get Property
 * Equivalent to hubspot-get-property
 */
export async function getHubspotProperty(params: {
  objectType: string;
  propertyName: string;
}): Promise<any> {
  const { objectType, propertyName } = params;
  
  try {
    const response = await hubspotRequest('GET', `/crm/v3/properties/${objectType}/${propertyName}`);
    return response;
  } catch (error: any) {
    throw new Error(`Failed to get property ${propertyName}: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Batch Create Objects
 * Equivalent to hubspot-batch-create-objects
 */
export async function batchCreateHubspotObjects(params: {
  objectType: string;
  inputs: Array<{
    properties: Record<string, any>;
    associations?: Array<{
      types: Array<{ associationCategory: string; associationTypeId: number }>;
      to: { id: string };
    }>;
  }>;
}): Promise<any> {
  const { objectType, inputs } = params;
  
  if (inputs.length === 0) {
    throw new Error('At least one object must be provided');
  }
  
  if (inputs.length > 100) {
    throw new Error('Maximum 100 objects per batch create');
  }
  
  const body = { inputs };
  
  try {
    const response = await hubspotRequest('POST', `/crm/v3/objects/${objectType}/batch/create`, body);
    return {
      results: response.results || [],
      errors: response.errors || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to batch create ${objectType} objects: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Batch Update Objects
 * Equivalent to hubspot-batch-update-objects
 */
export async function batchUpdateHubspotObjects(params: {
  objectType: string;
  inputs: Array<{
    id: string;
    properties: Record<string, any>;
  }>;
}): Promise<any> {
  const { objectType, inputs } = params;
  
  if (inputs.length === 0) {
    throw new Error('At least one object must be provided');
  }
  
  if (inputs.length > 100) {
    throw new Error('Maximum 100 objects per batch update');
  }
  
  const body = { inputs };
  
  try {
    const response = await hubspotRequest('POST', `/crm/v3/objects/${objectType}/batch/update`, body);
    return {
      results: response.results || [],
      errors: response.errors || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to batch update ${objectType} objects: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Create Engagement (Note or Task)
 * Equivalent to hubspot-create-engagement
 */
export async function createHubspotEngagement(params: {
  type: 'NOTE' | 'TASK';
  ownerId: number;
  associations: {
    contactIds?: number[];
    companyIds?: number[];
    dealIds?: number[];
    ticketIds?: number[];
    ownerIds?: number[];
  };
  metadata: {
    body?: string; // For NOTE
    subject?: string; // For TASK
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED'; // For TASK
    timestamp?: number;
  };
}): Promise<any> {
  const { type, ownerId, associations, metadata } = params;
  
  const body: any = {
    engagement: {
      type,
      ownerId,
      timestamp: metadata.timestamp || Date.now(),
    },
    associations,
    metadata: {},
  };
  
  if (type === 'NOTE') {
    body.metadata.body = metadata.body || '';
  } else if (type === 'TASK') {
    body.metadata.subject = metadata.subject || '';
    body.metadata.status = metadata.status || 'NOT_STARTED';
    if (metadata.body) body.metadata.body = metadata.body;
  }
  
  try {
    const response = await hubspotRequest('PUT', '/crm/v3/objects/engagements', body);
    return response;
  } catch (error: any) {
    throw new Error(`Failed to create ${type} engagement: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Get Association Definitions
 * Equivalent to hubspot-get-association-definitions
 */
export async function getHubspotAssociationDefinitions(params: {
  fromObjectType: string;
  toObjectType: string;
}): Promise<any> {
  const { fromObjectType, toObjectType } = params;
  
  try {
    const response = await hubspotRequest(
      'GET',
      `/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`
    );
    return {
      results: response.results || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to get association definitions: ${error.message}`);
  }
}

/**
 * HubSpot API Tool: Batch Create Associations
 * Equivalent to hubspot-batch-create-associations
 */
export async function batchCreateHubspotAssociations(params: {
  fromObjectType: string;
  toObjectType: string;
  types: Array<{ associationCategory: string; associationTypeId: number }>;
  inputs: Array<{ from: { id: string }; to: { id: string } }>;
}): Promise<any> {
  const { fromObjectType, toObjectType, types, inputs } = params;
  
  if (inputs.length === 0) {
    throw new Error('At least one association must be provided');
  }
  
  if (inputs.length > 100) {
    throw new Error('Maximum 100 associations per batch');
  }
  
  const body = {
    inputs: inputs.map(input => ({
      from: { id: input.from.id },
      to: { id: input.to.id },
      types,
    })),
  };
  
  try {
    const response = await hubspotRequest(
      'POST',
      `/crm/v4/associations/${fromObjectType}/${toObjectType}/batch/create`,
      body
    );
    return {
      results: response.results || [],
      errors: response.errors || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to batch create associations: ${error.message}`);
  }
}

/**
 * Map of MCP tool names to API functions
 */
export const HUBSPOT_API_TOOLS: Record<string, (params: any) => Promise<any>> = {
  'hubspot-get-user-details': () => getHubspotUserDetails(),
  'hubspot-list-objects': (params: any) => listHubspotObjects(params),
  'hubspot-search-objects': (params: any) => searchHubspotObjects(params),
  'hubspot-batch-read-objects': (params: any) => batchReadHubspotObjects(params),
  'hubspot-list-associations': (params: any) => listHubspotAssociations(params),
  'hubspot-list-properties': (params: any) => listHubspotProperties(params),
  'hubspot-get-property': (params: any) => getHubspotProperty(params),
  'hubspot-batch-create-objects': (params: any) => batchCreateHubspotObjects(params),
  'hubspot-batch-update-objects': (params: any) => batchUpdateHubspotObjects(params),
  'hubspot-create-engagement': (params: any) => createHubspotEngagement(params),
  'hubspot-get-association-definitions': (params: any) => getHubspotAssociationDefinitions(params),
  'hubspot-batch-create-associations': (params: any) => batchCreateHubspotAssociations(params),
};

